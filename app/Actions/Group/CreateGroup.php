<?php

namespace App\Actions\Group;

use App\Models\ChatRetentionSetting;
use App\Models\Group;
use App\Models\GroupMembership;
use App\Models\User;
use App\Services\GroupPermissionService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CreateGroup
{
    public function __construct(
        private readonly GroupPermissionService $groupPermissions
    ) {
    }

    /**
     * @param  list<int>  $managerIds
     */
    public function handle(User $actor, string $name, ?string $description, array $managerIds): Group
    {
        if (! $actor->can('groups.create')) {
            throw ValidationException::withMessages([
                'name' => 'Non puoi creare nuovi gruppi.',
            ]);
        }

        $managerIds = collect($managerIds)
            ->map(fn (mixed $id) => (int) $id)
            ->filter(fn (int $id) => $id > 0)
            ->unique()
            ->values();

        if ($managerIds->isEmpty()) {
            throw ValidationException::withMessages([
                'manager_ids' => 'Seleziona almeno un manager per il gruppo.',
            ]);
        }

        $managers = User::query()
            ->whereIn('id', $managerIds)
            ->get();

        if ($managers->count() !== $managerIds->count()) {
            throw ValidationException::withMessages([
                'manager_ids' => 'Uno o più manager selezionati non esistono.',
            ]);
        }

        $retentionSettings = ChatRetentionSetting::current();
        $managerRole = $this->groupPermissions->defaultManagerRole();

        if (! $managerRole) {
            throw ValidationException::withMessages([
                'manager_ids' => 'Configura almeno un ruolo manager prima di creare nuovi gruppi.',
            ]);
        }

        return DB::transaction(function () use ($name, $description, $managers, $retentionSettings, $managerRole): Group {
            $group = Group::query()->create([
                'name' => trim($name),
                'description' => filled($description) ? trim((string) $description) : null,
                'is_active' => true,
                'chat_message_retention_days' => $retentionSettings->message_retention_days,
                'chat_inactive_thread_retention_days' => $retentionSettings->inactive_thread_retention_days,
            ]);

            $managers->each(function (User $manager) use ($group, $managerRole): void {
                GroupMembership::query()->create([
                    'group_id' => $group->getKey(),
                    'user_id' => $manager->getKey(),
                    'group_role_id' => $managerRole->getKey(),
                    'role' => $managerRole->key,
                ]);
            });

            return $group->load(['memberships.user', 'memberships.groupRole.permissions']);
        });
    }
}
