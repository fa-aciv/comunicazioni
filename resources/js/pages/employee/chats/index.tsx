import InputError from '@/components/input-error';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChatMessageTextarea } from '@/components/ui/chat/ChatMessageTextarea';
import ChatThreadItem from '@/components/ui/chat/ChatThreadItem';
import MessageBubble from '@/components/ui/chat/MessaggeBubble';
import ParticipantBadge from '@/components/ui/chat/ParticipantBadge';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import employee from '@/routes/employee';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, usePoll } from '@inertiajs/react';
import { MessageSquareDashed, Search, UserPlus } from 'lucide-react';
import { type ChangeEvent, useRef } from 'react';

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

interface EmployeeSummary {
    id: number;
    name: string;
    email: string;
    department_name?: string;
}

interface CitizenSummary {
    id: number;
    name: string;
    email: string;
    phone_number: string;
    fiscal_code: string;
}

interface ChatSummary {
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

interface AttachmentSummary {
    id: number;
    file_name: string;
    kind: 'image' | 'pdf' | 'file';
    preview_url: string;
    download_url: string;
}

interface ChatMessageSummary {
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

interface SelectedChatSummary {
    id: number;
    title: string;
    latest_message_date?: string | null;
    citizen: CitizenSummary | null;
    employees: EmployeeSummary[];
    messages: ChatMessageSummary[];
}

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
    chatSummaries,
    selectedChat,
}: EmployeeChatsProps) {
    const attachmentInputRef = useRef<HTMLInputElement>(null);
    const messageForm = useForm({
        content: '',
        attachments: [] as File[],
    });

    usePoll(Math.max(pollIntervalSeconds, 1) * 1000, {}, {
        autoStart: pollIntervalSeconds > 0,
    });

    const activeChatId = selectedChatId ?? selectedChat?.id ?? null;
    const formErrors = messageForm.errors as Record<string, string | undefined>;

    const handleMessageChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        messageForm.setData('content', event.currentTarget.value);
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
        messageForm.clearErrors('attachments');
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
    };

    const handleSendMessage = () => {
        if (!selectedChat || messageForm.processing) {
            return;
        }

        messageForm.post(employee.chats.messages.store.url({ chat: selectedChat.id }), {
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Chat dipendenti" />

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
                                                    href={employee.chats.index.url({
                                                        query: { chat: chatSummary.id },
                                                    })}
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
                                    </div>
                                </CardHeader>
                                <CardContent className="flex flex-1 flex-col gap-2 overflow-hidden">
                                    <div className="flex-1 overflow-auto rounded-sm border bg-gray-100/50 dark:bg-card">
                                        {selectedChat ? (
                                            selectedChat.messages.length > 0 ? (
                                                <div className="flex min-h-full flex-col justify-end gap-2 p-2">
                                                    {selectedChat.messages.map((message) => (
                                                        <MessageBubble
                                                            key={message.id}
                                                            variant={
                                                                message.author.type === 'User' &&
                                                                message.author.id === currentEmployeeId
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
                                                    <Empty className="h-full">
                                                        <EmptyHeader>
                                                            <EmptyMedia>
                                                                <MessageSquareDashed />
                                                            </EmptyMedia>
                                                            <EmptyTitle>
                                                                Nessun messaggio
                                                            </EmptyTitle>
                                                            <EmptyDescription>
                                                                Questa conversazione non contiene ancora messaggi.
                                                            </EmptyDescription>
                                                        </EmptyHeader>
                                                    </Empty>
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
                                            id="employee-chat-message"
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

                                        <InputError message={formErrors.content ?? formErrors.chat} />
                                        <InputError
                                            message={
                                                formErrors.attachments ??
                                                formErrors['attachments.0']
                                            }
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </main>
                    </div>
                </div>
            </div>
        </AppLayout>
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
