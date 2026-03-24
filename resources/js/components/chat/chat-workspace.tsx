import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChatMessageTextarea } from '@/components/ui/chat/ChatMessageTextarea';
import ChatThreadItem from '@/components/ui/chat/ChatThreadItem';
import MessageBubble from '@/components/ui/chat/MessaggeBubble';
import ParticipantBadge from '@/components/ui/chat/ParticipantBadge';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Head, Link, useForm, usePoll } from '@inertiajs/react';
import { Search, UserPlus } from 'lucide-react';
import { type ChangeEvent, type UIEvent, useEffect, useRef, useState } from 'react';

export interface EmployeeSummary {
    id: number;
    name: string;
    email: string;
    department_name?: string;
}

export interface CitizenSummary {
    id: number;
    name: string;
    email: string;
    phone_number: string;
    fiscal_code: string;
}

export interface ChatSummary {
    id: number;
    title: string;
    latest_message_date?: string | null;
    latest_message_preview: string;
    message_count: number;
    latest_message_author?: {
        id?: number | null;
        type: string;
        name?: string | null;
    } | null;
    citizen: CitizenSummary | null;
    employee_count: number;
}

export interface AttachmentSummary {
    id: number;
    file_name: string;
    kind: 'image' | 'pdf' | 'file';
    preview_url: string;
    download_url: string;
}

export interface ChatMessageSummary {
    id: number;
    content: string;
    created_at?: string | null;
    author: {
        id?: number | null;
        type: string;
        name?: string | null;
        email?: string | null;
    };
    attachments: AttachmentSummary[];
}

export interface SelectedChatSummary {
    id: number;
    title: string;
    latest_message_date?: string | null;
    citizen: CitizenSummary | null;
    employees: EmployeeSummary[];
    messages: ChatMessageSummary[];
}

interface ChatWorkspaceProps {
    headTitle: string;
    status?: string;
    currentActorId: number;
    currentActorType: 'User' | 'Citizen';
    pollIntervalSeconds: number;
    selectedChatId?: number | null;
    chatSummaries: ChatSummary[];
    selectedChat: SelectedChatSummary | null;
    buildChatHref: (chatId: number) => string;
    buildMessageStoreUrl: (chatId: number) => string;
    canManageParticipants?: boolean;
}

const SCROLL_BOTTOM_THRESHOLD = 24;

