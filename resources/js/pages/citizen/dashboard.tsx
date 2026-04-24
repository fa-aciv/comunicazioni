import { ContactRequestDialog, type ContactRequestGroup } from '@/components/citizen/contact-request-dialog';
import { ChatSummaryList } from '@/components/chat/chat-summary-list';
import type { ChatSummary } from '@/components/chat/chat-types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import citizen from '@/routes/citizen';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Clock, LetterText, Mail, MessageSquareText, Plus, Settings } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import citizens from '@/routes/employee/citizens';

interface CitizenDashboardProps {
    status?: string;
    citizen: {
        name: string;
    };
    recentChats: ChatSummary[];
    groups: ContactRequestGroup[];
    pendingContactRequestCount: number;
    storeUrl: string;
}

export default function CitizenDashboard({
    status,
    citizen: citizenAccount,
    recentChats,
    groups,
    pendingContactRequestCount,
    storeUrl,
}: CitizenDashboardProps) {
    const [createRequestOpen, setCreateRequestOpen] = useState(false);

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
                            {citizenAccount.name}
                        </h1>
                    </div>
                </section>

                <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
                    <Card>
                        <CardHeader>
                            <div className="space-y-1">
                                <div className="flex size-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                                    <MessageSquareText className="size-5" />
                                </div>
                                <CardTitle>Conversazioni recenti</CardTitle>
                                <CardDescription>
                                    Lista delle tue conversazioni più recenti. 
                                </CardDescription>
                            </div>

                            <CardAction className="flex flex-wrap justify-end gap-2">
                                <Button
                                    disabled={groups.length === 0}
                                    onClick={() => setCreateRequestOpen(true)}
                                    size="lg"
                                >
                                    <Plus className="size-4" />
                                    Nuova richiesta di contatto
                                </Button>

                                {
                                    pendingContactRequestCount > 0 && (
                                        <Button 
                                            asChild 
                                            variant="outline"
                                            size="lg"
                                        >
                                            <Link
                                                href="/citizen/contact-requests"
                                                aria-label={`${pendingContactRequestCount} richieste in attesa`}
                                            >
                                                <Mail className="size-4" data-icon="inline-start" />
                                                <Badge
                                                    variant="secondary"
                                                    className="h-5 min-w-5 rounded-full px-1.5 text-xs tabular-nums"
                                                >
                                                    {pendingContactRequestCount}
                                                </Badge>
                                                In attesa
                                            </Link>
                                        </Button>
                                    )
                                }
                            </CardAction>

                            {groups.length === 0 ? (
                                <p className="col-span-full text-xs text-muted-foreground">
                                    Al momento non ci sono gruppi disponibili.
                                </p>
                            ) : null}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ChatSummaryList
                                chats={recentChats}
                                buildChatHref={(chatId) =>
                                    citizen.chats.index.url({
                                        query: { chat: chatId },
                                    })
                                }
                                emptyTitle="Non hai ancora conversazioni recenti."
                                emptyDescription="Invia una richiesta di contatto per avviare una nuova conversazione."
                            />
                        </CardContent>
                        <Button 
                            asChild 
                            variant="outline"
                            className={cn(
                                "mx-4"
                            )}
                            >
                            <Link href={citizen.chats.index().url}>
                                <MessageSquareText />
                                Tutte le conversazioni
                            </Link>
                        </Button>
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
                                    <Settings className="size-4" />
                                    Gestisci account
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </section>

                <ContactRequestDialog
                    groups={groups}
                    open={createRequestOpen}
                    onOpenChange={setCreateRequestOpen}
                    storeUrl={storeUrl}
                />
            </div>
        </AppLayout>
    );
}
