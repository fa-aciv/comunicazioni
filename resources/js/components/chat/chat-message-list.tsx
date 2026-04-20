import { router } from '@inertiajs/react';
import { type RefObject, type UIEvent, useState } from 'react';

import type {
    ChatActorType,
    ChatMessageSummary,
    SelectedChatSummary,
} from '@/components/chat/chat-types';
import MessageBubble from '@/components/chat/message-bubble';

const MESSAGE_GROUP_WINDOW_MS = 5 * 60 * 1000;

interface ChatMessageListProps {
    selectedChat: SelectedChatSummary | null;
    messages: ChatMessageSummary[];
    currentActorId: number;
    currentActorType: ChatActorType;
    buildMessageDestroyUrl?: (chatId: number, messageId: number) => string;
    messagesViewportRef: RefObject<HTMLDivElement | null>;
    onScroll: (event: UIEvent<HTMLDivElement>) => void;
}

export function ChatMessageList({
    selectedChat,
    messages,
    currentActorId,
    currentActorType,
    buildMessageDestroyUrl,
    messagesViewportRef,
    onScroll,
}: ChatMessageListProps) {
    const [deletingMessageId, setDeletingMessageId] = useState<number | null>(null);
    const groupedMessages = groupMessages(messages);

    const handleDeleteMessage = (messageId: number) => {
        if (!selectedChat || !buildMessageDestroyUrl || deletingMessageId !== null) {
            return;
        }

        setDeletingMessageId(messageId);

        router.delete(buildMessageDestroyUrl(selectedChat.id, messageId), {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setDeletingMessageId(null),
        });
    };

    return (
        <div
            ref={messagesViewportRef}
            onScroll={onScroll}
            className="flex-1 overflow-auto rounded-sm border bg-gray-100/50 dark:bg-card"
        >
            {selectedChat ? (
                messages.length > 0 ? (
                    <div className="flex min-h-full flex-col justify-end gap-2 p-2">
                        {groupedMessages.map((messageGroup) => (
                            <MessageBubble
                                key={messageGroup.id}
                                variant={
                                    isMessageFromCurrentActor(
                                        messageGroup.messages[0],
                                        currentActorType,
                                        currentActorId,
                                    )
                                        ? 'author'
                                        : 'other'
                                }
                                authorName={resolveAuthorName(
                                    messageGroup.messages[0].author.name,
                                    messageGroup.messages[0].author.type,
                                )}
                                timestamp={formatChatTimestamp(messageGroup.timestamp)}
                                messages={messageGroup.messages.map((message) => ({
                                    id: message.id,
                                    content: message.content,
                                    attachments: message.attachments,
                                    detailedTimestamp: formatChatTimestamp(
                                        message.created_at,
                                    ),
                                    canDelete:
                                        isMessageFromCurrentActor(
                                            message,
                                            currentActorType,
                                            currentActorId,
                                        ) && !!buildMessageDestroyUrl,
                                    isDeleting: deletingMessageId === message.id,
                                    onDelete: () => handleDeleteMessage(message.id),
                                }))}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
                        Nessun messaggio ancora presente.
                    </div>
                )
            ) : (
                <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
                    Seleziona una conversazione per visualizzare i messaggi.
                </div>
            )}
        </div>
    );
}

function isMessageFromCurrentActor(
    message: ChatMessageSummary,
    currentActorType: ChatActorType,
    currentActorId: number,
) {
    return (
        message.author.type === currentActorType &&
        message.author.id === currentActorId
    );
}

function resolveAuthorName(name?: string | null, type?: string) {
    if (name) {
        return name;
    }

    return type === 'Citizen' ? 'Cittadino' : 'Dipendente';
}

function formatChatTimestamp(value?: string | null) {
    if (!value) {
        return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return new Intl.DateTimeFormat('it-IT', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: 'Europe/Rome',
    }).format(date);
}

type MessageGroup = {
    id: number;
    timestamp?: string | null;
    messages: ChatMessageSummary[];
};

function groupMessages(messages: ChatMessageSummary[]): MessageGroup[] {
    const groups: MessageGroup[] = [];

    for (const message of messages) {
        const previousGroup = groups.at(-1);

        if (
            previousGroup &&
            canGroupMessages(previousGroup, message)
        ) {
            previousGroup.messages.push(message);
            continue;
        }

        groups.push({
            id: message.id,
            timestamp: message.created_at,
            messages: [message],
        });
    }

    return groups;
}

function canGroupMessages(group: MessageGroup, nextMessage: ChatMessageSummary) {
    const firstGroupMessage = group.messages[0];

    if (!areMessagesFromSameAuthor(firstGroupMessage, nextMessage)) {
        return false;
    }

    const previousTimestamp = parseTimestamp(firstGroupMessage.created_at);
    const nextTimestamp = parseTimestamp(nextMessage.created_at);

    if (previousTimestamp === null || nextTimestamp === null) {
        return false;
    }

    return nextTimestamp - previousTimestamp < MESSAGE_GROUP_WINDOW_MS;
}

function areMessagesFromSameAuthor(
    previousMessage: ChatMessageSummary,
    nextMessage: ChatMessageSummary,
) {
    const previousAuthor = previousMessage.author;
    const nextAuthor = nextMessage.author;

    if (
        previousAuthor.id !== undefined &&
        previousAuthor.id !== null &&
        nextAuthor.id !== undefined &&
        nextAuthor.id !== null
    ) {
        return (
            previousAuthor.type === nextAuthor.type &&
            previousAuthor.id === nextAuthor.id
        );
    }

    return (
        previousAuthor.type === nextAuthor.type &&
        previousAuthor.name === nextAuthor.name
    );
}

function parseTimestamp(value?: string | null) {
    if (!value) {
        return null;
    }

    const parsed = new Date(value).getTime();

    return Number.isNaN(parsed) ? null : parsed;
}
