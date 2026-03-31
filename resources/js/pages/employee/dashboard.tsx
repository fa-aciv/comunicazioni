import { ChatSummaryList } from '@/components/chat/chat-summary-list';
import type { ChatSummary } from '@/components/chat/chat-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from '@/components/ui/input-group';
import AppLayout from '@/layouts/app-layout';
import employee from '@/routes/employee';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { MessageSquareMore, Search, UserCog, X } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: employee.dashboard().url,
    },
];

const CONVERSATION_SEARCH_DEBOUNCE_MS = 300;

interface DashboardProps {
    status?: string;
    conversationSearch?: string;
    hasMoreConversationResults: boolean;
    activeChats: ChatSummary[];
}

export default function Dashboard({
    status,
    conversationSearch = '',
    hasMoreConversationResults,
    activeChats,
}: DashboardProps) {
    const [searchTerm, setSearchTerm] = useState(conversationSearch);
    const lastRequestedSearchRef = useRef<string | null>(null);

    useEffect(() => {
        if (lastRequestedSearchRef.current === conversationSearch.trim()) {
            lastRequestedSearchRef.current = null;
        }

        setSearchTerm(conversationSearch);
    }, [conversationSearch]);

    function visitConversationSearch(nextSearch: string) {
        lastRequestedSearchRef.current = nextSearch;
        router.get(
            employee.dashboard.url({
                query: nextSearch ? { search: nextSearch } : {},
            }),
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }

    useEffect(() => {
        const nextSearch = searchTerm.trim();

        if (
            nextSearch === conversationSearch.trim() ||
            lastRequestedSearchRef.current === nextSearch
        ) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            visitConversationSearch(nextSearch);
        }, CONVERSATION_SEARCH_DEBOUNCE_MS);

        return () => window.clearTimeout(timeoutId);
    }, [conversationSearch, searchTerm]);

    function handleConversationSearchAction() {
        if (searchTerm.trim() !== '') {
            setSearchTerm('');
            visitConversationSearch('');
            return;
        }

        visitConversationSearch(searchTerm.trim());
    }

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
                                    Cerca tra le conversazioni che hai aperto con i cittadini.
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <InputGroup>
                                <InputGroupInput
                                    type="search"
                                    value={searchTerm}
                                    onChange={(event) =>
                                        setSearchTerm(event.currentTarget.value)
                                    }
                                    placeholder="Cerca per titolo, messaggio o cittadino"
                                    aria-label="Cerca conversazioni"
                                />
                                <InputGroupAddon align="inline-end">
                                    <InputGroupButton
                                        type="button"
                                        variant="ghost"
                                        size={
                                            searchTerm.trim() !== ''
                                                ? 'xs'
                                                : 'icon-xs'
                                        }
                                        onClick={handleConversationSearchAction}
                                        aria-label={
                                            searchTerm.trim() !== ''
                                                ? 'Annulla ricerca'
                                                : 'Cerca conversazioni'
                                        }
                                    >
                                        {searchTerm.trim() !== '' ? (
                                            <>
                                                <X className="size-3.5" />
                                                Annulla
                                            </>
                                        ) : (
                                            <Search className="size-3.5" />
                                        )}
                                    </InputGroupButton>
                                </InputGroupAddon>
                            </InputGroup>

                            {hasMoreConversationResults ? (
                                <p className="text-xs text-muted-foreground">
                                    Mostro i primi risultati disponibili. Apri la
                                    pagina chat per continuare la ricerca.
                                </p>
                            ) : null}

                            <ChatSummaryList
                                chats={activeChats}
                                showCitizenBadge
                                buildChatHref={(chatId) =>
                                    employee.chats.index.url({
                                        query: {
                                            chat: chatId,
                                            ...(conversationSearch
                                                ? { search: conversationSearch }
                                                : {}),
                                        },
                                    })
                                }
                                emptyTitle={
                                    conversationSearch
                                        ? 'Nessuna conversazione trovata.'
                                        : 'Non hai ancora conversazioni attive.'
                                }
                                emptyDescription={
                                    conversationSearch
                                        ? 'Prova a cambiare i termini di ricerca o apri la pagina chat per una ricerca completa.'
                                        : 'Quando parteciperai a una chat la troverai qui.'
                                }
                            />

                            <Button asChild size="lg" className="w-full">
                                <Link
                                    href={employee.chats.index.url({
                                        query: conversationSearch
                                            ? { search: conversationSearch }
                                            : {},
                                    })}
                                >
                                    Apri la pagina chat
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-amber-200 justify-between">
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
                            <Button asChild variant="outline" size="lg" className="w-full">
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
