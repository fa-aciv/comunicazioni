<?php

namespace App\Console\Commands;

use App\Actions\Notification\SendEmployeeEmailNotificationReminders;
use Illuminate\Console\Command;

class SendEmployeeEmailNotificationRemindersCommand extends Command
{
    protected $signature = 'employees:send-email-notification-reminders';

    protected $description = 'Send configured email reminders for unread chats and pending group contact requests.';

    public function handle(SendEmployeeEmailNotificationReminders $action): int
    {
        $result = $action->handle();

        $this->info("Promemoria chat inviati a: {$result['unread_chat_recipients']}");
        $this->info("Promemoria richieste di contatto inviati a: {$result['group_contact_request_recipients']}");

        return self::SUCCESS;
    }
}
