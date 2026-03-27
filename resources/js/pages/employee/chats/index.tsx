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
    conversationSearch?: string;
    conversationListLimit: number;
    hasMoreConversations: boolean;
    employees: EmployeeSummary[];
    chatSummaries: ChatSummary[];
    selectedChat: SelectedChatSummary | null;
}

export default function EmployeeChatsPage({
    status,
    currentEmployeeId,
    pollIntervalSeconds,
    selectedChatId,
    conversationSearch,
    conversationListLimit,
    hasMoreConversations,
    employees,
    chatSummaries,
    selectedChat,
}: EmployeeChatsProps) {
    return (
        <AppLayout>
            <ChatWorkspace
                headTitle="Chat dipendenti"
                status={status}
                currentActorId={currentEmployeeId}
                currentActorType="User"
                pollIntervalSeconds={pollIntervalSeconds}
                selectedChatId={selectedChatId}
                conversationSearch={conversationSearch}
                conversationListLimit={conversationListLimit}
                hasMoreConversations={hasMoreConversations}
                employees={employees}
                chatSummaries={chatSummaries}
                selectedChat={selectedChat}
                buildChatHref={(chatId) =>
                    employee.chats.index.url({
                        query: {
                            chat: chatId,
                            ...(conversationSearch ? { search: conversationSearch } : {}),
                        },
                    })
                }
                buildConversationSearchHref={(search, chatId) =>
                    employee.chats.index.url({
                        query: {
                            ...(chatId ? { chat: chatId } : {}),
                            ...(search ? { search } : {}),
                        },
                    })
                }
                buildThreadStoreUrl={() => employee.chats.store.url()}
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
