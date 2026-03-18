import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AppLayout from '@/layouts/app-layout';
import employee from '@/routes/employee';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: employee.dashboard().url,
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

interface AttachmentSummary {
    id: number;
    file_name: string;
    download_url: string;
}

interface ChatMessageSummary {
    id: number;
    content: string;
    created_at?: string | null;
    author: {
        type: string;
        name?: string | null;
        email?: string | null;
    };
    attachments: AttachmentSummary[];
}

interface ChatSummary {
    id: number;
    title: string;
    latest_message_date?: string | null;
    citizen: CitizenSummary | null;
    employees: EmployeeSummary[];
    messages: ChatMessageSummary[];
}

interface DashboardProps {
    status?: string;
    selectedChatId?: number | null;
    employees: EmployeeSummary[];
    chats: ChatSummary[];
}

export default function Dashboard({
    status,
    selectedChatId,
    employees,
    chats,
}: DashboardProps) {
    const selectedChat =
        chats.find((chat) => chat.id === selectedChatId) ?? chats[0] ?? null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {status && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                        {status}
                    </div>
                )}

                <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
                    <div className="space-y-4">
                        <CreateNewUserForm />
                        <CreateChatForm employees={employees} />
                        <ChatsList chats={chats} selectedChatId={selectedChat?.id ?? null} />
                    </div>

                    <ChatWorkspace
                        chat={selectedChat}
                        allEmployees={employees}
                    />
                </div>
            </div>
        </AppLayout>
    );
}

