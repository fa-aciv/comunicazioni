import { ChatSummaryList } from '@/components/chat/chat-summary-list';
import type { ChatSummary } from '@/components/chat/chat-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import employee from '@/routes/employee';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { MessageSquareMore, UserCog } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: employee.dashboard().url,
    },
];

interface DashboardProps {
    status?: string;
    activeChats: ChatSummary[];
}

export default function Dashboard({ status, activeChats }: DashboardProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {status && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                        {status}
                    </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                    <Card className="border-sky-200">
                        <CardHeader className="space-y-3">
                            <div className="flex size-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                                <MessageSquareMore className="size-5" />
                            </div>
                            <div className="space-y-1">
                                <CardTitle>Conversazioni</CardTitle>
                                <CardDescription>
                                    Le tue conversazioni con cittadini.
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ChatSummaryList
                                chats={activeChats}
                                buildChatHref={(chatId) =>
                                    employee.chats.index.url({
                                        query: { chat: chatId },
                                    })
                                }
                                emptyTitle="Non hai ancora conversazioni attive."
                                emptyDescription="Quando parteciperai a una chat la troverai qui."
                            />

                            <Button asChild className="w-full">
                                <Link href={employee.chats.index().url}>
                                    Apri la pagina chat
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-amber-200">
                        <CardHeader className="space-y-3">
                            <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                                <UserCog className="size-5" />
                            </div>
                            <div className="space-y-1">
                                <CardTitle>Account cittadini</CardTitle>
                                <CardDescription>
                                    Registra nuovi cittadini e aggiorna i loro contatti.
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Button asChild variant="outline" className="w-full">
                                <Link href={employee.citizens.index().url}>
                                    Gestisci account cittadini
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