export function ChatWorkspace({
    headTitle,
    status,
    currentActorId,
    currentActorType,
    pollIntervalSeconds,
    selectedChatId,
    chatSummaries,
    selectedChat,
    buildChatHref,
    buildMessageStoreUrl,
    canManageParticipants = false,
}: ChatWorkspaceProps) {
    const attachmentInputRef = useRef<HTMLInputElement>(null);
    const messagesViewportRef = useRef<HTMLDivElement>(null);
    const previousChatIdRef = useRef<number | null>(selectedChat?.id ?? null);
    const previousMessageIdsRef = useRef<number[]>(
        selectedChat?.messages.map((message) => message.id) ?? [],
    );
    const isTabFocusedRef = useRef(getIsTabFocused());
    const shouldAutoScrollRef = useRef<boolean>(selectedChat !== null);
    const isAtBottomRef = useRef(true);
    const messageForm = useForm({
        content: '',
        attachments: [] as File[],
    });
    const [unreadCount, setUnreadCount] = useState(0);

    usePoll(Math.max(pollIntervalSeconds, 1) * 1000, {}, {
        autoStart: pollIntervalSeconds > 0,
        keepAlive: false,
    });

    const activeChatId = selectedChatId ?? selectedChat?.id ?? null;
    const formErrors = messageForm.errors as Record<string, string | undefined>;
    const attachmentError = Object.entries(formErrors).find(
        ([key]) => key === 'attachments' || key.startsWith('attachments.'),
    )?.[1];
    const pageTitle = unreadCount > 0 ? `(${unreadCount}) ${headTitle}` : headTitle;

    useEffect(() => {
        if (typeof window === 'undefined' || typeof document === 'undefined') {
            return;
        }

        const updateTabFocus = () => {
            const isFocused = getIsTabFocused();
            const wasFocused = isTabFocusedRef.current;

            isTabFocusedRef.current = isFocused;

            if (isFocused && !wasFocused && isAtBottomRef.current) {
                setUnreadCount(0);
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
        const currentChatId = selectedChat?.id ?? null;
        const currentMessageIds =
            selectedChat?.messages.map((message) => message.id) ?? [];
        const previousChatId = previousChatIdRef.current;

        if (currentChatId !== previousChatId) {
            previousChatIdRef.current = currentChatId;
            previousMessageIdsRef.current = currentMessageIds;
            shouldAutoScrollRef.current = currentChatId !== null;
            isAtBottomRef.current = true;
            setUnreadCount(0);

            return;
        }

        if (currentChatId === null) {
            previousMessageIdsRef.current = currentMessageIds;
            setUnreadCount(0);

            return;
        }

        const previousMessageIds = previousMessageIdsRef.current;
        const previousMessageIdSet = new Set(previousMessageIds);
        const newMessages =
            selectedChat?.messages.filter(
                (message) => !previousMessageIdSet.has(message.id),
            ) ?? [];

        if (newMessages.length === 0) {
            previousMessageIdsRef.current = currentMessageIds;

            return;
        }

        const newIncomingMessages = newMessages.filter(
            (message) =>
                message.author.type !== currentActorType ||
                message.author.id !== currentActorId,
        );
        const shouldTreatIncomingMessagesAsUnread = !isTabFocusedRef.current;

        if (shouldTreatIncomingMessagesAsUnread && newIncomingMessages.length > 0) {
            if (isAtBottomRef.current) {
                shouldAutoScrollRef.current = true;
            }

            setUnreadCount((currentCount) => currentCount + newIncomingMessages.length);
        } else if (isAtBottomRef.current) {
            shouldAutoScrollRef.current = true;
            setUnreadCount(0);
        } else if (newIncomingMessages.length > 0) {
            setUnreadCount((currentCount) => currentCount + newIncomingMessages.length);
        }

        previousMessageIdsRef.current = currentMessageIds;
    }, [currentActorId, currentActorType, selectedChat]);

    useEffect(() => {
        if (!shouldAutoScrollRef.current) {
            return;
        }

        const viewport = messagesViewportRef.current;

        if (!viewport) {
            return;
        }

        shouldAutoScrollRef.current = false;

        const frameId = window.requestAnimationFrame(() => {
            viewport.scrollTop = viewport.scrollHeight;
            isAtBottomRef.current = true;

            if (isTabFocusedRef.current) {
                setUnreadCount(0);
            }
        });

        return () => window.cancelAnimationFrame(frameId);
    }, [selectedChat?.id, selectedChat?.messages.length]);

    const handleMessageChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        messageForm.setData('content', event.currentTarget.value);
        messageForm.clearErrors();
    };

    const handleAttachmentSelection = (event: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.currentTarget.files ?? []);

        if (files.length === 0) {
            return;
        }

        messageForm.setData('attachments', [
            ...messageForm.data.attachments,
            ...files,
        ]);
        messageForm.clearErrors();
        event.currentTarget.value = '';
    };

    const handleRemoveAttachment = (attachmentId: string | number) => {
        const index = Number(attachmentId);

        messageForm.setData(
            'attachments',
            messageForm.data.attachments.filter(
                (_, attachmentIndex) => attachmentIndex !== index,
            ),
        );
        messageForm.clearErrors();
    };

    const handleSendMessage = () => {
        if (!selectedChat || messageForm.processing) {
            return;
        }

        messageForm.post(buildMessageStoreUrl(selectedChat.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                messageForm.reset();

                if (attachmentInputRef.current) {
                    attachmentInputRef.current.value = '';
                }
            },
        });
    };

    const handleMessagesScroll = (event: UIEvent<HTMLDivElement>) => {
        const viewport = event.currentTarget;
        const isAtBottom =
            viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight <=
            SCROLL_BOTTOM_THRESHOLD;

        isAtBottomRef.current = isAtBottom;

        if (isAtBottom && unreadCount > 0 && isTabFocusedRef.current) {
            setUnreadCount(0);
        }
    };

    return (
        <>
            <Head title={pageTitle} />

            <div className="flex flex-col gap-4 overflow-hidden rounded-xl p-4">
                {status && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                        {status}
                    </div>
                )}

                <div className="min-h-0 flex-1">
                    <div className="flex h-full w-full flex-col-reverse items-stretch gap-2 p-1 sm:flex-row">
                        <aside className="flex min-h-0 flex-1 flex-col self-stretch">
                            <Card className="flex h-full flex-col rounded-sm">
                                <CardHeader className="shrink-0">
                                    <CardTitle className="flex flex-row items-center justify-between">
                                        Conversazioni
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex min-h-0 flex-1 flex-col gap-2 pt-0">
                                    <ButtonGroup>
                                        <Input id="input-button-group" placeholder="Cerca..." />
                                        <Button type="button" variant="outline">
                                            <Search />
                                        </Button>
                                    </ButtonGroup>

                                    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto pr-1">
                                        {chatSummaries.length > 0 ? (
                                            chatSummaries.map((chatSummary) => (
                                                <Link
                                                    key={chatSummary.id}
                                                    href={buildChatHref(chatSummary.id)}
                                                    preserveScroll
                                                    className="block"
                                                >
                                                    <ChatThreadItem
                                                        title={chatSummary.title}
                                                        fullName={
                                                            chatSummary.citizen?.name ??
                                                            chatSummary.latest_message_author?.name ??
                                                            'Partecipante sconosciuto'
                                                        }
                                                        unreadMessagesAmount={0}
                                                        active={chatSummary.id === activeChatId}
                                                    />
                                                </Link>
                                            ))
                                        ) : (
                                            <div className="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
                                                Nessuna conversazione disponibile.
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </aside>

                        <main className="flex h-[calc(100dvh-10rem)] min-h-0 flex-col self-stretch sm:min-w-sm sm:flex-2">
                            <Card className="flex h-full flex-col rounded-sm">
                                <CardHeader className="flex flex-row flex-wrap items-center justify-between">
                                    <CardTitle className="me-2">
                                        {selectedChat?.title ?? 'Nessuna chat selezionata'}
                                    </CardTitle>
                                    <div className="flex flex-row items-center gap-2">
                                        <div className="flex flex-wrap gap-2">
                                            {selectedChat?.citizen ? (
                                                <ParticipantBadge
                                                    type="citizen"
                                                    name={selectedChat.citizen.name}
                                                />
                                            ) : null}
                                            {selectedChat?.employees.map((employeeParticipant) => (
                                                <ParticipantBadge
                                                    key={employeeParticipant.id}
                                                    type="employee"
                                                    name={employeeParticipant.name}
                                                />
                                            ))}
                                        </div>

                                        {canManageParticipants ? (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="lg"
                                                        disabled={!selectedChat}
                                                    >
                                                        <UserPlus />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Aggiungi un partecipante</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        ) : null}
                                    </div>
                                </CardHeader>
                                <CardContent className="flex flex-1 flex-col gap-2 overflow-hidden">
                                    <div
                                        ref={messagesViewportRef}
                                        onScroll={handleMessagesScroll}
                                        className="flex-1 overflow-auto rounded-sm border bg-gray-100/50 dark:bg-card"
                                    >
                                        {selectedChat ? (
                                            selectedChat.messages.length > 0 ? (
                                                <div className="flex min-h-full flex-col justify-end gap-2 p-2">
                                                    {selectedChat.messages.map((message) => (
                                                        <MessageBubble
                                                            key={message.id}
                                                            variant={
                                                                message.author.type === currentActorType &&
                                                                message.author.id === currentActorId
                                                                    ? 'author'
                                                                    : 'other'
                                                            }
                                                            authorName={resolveAuthorName(
                                                                message.author.name,
                                                                message.author.type,
                                                            )}
                                                            timestamp={formatChatTimestamp(
                                                                message.created_at,
                                                            )}
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

                                    <div className="space-y-2">
                                        <input
                                            ref={attachmentInputRef}
                                            type="file"
                                            accept="application/pdf,image/*"
                                            multiple
                                            className="hidden"
                                            onChange={handleAttachmentSelection}
                                            disabled={!selectedChat || messageForm.processing}
                                        />
                                        <ChatMessageTextarea
                                            id="chat-message"
                                            name="content"
                                            value={messageForm.data.content}
                                            onChange={handleMessageChange}
                                            attachments={messageForm.data.attachments.map(
                                                (attachment, index) => ({
                                                    id: index,
                                                    name: attachment.name,
                                                }),
                                            )}
                                            onAttachClick={() =>
                                                attachmentInputRef.current?.click()
                                            }
                                            onSendClick={handleSendMessage}
                                            onRemoveAttachment={handleRemoveAttachment}
                                            disabled={!selectedChat || messageForm.processing}
                                        />

                                        {messageForm.processing ? (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Spinner />
                                                Invio in corso...
                                            </div>
                                        ) : null}

                                        <InputError
                                            message={
                                                formErrors.content ?? formErrors.chat
                                            }
                                        />
                                        <InputError message={attachmentError} />
                                    </div>
                                </CardContent>
                            </Card>
                        </main>
                    </div>
                </div>
            </div>
        </>
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

function getIsTabFocused() {
    if (typeof document === 'undefined') {
        return true;
    }

    return document.visibilityState === 'visible' && document.hasFocus();
}
