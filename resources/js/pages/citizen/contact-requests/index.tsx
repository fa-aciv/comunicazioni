import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import citizen from '@/routes/citizen';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { LifeBuoy } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: citizen.dashboard().url,
    },
    {
        title: 'Richieste ai gruppi',
        href: '/citizen/contact-requests',
    },
];

interface CitizenContactRequestsPageProps {
    status?: string;
    groups: Array<{
        id: number;
        name: string;
        description: string | null;
    }>;
    contactRequests: Array<{
        id: number;
        groupName: string;
        subject: string | null;
        message: string;
        status: string;
        statusLabel: string;
        createdAt: string | null;
        acceptedAt: string | null;
        acceptedBy: {
            name: string;
            email: string;
        } | null;
        chatUrl: string | null;
    }>;
    storeUrl: string;
}

function formatDateTime(value: string | null): string {
    if (!value) {
        return 'Data non disponibile';
    }

    return new Intl.DateTimeFormat('it-IT', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

export default function CitizenContactRequestsPage({
    status,
    groups,
    contactRequests,
    storeUrl,
}: CitizenContactRequestsPageProps) {
    const form = useForm<{
        group_id: string;
        subject: string;
        message: string;
    }>({
        group_id: groups[0] ? String(groups[0].id) : '',
        subject: '',
        message: '',
    });

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        form.post(storeUrl, {
            preserveScroll: true,
            onSuccess: () => {
                form.reset('subject', 'message');
            },
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Richieste ai gruppi" />

            <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-6 p-4 md:p-6">
                {status && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                        {status}
                    </div>
                )}

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                    <Card className="border-emerald-200">
                        <CardHeader className="space-y-3">
                            <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                                <LifeBuoy className="size-5" />
                            </div>
                            <div className="space-y-1">
                                <CardTitle>Nuova richiesta di contatto</CardTitle>
                                <CardDescription>
                                    Seleziona il gruppo a cui vuoi scrivere e descrivi la tua richiesta.
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {groups.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Al momento non ci sono gruppi disponibili a cui inviare richieste di contatto.
                                </p>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="grid gap-2">
                                        <Label>Gruppo destinatario</Label>
                                        <Select
                                            value={form.data.group_id}
                                            onValueChange={(value) => form.setData('group_id', value)}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Seleziona un gruppo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {groups.map((group) => (
                                                    <SelectItem key={group.id} value={String(group.id)}>
                                                        {group.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={form.errors.group_id} />
                                        {form.data.group_id ? (
                                            <p className="text-sm text-muted-foreground">
                                                {groups.find(
                                                    (group) => String(group.id) === form.data.group_id,
                                                )?.description || 'Nessuna descrizione disponibile.'}
                                            </p>
                                        ) : null}
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="subject">Oggetto</Label>
                                        <Input
                                            id="subject"
                                            value={form.data.subject}
                                            onChange={(event) => form.setData('subject', event.currentTarget.value)}
                                            placeholder="Richiesta informazioni, supporto, aggiornamento..."
                                        />
                                        <InputError message={form.errors.subject} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="message">Messaggio</Label>
                                        <Textarea
                                            id="message"
                                            value={form.data.message}
                                            onChange={(event) => form.setData('message', event.currentTarget.value)}
                                            placeholder="Descrivi in modo chiaro la tua richiesta."
                                            required
                                        />
                                        <InputError message={form.errors.message} />
                                    </div>

                                    <div className="flex justify-end">
                                        <Button type="submit" disabled={form.processing}>
                                            Invia richiesta
                                            {form.processing && <Spinner />}
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Le tue richieste</CardTitle>
                            <CardDescription>
                                Controlla lo stato delle richieste già inviate ai gruppi.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {contactRequests.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Non hai ancora inviato richieste di contatto ad alcun gruppo.
                                </p>
                            ) : (
                                contactRequests.map((contactRequest) => (
                                    <div key={contactRequest.id} className="rounded-2xl border p-4">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="space-y-1">
                                                <div className="font-medium">{contactRequest.groupName}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    Inviata il {formatDateTime(contactRequest.createdAt)}
                                                </div>
                                            </div>
                                            <Badge variant="outline">{contactRequest.statusLabel}</Badge>
                                        </div>

                                        {contactRequest.subject ? (
                                            <div className="mt-4 space-y-1">
                                                <div className="text-sm font-medium">Oggetto</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {contactRequest.subject}
                                                </div>
                                            </div>
                                        ) : null}

                                        <div className="mt-4 space-y-1">
                                            <div className="text-sm font-medium">Messaggio</div>
                                            <div className="whitespace-pre-wrap text-sm text-muted-foreground">
                                                {contactRequest.message}
                                            </div>
                                        </div>

                                        {contactRequest.acceptedBy ? (
                                            <div className="mt-4 rounded-xl border bg-muted/20 p-3 text-sm">
                                                <div className="font-medium">
                                                    Presa in carico da {contactRequest.acceptedBy.name}
                                                </div>
                                                <div className="text-muted-foreground">
                                                    {contactRequest.acceptedBy.email}
                                                </div>
                                                <div className="text-muted-foreground">
                                                    Accettata il {formatDateTime(contactRequest.acceptedAt)}
                                                </div>
                                            </div>
                                        ) : null}

                                        {contactRequest.chatUrl ? (
                                            <div className="mt-4">
                                                <Button asChild variant="outline">
                                                    <Link href={contactRequest.chatUrl}>
                                                        Apri chat collegata
                                                    </Link>
                                                </Button>
                                            </div>
                                        ) : null}
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
