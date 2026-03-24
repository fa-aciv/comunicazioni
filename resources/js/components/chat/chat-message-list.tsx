import { type RefObject, type UIEvent } from 'react';

import type {
    ChatActorType,
    ChatMessageSummary,
    SelectedChatSummary,
} from '@/components/chat/chat-types';
import MessageBubble from '@/components/ui/chat/MessaggeBubble';

interface ChatMessageListProps {
    selectedChat: SelectedChatSummary | null;
    messages: ChatMessageSummary[];
    currentActorId: number;
    currentActorType: ChatActorType;
    messagesViewportRef: RefObject<HTMLDivElement | null>;
    onScroll: (event: UIEvent<HTMLDivElement>) => void;
}

export function ChatMessageList({
    selectedChat,
    messages,
    currentActorId,
    currentActorType,
    messagesViewportRef,
    onScroll,
}: ChatMessageListProps) {
    return (
        <div
            ref={messagesViewportRef}
            onScroll={onScroll}
            className="flex-1 overflow-auto rounded-sm border bg-gray-100/50 dark:bg-card"
        >
            {selectedChat ? (
                messages.length > 0 ? (
                    <div className="flex min-h-full flex-col justify-end gap-2 p-2">
                        {messages.map((message) => (
                            <MessageBubble
                                key={message.id}
                                variant={
                                    isMessageFromCurrentActor(
                                        message,
                                        currentActorType,
                                        currentActorId,
                                    )
                                        ? 'author'
                                        : 'other'
                                }
                                authorName={resolveAuthorName(
                                    message.author.name,
                                    message.author.type,
                                )}
                                timestamp={formatChatTimestamp(message.created_at)}
                                attachments={message.attachments}
                            >
                                {message.content}
                            </MessageBubble>
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
