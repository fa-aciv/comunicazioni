import { usePoll } from '@inertiajs/react';
import { useEffect, useReducer, useRef, type UIEvent } from 'react';

import type {
    ChatActorType,
    ChatMessageSummary,
    SelectedChatSummary,
} from '@/components/chat/chat-types';

const SCROLL_BOTTOM_THRESHOLD = 24;
const EMPTY_MESSAGES: ChatMessageSummary[] = [];

type ChatSnapshot = {
    chatId: number | null;
    messageIds: number[];
};

interface UseChatThreadStateOptions {
    currentActorId: number;
    currentActorType: ChatActorType;
    selectedChat: SelectedChatSummary | null;
    pollIntervalSeconds: number;
}

type UnreadCountAction =
    | { type: 'increment'; amount: number }
    | { type: 'reset' };

// The hook keeps all the "thread behavior" together: polling, unread tracking
// and the decision of when the viewport should auto-scroll to the latest message.
export function useChatThreadState({
    currentActorId,
    currentActorType,
    selectedChat,
    pollIntervalSeconds,
}: UseChatThreadStateOptions) {
    const selectedChatId = selectedChat?.id ?? null;
    const selectedMessages = selectedChat?.messages ?? EMPTY_MESSAGES;
    const messagesViewportRef = useRef<HTMLDivElement>(null);
    const previousSnapshotRef = useRef<ChatSnapshot>(
        buildChatSnapshot(selectedChatId, selectedMessages),
    );
    const isTabFocusedRef = useRef(getIsTabFocused());
    const shouldAutoScrollRef = useRef(selectedChatId !== null);
    const isAtBottomRef = useRef(true);
    const [unreadCount, dispatchUnreadCount] = useReducer(unreadCountReducer, 0);

    usePoll(Math.max(pollIntervalSeconds, 1) * 1000, {}, {
        autoStart: pollIntervalSeconds > 0,
        keepAlive: false,
    });

    useEffect(() => {
        if (typeof window === 'undefined' || typeof document === 'undefined') {
            return;
        }

        // Unread messages are cleared only when the user comes back to the tab
        // and is already looking at the bottom of the thread.
        const updateTabFocus = () => {
            const isFocused = getIsTabFocused();
            const wasFocused = isTabFocusedRef.current;

            isTabFocusedRef.current = isFocused;

            if (isFocused && !wasFocused && isAtBottomRef.current) {
                dispatchUnreadCount({ type: 'reset' });
            }
        };

        window.addEventListener('focus', updateTabFocus);
        window.addEventListener('blur', updateTabFocus);
        document.addEventListener('visibilitychange', updateTabFocus);

        return () => {
            window.removeEventListener('focus', updateTabFocus);
            window.removeEventListener('blur', updateTabFocus);
            document.removeEventListener('visibilitychange', updateTabFocus);
        };
    }, []);

    useEffect(() => {
        const currentSnapshot = buildChatSnapshot(selectedChatId, selectedMessages);
        const previousSnapshot = previousSnapshotRef.current;

        // Switching chat resets the local unread counter and requests one scroll
        // to the bottom after the newly selected thread renders.
        if (currentSnapshot.chatId !== previousSnapshot.chatId) {
            previousSnapshotRef.current = currentSnapshot;
            shouldAutoScrollRef.current = currentSnapshot.chatId !== null;
            isAtBottomRef.current = true;
            dispatchUnreadCount({ type: 'reset' });

            return;
        }

        if (currentSnapshot.chatId === null) {
            previousSnapshotRef.current = currentSnapshot;
            dispatchUnreadCount({ type: 'reset' });

            return;
        }

        const newMessages = getNewMessages(selectedMessages, previousSnapshot);

        if (newMessages.length === 0) {
            previousSnapshotRef.current = currentSnapshot;

            return;
        }

        const newIncomingMessages = newMessages.filter(
            (message) =>
                !isMessageFromCurrentActor(
                    message,
                    currentActorType,
                    currentActorId,
                ),
        );
        const shouldKeepMessagesUnread = !isTabFocusedRef.current;

        if (shouldKeepMessagesUnread && newIncomingMessages.length > 0) {
            if (isAtBottomRef.current) {
                shouldAutoScrollRef.current = true;
            }

            dispatchUnreadCount({
                type: 'increment',
                amount: newIncomingMessages.length,
            });
        } else if (isAtBottomRef.current) {
            shouldAutoScrollRef.current = true;
            dispatchUnreadCount({ type: 'reset' });
        } else if (newIncomingMessages.length > 0) {
            dispatchUnreadCount({
                type: 'increment',
                amount: newIncomingMessages.length,
            });
        }

        previousSnapshotRef.current = currentSnapshot;
    }, [currentActorId, currentActorType, selectedChatId, selectedMessages]);

    useEffect(() => {
        if (!shouldAutoScrollRef.current) {
            return;
        }

        const viewport = messagesViewportRef.current;

        if (!viewport) {
            return;
        }

        shouldAutoScrollRef.current = false;

        // Wait for the new message nodes to be in the DOM before using scrollHeight.
        const frameId = window.requestAnimationFrame(() => {
            viewport.scrollTop = viewport.scrollHeight;
            isAtBottomRef.current = true;

            if (isTabFocusedRef.current) {
                dispatchUnreadCount({ type: 'reset' });
            }
        });

        return () => window.cancelAnimationFrame(frameId);
    }, [selectedChatId, selectedMessages.length]);

    const handleMessagesScroll = (event: UIEvent<HTMLDivElement>) => {
        const viewport = event.currentTarget;
        const isAtBottom = isViewportAtBottom(viewport);

        isAtBottomRef.current = isAtBottom;

        if (isAtBottom && unreadCount > 0 && isTabFocusedRef.current) {
            dispatchUnreadCount({ type: 'reset' });
        }
    };

    return {
        activeThreadUnreadCount: unreadCount,
        selectedChatId,
        selectedMessages,
        messagesViewportRef,
        handleMessagesScroll,
    };
}

function unreadCountReducer(
    currentUnreadCount: number,
    action: UnreadCountAction,
) {
    switch (action.type) {
        case 'increment':
            return currentUnreadCount + action.amount;
        case 'reset':
            return 0;
    }
}

function buildChatSnapshot(
    chatId: number | null,
    messages: ChatMessageSummary[],
): ChatSnapshot {
    return {
        chatId,
        messageIds: messages.map((message) => message.id),
    };
}

function getNewMessages(
    messages: ChatMessageSummary[],
    previousSnapshot: ChatSnapshot,
) {
    const previousMessageIdSet = new Set(previousSnapshot.messageIds);

    return messages.filter((message) => !previousMessageIdSet.has(message.id));
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

function isViewportAtBottom(viewport: HTMLDivElement) {
    return (
        viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight <=
        SCROLL_BOTTOM_THRESHOLD
    );
}

function getIsTabFocused() {
    if (typeof document === 'undefined') {
        return true;
    }

    return document.visibilityState === 'visible' && document.hasFocus();
}
