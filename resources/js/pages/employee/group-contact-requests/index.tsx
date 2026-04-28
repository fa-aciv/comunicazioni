import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AppLayout from '@/layouts/app-layout';
import employee from '@/routes/employee';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Inbox, MessageSquarePlus } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: employee.dashboard().url,
    },
    {
        title: 'Inbox richieste',
        href: '/employee/group-contact-requests',
    },
];

interface EmployeeGroupContactRequestsPageProps {
    status?: string;
    contactRequests: Array<{
        id: number;
        groupName: string;
        subject: string | null;
        message: string;
        suggestedTitle: string;
        createdAt: string | null;
        citizen: {
            name: string;
            email: string;
            phoneNumber: string;
            fiscalCode: string;
        };
        acceptUrl: string;
    }>;
    groupsUrl: string;
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

export default function EmployeeGroupContactRequestsPage({
    status,
    contactRequests,
    groupsUrl,
}: EmployeeGroupContactRequestsPageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inbox richieste" />

            <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-6 p-4 md:p-6">
                {status && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                        {status}
                    </div>
                )}

                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-semibold tracking-tight">Inbox richieste</h1>
                        <p className="text-sm text-muted-foreground">
                            Accetta le richieste di contatto indirizzate ai gruppi che segui.
                        </p>
                    </div>
                </div>

                {contactRequests.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex min-h-48 flex-col items-center justify-center gap-3 py-12 text-center">
                            <Inbox className="size-8 text-muted-foreground" />
                            <div className="space-y-1">
                                <p className="font-medium">Nessuna richiesta disponibile.</p>
                                <p className="text-sm text-muted-foreground">
                                    Qui compariranno le richieste dei cittadini che puoi prendere in carico.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 lg:grid-cols-2">
                        {contactRequests.map((contactRequest) => (
                            <Card key={contactRequest.id}>
                                <CardHeader className="space-y-3">
                                    <div className="space-y-1">
                                        <CardTitle>{contactRequest.groupName}</CardTitle>
                                        <CardDescription>
                                            Ricevuta il {formatDateTime(contactRequest.createdAt)}
                                        </CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-1 text-sm">
                                        <div className="font-medium">{contactRequest.citizen.name}</div>
                                        <div className="text-muted-foreground">{contactRequest.citizen.email}</div>
                                        <div className="text-muted-foreground">{contactRequest.citizen.phoneNumber}</div>
                                        <div className="text-muted-foreground">{contactRequest.citizen.fiscalCode}</div>
                                    </div>

                                    {contactRequest.subject ? (
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium">Oggetto</p>
                                            <p className="text-sm text-muted-foreground">{contactRequest.subject}</p>
                                        </div>
                                    ) : null}

                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">Messaggio</p>
                                        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                                            {contactRequest.message}
                                        </p>
                                    </div>

                                    <AcceptRequestDialog contactRequest={contactRequest} />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function AcceptRequestDialog({
    contactRequest,
}: {
    contactRequest: EmployeeGroupContactRequestsPageProps['contactRequests'][number];
}) {
    const [open, setOpen] = useState(false);
    const form = useForm({
        title: contactRequest.suggestedTitle,
    });

    function handleOpenChange(nextOpen: boolean) {
        setOpen(nextOpen);

        if (nextOpen) {
            form.clearErrors();
            form.setData('title', contactRequest.suggestedTitle);
        }
    }

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        form.post(contactRequest.acceptUrl, {
            preserveScroll: true,
            onSuccess: () => setOpen(false),
        });
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <Button className="w-full" onClick={() => handleOpenChange(true)}>
                <MessageSquarePlus className="size-4" />
                Accetta e apri chat
            </Button>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Titolo della chat</DialogTitle>
                    <DialogDescription>
                        Conferma o modifica il titolo che verrà usato per la nuova chat con {contactRequest.citizen.name}.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor={`chat-title-${contactRequest.id}`}>Titolo</Label>
                        <Input
                            id={`chat-title-${contactRequest.id}`}
                            value={form.data.title}
                            onChange={(event) => form.setData('title', event.currentTarget.value)}
                            maxLength={255}
                            required
                            autoFocus
                        />
                        <InputError message={form.errors.title} />
                        <p className="text-xs text-muted-foreground">
                            Suggerito dalla richiesta del cittadino. Puoi cambiarlo prima di accettare.
                        </p>
                    </div>

                    <div className="rounded-xl border bg-muted/20 p-3 text-sm">
                        <div className="font-medium">{contactRequest.groupName}</div>
                        {contactRequest.subject ? (
                            <div className="mt-1 text-muted-foreground">
                                Oggetto: {contactRequest.subject}
                            </div>
                        ) : null}
                        <div className="mt-2 line-clamp-3 whitespace-pre-wrap text-muted-foreground">
                            {contactRequest.message}
                        </div>
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Annulla
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={form.processing}>
                            Crea chat
                            {form.processing ? <Spinner /> : null}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
