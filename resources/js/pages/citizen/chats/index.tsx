import {
    ChatWorkspace,
    type ChatSummary,
    type SelectedChatSummary,
} from '@/components/chat/chat-workspace';
import AppLayout from '@/layouts/app-layout';
import citizen from '@/routes/citizen';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: citizen.dashboard().url,
    },
    {
        title: 'Chat',
        href: citizen.chats.index().url,
    },
];

interface CitizenChatsPageProps {
    status?: string;
    currentCitizenId: number;
    pollIntervalSeconds: number;
    selectedChatId?: number | null;
    chatSummaries: ChatSummary[];
    selectedChat: SelectedChatSummary | null;
}

export default function CitizenChatsPage({
    status,
    currentCitizenId,
    pollIntervalSeconds,
    selectedChatId,
    chatSummaries,
    selectedChat,
}: CitizenChatsPageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <ChatWorkspace
                headTitle="Chat cittadini"
                status={status}
                currentActorId={currentCitizenId}
                currentActorType="Citizen"
                pollIntervalSeconds={pollIntervalSeconds}
                selectedChatId={selectedChatId}
                chatSummaries={chatSummaries}
                selectedChat={selectedChat}
                buildChatHref={(chatId) =>
                    citizen.chats.index.url({
                        query: { chat: chatId },
                    })
                }
                buildMessageStoreUrl={(chatId) =>
                    citizen.chats.messages.store.url({ chat: chatId })
                }
            />
        </AppLayout>
    );
}
