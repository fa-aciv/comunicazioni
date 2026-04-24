import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import citizen from '@/routes/citizen';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: citizen.dashboard().url,
    },
    {
        title: 'Richieste in attesa',
        href: '/citizen/contact-requests',
    },
];

interface CitizenContactRequestsPageProps {
    status?: string;
    contactRequests: Array<{
        id: number;
        groupName: string;
        subject: string | null;
        message: string;
        status: string;
        statusLabel: string;
        createdAt: string | null;
    }>;
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
    contactRequests,
}: CitizenContactRequestsPageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Richieste in attesa" />

            <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-6 p-4 md:p-6">
                {status && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                        {status}
                    </div>
                )}

                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-semibold tracking-tight">Richieste in attesa</h1>
                        <p className="text-sm text-muted-foreground">
                            Le richieste non ancora prese in carico da un operatore.
                        </p>
                    </div>
                    <Button asChild variant="outline">
                        <Link href={citizen.dashboard().url}>Torna alla dashboard</Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Richieste pendenti</CardTitle>
                        <CardDescription>
                            Quando una richiesta viene accettata, la troverai direttamente tra le chat.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {contactRequests.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Non hai richieste di contatto in attesa.
                            </p>
                        ) : (
                            <div className="divide-y rounded-xl border">
                                {contactRequests.map((contactRequest) => (
                                    <div
                                        key={contactRequest.id}
                                        className="grid gap-3 px-4 py-3 text-sm md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_180px_130px] md:items-center"
                                    >
                                        <div className="min-w-0">
                                            <div className="truncate font-medium">{contactRequest.groupName}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {formatDateTime(contactRequest.createdAt)}
                                            </div>
                                        </div>

                                        <div className="min-w-0">
                                            <div className="truncate text-muted-foreground">
                                                {contactRequest.message}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">{contactRequest.statusLabel}</Badge>
                                        </div>

                                        <div className="flex md:justify-end">
                                            <span className="text-xs text-muted-foreground">
                                                In attesa
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
