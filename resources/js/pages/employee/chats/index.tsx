import {
    ChatWorkspace,
    type ChatSummary,
    type EmployeeSummary,
    type SelectedChatSummary,
} from '@/components/chat/chat-workspace';
import AppLayout from '@/layouts/app-layout';
import employee from '@/routes/employee';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: employee.dashboard().url,
    },
    {
        title: 'Chat',
        href: employee.chats.index().url,
    },
];

interface EmployeeChatsProps {
    status?: string;
    currentEmployeeId: number;
    pollIntervalSeconds: number;
    selectedChatId?: number | null;
    employees: EmployeeSummary[];
    chatSummaries: ChatSummary[];
    selectedChat: SelectedChatSummary | null;
}

export default function EmployeeChatsPage({
    status,
    currentEmployeeId,
    pollIntervalSeconds,
    selectedChatId,
    employees,
    chatSummaries,
    selectedChat,
}: EmployeeChatsProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <ChatWorkspace
                headTitle="Chat dipendenti"
                status={status}
                currentActorId={currentEmployeeId}
                currentActorType="User"
                pollIntervalSeconds={pollIntervalSeconds}
                selectedChatId={selectedChatId}
                employees={employees}
                chatSummaries={chatSummaries}
                selectedChat={selectedChat}
                buildChatHref={(chatId) =>
                    employee.chats.index.url({
                        query: { chat: chatId },
                    })
                }
                buildMessageStoreUrl={(chatId) =>
                    employee.chats.messages.store.url({ chat: chatId })
                }
                buildParticipantStoreUrl={(chatId) =>
                    employee.chats.participants.store.url({ chat: chatId })
                }
                buildParticipantDestroyUrl={(chatId, employeeId) =>
                    employee.chats.participants.destroy.url({
                        chat: chatId,
                        employee: employeeId,
                    })
                }
                canManageParticipants
            />
        </AppLayout>
    );
}
