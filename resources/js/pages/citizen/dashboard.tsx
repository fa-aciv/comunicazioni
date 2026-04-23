import { ChatSummaryList } from '@/components/chat/chat-summary-list';
import type { ChatSummary } from '@/components/chat/chat-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import citizen from '@/routes/citizen';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { LifeBuoy, MessageSquareText, Settings } from 'lucide-react';

interface CitizenDashboardProps {
    status?: string;
    citizen: {
        name: string;
    };
    recentChats: ChatSummary[];
    activeGroupCount: number;
    openContactRequestCount: number;
}

export default function CitizenDashboard({
    status,
    citizen: citizenAccount,
    recentChats,
    activeGroupCount,
    openContactRequestCount,
}: CitizenDashboardProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: citizen.dashboard().url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Area cittadini" />

            <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-6 p-4 md:p-6">
                {status && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                        {status}
                    </div>
                )}

                <section className="rounded-3xl border p-8 shadow-xs">
                    <div className="max-w-2xl">
                        <h1 className="text-3xl font-semibold tracking-tight">
                            Benvenuto, {citizenAccount.name}
                        </h1>
                    </div>
                </section>

                <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_360px_360px]">
                    <Card>
                        <CardHeader className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1">
                                    <div className="flex size-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                                        <MessageSquareText className="size-5" />
                                    </div>
                                    <CardTitle>Chat recenti</CardTitle>
                                    <CardDescription>
                                        Le ultime conversazioni aperte con l&apos;amministrazione.
                                    </CardDescription>
                                </div>
                                <Button asChild variant="outline">
                                    <Link href={citizen.chats.index().url}>
                                        Apri tutte le chat
                                    </Link>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ChatSummaryList
                                chats={recentChats}
                                buildChatHref={(chatId) =>
                                    citizen.chats.index.url({
                                        query: { chat: chatId },
                                    })
                                }
                                emptyTitle="Non hai ancora conversazioni recenti."
                                emptyDescription="Le conversazioni aperte con l'amministrazione compariranno qui."
                            />
                        </CardContent>
                    </Card>

                    <Card className="border-emerald-200">
                        <CardHeader className="space-y-3">
                            <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                                <LifeBuoy className="size-5" />
                            </div>
                            <div className="space-y-1">
                                <CardTitle>Richieste ai gruppi</CardTitle>
                                <CardDescription>
                                    Invia una nuova richiesta ad un gruppo e controlla lo stato di quelle già aperte.
                                </CardDescription>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Gruppi disponibili: {activeGroupCount}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Richieste aperte: {openContactRequestCount}
                            </p>
                        </CardHeader>
                        <CardContent>
                            <Button asChild variant="outline" className="w-full">
                                <Link href="/citizen/contact-requests">
                                    Apri richieste ai gruppi
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-amber-200">
                        <CardHeader className="space-y-3">
                            <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                                <Settings className="size-5" />
                            </div>
                            <div className="space-y-1">
                                <CardTitle>Impostazioni account</CardTitle>
                                <CardDescription>
                                    Accedi alla gestione account per aggiornare i tuoi dati personali od eliminare il tuo account.
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Button asChild variant="outline" className="w-full">
                                <Link href={citizen.account.index().url}>
                                    Gestisci account
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </AppLayout>
    );
}
