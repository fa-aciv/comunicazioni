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
    selectedChatId?: number | null;
    employees?: EmployeeSummary[];
    chatSummaries: ChatSummary[];
    selectedChat: SelectedChatSummary | null;
    buildChatHref: (chatId: number) => string;
    buildThreadStoreUrl?: () => string;
    buildMessageStoreUrl: (chatId: number) => string;
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
    selectedChatId,
    employees = [],
    chatSummaries,
    selectedChat,
    buildChatHref,
    buildThreadStoreUrl,
    buildMessageStoreUrl,
    buildParticipantStoreUrl,
    buildParticipantDestroyUrl,
    canManageParticipants = false,
}: ChatWorkspaceProps) {
    const {
        pageTitle,
        selectedChatId: activeSelectedChatId,
        selectedMessages,
        messagesViewportRef,
        handleMessagesScroll,
    } = useChatThreadState({
        headTitle,
        currentActorId,
        currentActorType,
        selectedChat,
        pollIntervalSeconds,
    });
    const activeChatId = selectedChatId ?? activeSelectedChatId;

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
                            buildChatHref={buildChatHref}
                            canCreateChats={canManageParticipants}
                            buildThreadStoreUrl={buildThreadStoreUrl}
                        />

                        <main className="flex h-[calc(100dvh-6rem)] min-h-0 flex-col self-stretch sm:min-w-sm sm:flex-2 sm:shadow-sm">
                            <Card className="flex h-full flex-col rounded-sm">
                                <ChatThreadHeader
                                    selectedChat={selectedChat}
                                    employees={employees}
                                    currentActorId={currentActorId}
                                    canManageParticipants={canManageParticipants}
                                    buildParticipantStoreUrl={buildParticipantStoreUrl}
                                    buildParticipantDestroyUrl={buildParticipantDestroyUrl}
                                />

                                <CardContent className="flex flex-1 flex-col gap-2 overflow-hidden">
                                    <ChatMessageList
                                        selectedChat={selectedChat}
                                        messages={selectedMessages}
                                        currentActorId={currentActorId}
                                        currentActorType={currentActorType}
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
