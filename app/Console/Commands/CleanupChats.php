<?php

namespace App\Console\Commands;

use App\Actions\Chat\RunChatRetentionCleanup;
use App\Models\ChatRetentionSetting;
use Illuminate\Console\Command;

class CleanupChats extends Command
{
    protected $signature = 'chats:cleanup {--dry-run : Show what would be deleted without deleting anything}';

    protected $description = 'Delete expired chat messages and inactive chat threads according to retention settings.';

    public function handle(RunChatRetentionCleanup $cleanup): int
    {
        $settings = ChatRetentionSetting::current();
        $dryRun = (bool) $this->option('dry-run');

        $this->info(sprintf(
            'Retention attiva: messaggi dopo %d giorni, chat inattive dopo %d giorni.%s',
            $settings->message_retention_days,
            $settings->inactive_thread_retention_days,
            $dryRun ? ' Modalità dry-run.' : ''
        ));

        $result = $cleanup->handle($settings, $dryRun);

        $this->info("Chat eliminate: {$result['deleted_threads']}");
        $this->info("Messaggi eliminati: {$result['deleted_messages']}");

        if (! $dryRun) {
            $this->info('Pulizia completata con successo.');
        }

        return self::SUCCESS;
    }
}
