<?php

namespace App\Http\Controllers;

use App\Actions\Chat\AddEmployeeParticipant;
use App\Actions\Chat\CreateChatThread;
use App\Actions\Chat\RemoveEmployeeParticipant;
use App\Actions\Chat\StoreChatMessage;
use App\Http\Controllers\Concerns\ResolvesGuardActor;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class ChatController extends Controller
{
    use ResolvesGuardActor;

    public function storeThread(Request $request, CreateChatThread $action): JsonResponse|RedirectResponse
    {
        /** @var User|null $employee */
        $employee = Auth::guard('employee')->user();

        abort_unless($employee instanceof User, 403);

        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'citizen_identifier' => ['nullable', 'string', 'max:255'],
            'citizen_email' => ['nullable', 'email:rfc', 'max:255'],
            'citizen_phone_number' => ['nullable', 'string', 'max:30', 'regex:/^\+?[0-9]+$/'],
            'citizen_fiscal_code' => ['nullable', 'string', 'size:16', 'regex:/^[A-Z0-9]{16}$/'],
            'employee_ids' => ['nullable', 'array'],
            'employee_ids.*' => ['integer', 'distinct'],
        ]);

        $this->ensureCitizenIdentifierProvided($validated);

        $thread = $action->handle($employee, $validated);

        if ($request->expectsJson()) {
            return response()->json([
                'thread' => $thread,
                'message' => 'Chat creata correttamente.',
            ], 201);
        }

        return redirect()
            ->route('employee.chats.index', ['chat' => $thread->id])
            ->with('status', 'Chat creata correttamente.');
    }

    public function storeMessage(
        Request $request,
        int|string $chat,
        StoreChatMessage $action
    ): JsonResponse|RedirectResponse 
    {
        $validated = $request->validate([
            'content' => ['nullable', 'string'],
            'attachments' => ['nullable', 'array', 'max:5'],
            'attachments.*' => ['file', 'max:20480', 
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (!$value instanceof UploadedFile) {
                        return;
                    }

                    $mimeType = $value->getMimeType() ?? '';

                    if ($mimeType === 'application/pdf' || str_starts_with($mimeType, 'image/')) {
                        return;
                    }

                    $fail('Sono ammessi solo PDF ed immagini.');
                }
            ],
        ]);

        $this->ensureMessageHasContentOrAttachments($validated);

        $actor = $this->resolveGuardActor($request);

        $message = $action->handle(
            $chat,
            $actor,
            $validated['content'] ?? null,
            $validated['attachments'] ?? []
        );

        if ($request->expectsJson()) {
            return response()->json([
                'message' => $message,
                'status' => 'Messaggio inviato correttamente.',
            ], 201);
        }

        if ($actor instanceof User) {
            return redirect()
                ->route('employee.chats.index', ['chat' => $chat])
                ->with('status', 'Messaggio inviato correttamente.');
        }

        return back()->with('status', 'Messaggio inviato correttamente.');
    }

    public function storeParticipant(
        Request $request,
        int|string $chat,
        AddEmployeeParticipant $action
    ): JsonResponse|RedirectResponse {
        /** @var User|null $employee */
        $employee = Auth::guard('employee')->user();

        abort_unless($employee instanceof User, 403);

        $validated = $request->validate([
            'employee_id' => ['required', 'integer'],
        ]);

        $thread = $action->handle($chat, $employee, (int) $validated['employee_id']);

        if ($request->expectsJson()) {
            return response()->json([
                'thread' => $thread,
                'status' => 'Partecipante aggiunto correttamente.',
            ], 201);
        }

        return redirect()
            ->route('employee.chats.index', ['chat' => $thread->id])
            ->with('status', 'Partecipante aggiunto correttamente.');
    }

    public function destroyParticipant(
        Request $request,
        int|string $chat,
        int|string $employee,
        RemoveEmployeeParticipant $action
    ): JsonResponse|RedirectResponse {
        /** @var User|null $actor */
        $actor = Auth::guard('employee')->user();

        abort_unless($actor instanceof User, 403);

        $thread = $action->handle($chat, $actor, (int) $employee);

        if ($request->expectsJson()) {
            return response()->json([
                'thread' => $thread,
                'status' => 'Partecipante rimosso correttamente.',
            ]);
        }

        return redirect()
            ->route('employee.chats.index', ['chat' => $thread->id])
            ->with('status', 'Partecipante rimosso correttamente.');
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function ensureCitizenIdentifierProvided(array $validated): void
    {
        $filled = collect([
            $validated['citizen_identifier'] ?? null,
            $validated['citizen_email'] ?? null,
            $validated['citizen_phone_number'] ?? null,
            $validated['citizen_fiscal_code'] ?? null,
        ])->filter(fn (mixed $value) => filled($value));

        if ($filled->isNotEmpty()) {
            return;
        }

        throw ValidationException::withMessages([
            'citizen_identifier' => 'Inserisci email, telefono o codice fiscale del cittadino.',
        ]);
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function ensureMessageHasContentOrAttachments(array $validated): void
    {
        $hasContent = filled($validated['content'] ?? null);
        $hasAttachments = !empty($validated['attachments'] ?? []);

        if ($hasContent || $hasAttachments) {
            return;
        }

        throw ValidationException::withMessages([
            'content' => 'Inserisci un messaggio o allega almeno un file.',
        ]);
    }
}
