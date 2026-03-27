import { type ChatSummary } from '@/components/chat/chat-workspace';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import citizen from '@/routes/citizen';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ChevronRight, MessageSquareText, Settings } from 'lucide-react';

interface CitizenDashboardProps {
    status?: string;
    citizen: {
        name: string;
    };
    recentChats: ChatSummary[];
}

function formatDate(date: string | null): string {
    if (!date) {
        return 'Nessuna attività recente';
    }

    return new Intl.DateTimeFormat('it-IT', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(date));
}

export default function CitizenDashboard({
    status,
    citizen: citizenAccount,
    recentChats,
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

                <section className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_380px]">
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
                            {recentChats.length > 0 ? (
                                <div className="divide-y overflow-hidden rounded-2xl border">
                                    {recentChats.map((chat) => (
                                        <Link
                                            key={chat.id}
                                            href={citizen.chats.index.url({
                                                query: { chat: chat.id },
                                            })}
                                            className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-muted/40"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="truncate font-medium">
                                                    {chat.title}
                                                </div>
                                                <div className="mt-1 truncate text-sm text-muted-foreground">
                                                    {chat.latest_message_preview}
                                                </div>
                                            </div>
                                            <div className="hidden text-right text-xs text-muted-foreground md:block">
                                                <div>{formatDate(chat.latest_message_date)}</div>
                                                <div className="mt-1">
                                                    {chat.message_count} messaggi
                                                </div>
                                            </div>
                                            <ChevronRight className="size-4 text-muted-foreground" />
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                                    Non hai ancora conversazioni recenti.
                                </div>
                            )}
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