function CreateNewUserForm() {
    const newUserForm = useForm({
        name: '',
        email: '',
        phoneNumber: '',
        fiscalCode: '',
    });

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        newUserForm.post(employee.citizens.store.url(), {
            onSuccess: () => newUserForm.reset(),
            preserveScroll: true,
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Registra un utente</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={submit} className="flex flex-col gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nome completo</Label>
                        <Input
                            id="name"
                            type="text"
                            value={newUserForm.data.name}
                            onChange={(event) =>
                                newUserForm.setData('name', event.currentTarget.value)
                            }
                            required
                            autoComplete="name"
                            autoCapitalize="words"
                            placeholder="Nome Cognome"
                        />
                        <InputError message={newUserForm.errors.name} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">Indirizzo e-mail</Label>
                        <Input
                            id="email"
                            type="email"
                            value={newUserForm.data.email}
                            onChange={(event) =>
                                newUserForm.setData('email', event.currentTarget.value)
                            }
                            required
                            autoComplete="email"
                            placeholder="email@example.com"
                        />
                        <InputError message={newUserForm.errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="phoneNumber">Numero di telefono</Label>
                        <Input
                            id="phoneNumber"
                            type="tel"
                            inputMode="tel"
                            value={newUserForm.data.phoneNumber}
                            onChange={(event) =>
                                newUserForm.setData(
                                    'phoneNumber',
                                    event.currentTarget.value.replace(/[^\d+]/g, ''),
                                )
                            }
                            required
                            autoComplete="tel"
                            placeholder="+390916661111"
                        />
                        <InputError message={newUserForm.errors.phoneNumber} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="fiscalCode">Codice fiscale</Label>
                        <Input
                            id="fiscalCode"
                            type="text"
                            value={newUserForm.data.fiscalCode}
                            onChange={(event) =>
                                newUserForm.setData(
                                    'fiscalCode',
                                    event.currentTarget.value
                                        .toUpperCase()
                                        .replace(/\s+/g, ''),
                                )
                            }
                            required
                            maxLength={16}
                            placeholder="RSSMRA80A01H501U"
                        />
                        <InputError message={newUserForm.errors.fiscalCode} />
                    </div>

                    <Button
                        type="submit"
                        disabled={newUserForm.processing}
                        className="w-full"
                    >
                        Registra utente
                        {newUserForm.processing && <Spinner />}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

function CreateChatForm({ employees }: { employees: EmployeeSummary[] }) {
    const form = useForm<{
        title: string;
        citizen_identifier: string;
        employee_ids: number[];
    }>({
        title: '',
        citizen_identifier: '',
        employee_ids: [],
    });

    const toggleEmployee = (employeeId: number, checked: boolean) => {
        form.setData(
            'employee_ids',
            checked
                ? [...form.data.employee_ids, employeeId]
                : form.data.employee_ids.filter((id) => id !== employeeId),
        );
    };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.post(employee.chats.store.url(), {
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Apri una nuova chat</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={submit} className="space-y-5">
                    <div className="grid gap-2">
                        <Label htmlFor="chat-title">Titolo</Label>
                        <Input
                            id="chat-title"
                            value={form.data.title}
                            onChange={(event) =>
                                form.setData('title', event.currentTarget.value)
                            }
                            placeholder="Richiesta documentazione"
                        />
                        <InputError message={form.errors.title} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="citizen-identifier">
                            Cittadino: email, telefono o codice fiscale
                        </Label>
                        <Input
                            id="citizen-identifier"
                            value={form.data.citizen_identifier}
                            onChange={(event) =>
                                form.setData(
                                    'citizen_identifier',
                                    event.currentTarget.value,
                                )
                            }
                            required
                            placeholder="RSSMRA80A01H501U"
                        />
                        <InputError message={form.errors.citizen_identifier} />
                    </div>

                    <div className="grid gap-3">
                        <Label>Altri dipendenti partecipanti</Label>
                        <div className="max-h-48 space-y-2 overflow-auto rounded-md border p-3">
                            {employees.map((employeeOption) => (
                                <label
                                    key={employeeOption.id}
                                    className="flex items-center gap-3 text-sm"
                                >
                                    <Checkbox
                                        checked={form.data.employee_ids.includes(
                                            employeeOption.id,
                                        )}
                                        onCheckedChange={(checked) =>
                                            toggleEmployee(
                                                employeeOption.id,
                                                checked === true,
                                            )
                                        }
                                    />
                                    <span>
                                        {employeeOption.name}
                                        <span className="block text-xs text-muted-foreground">
                                            {employeeOption.email}
                                        </span>
                                    </span>
                                </label>
                            ))}
                        </div>
                        <InputError message={form.errors.employee_ids} />
                    </div>

                    <Button type="submit" disabled={form.processing} className="w-full">
                        Crea chat
                        {form.processing && <Spinner />}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

function ChatsList({
    chats,
    selectedChatId,
}: {
    chats: ChatSummary[];
    selectedChatId: number | null;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Chat disponibili</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {chats.length === 0 && (
                    <div className="rounded-md border border-dashed px-4 py-6 text-sm text-muted-foreground">
                        Nessuna chat disponibile.
                    </div>
                )}

                {chats.map((chat) => (
                    <button
                        key={chat.id}
                        type="button"
                        onClick={() =>
                            router.get(
                                employee.dashboard.url({
                                    query: { chat: chat.id },
                                }),
                                {},
                                {
                                    preserveScroll: true,
                                    preserveState: true,
                                    replace: true,
                                },
                            )
                        }
                        className={`w-full rounded-lg border px-4 py-3 text-left ${
                            selectedChatId === chat.id
                                ? 'border-sky-500 bg-sky-50'
                                : 'hover:bg-muted/40'
                        }`}
                    >
                        <div className="font-medium">{chat.title}</div>
                        <div className="text-sm text-muted-foreground">
                            {chat.citizen?.name ?? 'Cittadino non disponibile'}
                        </div>
                        {chat.latest_message_date && (
                            <div className="text-xs text-muted-foreground">
                                Ultimo messaggio:{' '}
                                {new Date(chat.latest_message_date).toLocaleString(
                                    'it-IT',
                                )}
                            </div>
                        )}
                    </button>
                ))}
            </CardContent>
        </Card>
    );
}

function ChatWorkspace({
    chat,
    allEmployees,
}: {
    chat: ChatSummary | null;
    allEmployees: EmployeeSummary[];
}) {
    const [messageFileInputKey, setMessageFileInputKey] = useState(0);
    const messageForm = useForm<{
        content: string;
        attachments: File[];
    }>({
        content: '',
        attachments: [],
    });
    const participantForm = useForm<{
        employee_id: string;
    }>({
        employee_id: '',
    });

    const availableEmployees = chat
        ? allEmployees.filter(
              (employeeOption) =>
                  !chat.employees.some(
                      (participant) => participant.id === employeeOption.id,
                  ),
          )
        : [];

    const submitMessage = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!chat) {
            return;
        }

        messageForm.post(employee.chats.messages.store.url(chat.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                messageForm.reset();
                setMessageFileInputKey((current) => current + 1);
            },
        });
    };

    const submitParticipant = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!chat) {
            return;
        }

        participantForm.post(`/employee/chats/${chat.id}/participants`, {
            preserveScroll: true,
            onSuccess: () => participantForm.reset(),
        });
    };

    if (!chat) {
        return (
            <Card className="min-h-[560px]">
                <CardContent className="flex h-full items-center justify-center p-10 text-sm text-muted-foreground">
                    Seleziona una chat oppure creane una nuova per iniziare.
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>{chat.title}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-[minmax(0,1fr)_280px]">
                    <div className="space-y-2 text-sm">
                        <div>
                            <span className="font-medium">Cittadino:</span>{' '}
                            {chat.citizen?.name}
                        </div>
                        <div className="text-muted-foreground">
                            {chat.citizen?.email} · {chat.citizen?.phone_number}
                        </div>
                        <div className="text-muted-foreground">
                            CF: {chat.citizen?.fiscal_code}
                        </div>
                    </div>

                    <div className="space-y-3 rounded-lg border p-4">
                        <div className="text-sm font-medium">Partecipanti</div>
                        <div className="space-y-2 text-sm">
                            {chat.employees.map((participant) => (
                                <div key={participant.id}>
                                    {participant.name}
                                    <div className="text-xs text-muted-foreground">
                                        {participant.email}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <form onSubmit={submitParticipant} className="space-y-3">
                            <div className="grid gap-2">
                                <Label htmlFor="participant">Aggiungi dipendente</Label>
                                <select
                                    id="participant"
                                    value={participantForm.data.employee_id}
                                    onChange={(event) =>
                                        participantForm.setData(
                                            'employee_id',
                                            event.currentTarget.value,
                                        )
                                    }
                                    className="rounded-md border px-3 py-2 text-sm"
                                >
                                    <option value="">Seleziona un dipendente</option>
                                    {availableEmployees.map((employeeOption) => (
                                        <option
                                            key={employeeOption.id}
                                            value={employeeOption.id}
                                        >
                                            {employeeOption.name}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={participantForm.errors.employee_id} />
                            </div>
                            <Button
                                type="submit"
                                disabled={
                                    participantForm.processing ||
                                    availableEmployees.length === 0
                                }
                                className="w-full"
                            >
                                Aggiungi partecipante
                                {participantForm.processing && <Spinner />}
                            </Button>
                        </form>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Messaggi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="max-h-[420px] space-y-3 overflow-auto rounded-lg border p-4">
                        {chat.messages.length === 0 && (
                            <div className="text-sm text-muted-foreground">
                                Nessun messaggio ancora presente.
                            </div>
                        )}

                        {chat.messages.map((message) => (
                            <div key={message.id} className="rounded-lg border p-3">
                                <div className="mb-1 text-sm font-medium">
                                    {message.author.name ?? 'Autore sconosciuto'}
                                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                                        {message.author.type}
                                        {message.created_at &&
                                            ` · ${new Date(message.created_at).toLocaleString('it-IT')}`}
                                    </span>
                                </div>
                                {message.content && (
                                    <div className="whitespace-pre-wrap text-sm">
                                        {message.content}
                                    </div>
                                )}
                                {message.attachments.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {message.attachments.map((attachment) => (
                                            <a
                                                key={attachment.id}
                                                href={attachment.download_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="rounded-md border px-3 py-1 text-xs hover:bg-muted"
                                            >
                                                {attachment.file_name}
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <form onSubmit={submitMessage} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="message-content">Nuovo messaggio</Label>
                            <textarea
                                id="message-content"
                                value={messageForm.data.content}
                                onChange={(event) =>
                                    messageForm.setData(
                                        'content',
                                        event.currentTarget.value,
                                    )
                                }
                                rows={4}
                                className="rounded-md border px-3 py-2 text-sm"
                                placeholder="Scrivi un messaggio..."
                            />
                            <InputError message={messageForm.errors.content} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="attachments">
                                Allegati (max 5 file, PDF o immagini, 20MB ciascuno)
                            </Label>
                            <Input
                                key={messageFileInputKey}
                                id="attachments"
                                type="file"
                                accept="application/pdf,image/*"
                                multiple
                                onChange={(event) =>
                                    messageForm.setData(
                                        'attachments',
                                        Array.from(event.currentTarget.files ?? []),
                                    )
                                }
                            />
                            <InputError message={messageForm.errors.attachments} />
                            <InputError message={messageForm.errors['attachments.0']} />
                            <InputError message={messageForm.errors['attachments.1']} />
                            <InputError message={messageForm.errors['attachments.2']} />
                            <InputError message={messageForm.errors['attachments.3']} />
                            <InputError message={messageForm.errors['attachments.4']} />
                        </div>

                        <Button
                            type="submit"
                            disabled={messageForm.processing}
                            className="w-full"
                        >
                            Invia messaggio
                            {messageForm.processing && <Spinner />}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
