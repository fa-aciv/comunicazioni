import { Head } from '@inertiajs/react';

import type {
    ChatActorType,
    ChatSummary,
    EmployeeSummary,
    SelectedChatSummary,
} from '@/components/chat/chat-types';
import { ChatComposer } from '@/components/chat/chat-composer';
import { ChatConversationList } from '@/components/chat/chat-conversation-list';
import { ChatMessageList } from '@/components/chat/chat-message-list';
import { ChatThreadHeader } from '@/components/chat/chat-thread-header';
import { useChatThreadState } from '@/hooks/use-chat-thread-state';
import { Card, CardContent } from '@/components/ui/card';

export type {
    AttachmentSummary,
    ChatActorType,
    ChatMessageSummary,
    ChatSummary,
    CitizenSummary,
    EmployeeSummary,
    SelectedChatSummary,
} from '@/components/chat/chat-types';

interface ChatWorkspaceProps {
    headTitle: string;
    status?: string;
    currentActorId: number;
    currentActorType: ChatActorType;
    pollIntervalSeconds: number;
    totalUnreadMessageCount: number;
    selectedChatId?: number | null;
    conversationSearch?: string;
    conversationListLimit?: number;
    hasMoreConversations?: boolean;
    employees?: EmployeeSummary[];
    chatSummaries: ChatSummary[];
    selectedChat: SelectedChatSummary | null;
    buildChatHref: (chatId: number) => string;
    buildConversationSearchHref: (
        search: string,
        activeChatId: number | null,
    ) => string;
    buildThreadStoreUrl?: () => string;
    buildThreadDestroyUrl?: (chatId: number) => string;
    buildMessageStoreUrl: (chatId: number) => string;
    buildMessageDestroyUrl?: (chatId: number, messageId: number) => string;
    buildParticipantStoreUrl?: (chatId: number) => string;
    buildParticipantDestroyUrl?: (chatId: number, employeeId: number) => string;
    canManageParticipants?: boolean;
}

export function ChatWorkspace({
    headTitle,
    status,
    currentActorId,
    currentActorType,
    pollIntervalSeconds,
    totalUnreadMessageCount,
    selectedChatId,
    conversationSearch = '',
    conversationListLimit = 100,
    hasMoreConversations = false,
    employees = [],
    chatSummaries,
    selectedChat,
    buildChatHref,
    buildConversationSearchHref,
    buildThreadStoreUrl,
    buildThreadDestroyUrl,
    buildMessageStoreUrl,
    buildMessageDestroyUrl,
    buildParticipantStoreUrl,
    buildParticipantDestroyUrl,
    canManageParticipants = false,
}: ChatWorkspaceProps) {
    const {
        activeThreadUnreadCount,
        selectedChatId: activeSelectedChatId,
        selectedMessages,
        messagesViewportRef,
        handleMessagesScroll,
    } = useChatThreadState({
        currentActorId,
        currentActorType,
        selectedChat,
        pollIntervalSeconds,
    });
    const activeChatId = selectedChatId ?? activeSelectedChatId;
    const effectiveTotalUnreadMessageCount =
        totalUnreadMessageCount + activeThreadUnreadCount;
    const pageTitle =
        effectiveTotalUnreadMessageCount > 0
            ? `(${effectiveTotalUnreadMessageCount}) ${headTitle}`
            : headTitle;

    return (
        <>
            <Head title={pageTitle} />

            <div className="flex flex-col gap-4 overflow-hidden rounded-xl p-4">
                {status ? (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                        {status}
                    </div>
                ) : null}

                <div className="min-h-0 flex-1">
                    <div className="flex h-full w-full flex-col-reverse items-stretch gap-2 p-1 sm:flex-row">
                        <ChatConversationList
                            chatSummaries={chatSummaries}
                            activeChatId={activeChatId}
                            activeThreadUnreadCount={activeThreadUnreadCount}
                            conversationSearch={conversationSearch}
                            conversationListLimit={conversationListLimit}
                            hasMoreConversations={hasMoreConversations}
                            buildChatHref={buildChatHref}
                            buildConversationSearchHref={buildConversationSearchHref}
                            canCreateChats={canManageParticipants}
                            buildThreadStoreUrl={buildThreadStoreUrl}
                        />

                        <main className="flex h-[calc(100dvh-6rem)] min-h-0 flex-col self-stretch sm:min-w-sm sm:flex-2 sm:shadow-sm">
                            <Card className="flex h-full flex-col rounded-sm">
                                <ChatThreadHeader
                                    key={selectedChat?.id ?? 'no-chat'}
                                    selectedChat={selectedChat}
                                    employees={employees}
                                    currentActorId={currentActorId}
                                    canManageParticipants={canManageParticipants}
                                    buildThreadDestroyUrl={buildThreadDestroyUrl}
                                    buildParticipantStoreUrl={buildParticipantStoreUrl}
                                    buildParticipantDestroyUrl={buildParticipantDestroyUrl}
                                />

                                <CardContent className="flex flex-1 flex-col gap-2 overflow-hidden">
                                    <ChatMessageList
                                        selectedChat={selectedChat}
                                        messages={selectedMessages}
                                        currentActorId={currentActorId}
                                        currentActorType={currentActorType}
                                        buildMessageDestroyUrl={buildMessageDestroyUrl}
                                        messagesViewportRef={messagesViewportRef}
                                        onScroll={handleMessagesScroll}
                                    />

                                    <ChatComposer
                                        selectedChat={selectedChat}
                                        buildMessageStoreUrl={buildMessageStoreUrl}
                                    />
                                </CardContent>
                            </Card>
                        </main>
                    </div>
                </div>
            </div>
        </>
    );
}
