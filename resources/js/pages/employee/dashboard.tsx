import { ChatSummaryList } from '@/components/chat/chat-summary-list';
import type { ChatSummary } from '@/components/chat/chat-types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Item,
    ItemActions,
    ItemContent,
    ItemFooter,
    ItemGroup,
    ItemHeader,
    ItemTitle,
} from '@/components/ui/item';
import { cn } from '@/lib/utils';
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
import { Building2, ChevronRight, Inbox, MessageSquareMore, Search, Settings, UserPen, UserRound, X } from 'lucide-react';

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
    openGroupRequestCount: number;
    recentGroupContactRequests: Array<{
        id: number;
        groupName: string;
        citizenName: string;
        subject: string | null;
        messagePreview: string;
        createdAt: string | null;
    }>;
}

function formatDateTime(value: string | null): string {
    if (!value) {
        return 'Data non disponibile';
    }

    return new Intl.DateTimeFormat('it-IT', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(new Date(value));
}

export default function Dashboard({
    status,
    conversationSearch = '',
    hasMoreConversationResults,
    activeChats,
    openGroupRequestCount,
    recentGroupContactRequests,
}: DashboardProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="mx-auto flex h-full w-full max-w-7xl flex-1 flex-col gap-4 p-4 md:p-6">
                {status && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                        {status}
                    </div>
                )}

                <div className="grid gap-4 lg:grid-cols-2">
                    <ConversationSearchCard
                        key={conversationSearch}
                        appliedSearch={conversationSearch}
                        hasMoreConversationResults={hasMoreConversationResults}
                        activeChats={activeChats}
                    />

                    <Card className="justify-between border-indigo-200">
                        <CardHeader className="space-y-3">
                            <div className={cn(
                                    "flex",
                                    "size-11",
                                    "items-center",
                                    "justify-center",
                                    "rounded-2xl",
                                    "bg-indigo-100",
                                    "text-indigo-700",
                                    "dark:bg-indigo-950",
                                    "dark:text-indigo-300"
                            )}>
                                <Inbox className="size-5" />
                            </div>
                            <div className="space-y-1">
                                <CardTitle>Richieste di contatto</CardTitle>
                                <CardDescription>
                                    Visualizza e prendi in carico le richieste rivolte ai gruppi che segui.
                                </CardDescription>
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">
                                Richieste aperte: {openGroupRequestCount}
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {recentGroupContactRequests.length > 0 ? (
                                <div className="space-y-2">
                                    <ItemGroup className="gap-2">
                                        {recentGroupContactRequests.map((contactRequest) => (
                                            <Item
                                                key={contactRequest.id}
                                                asChild
                                                variant="outline"
                                                className="shadow-xs"
                                            >
                                                <Link href="/employee/group-contact-requests">
                                                    <ItemContent className="min-w-0">
                                                        <ItemHeader className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                                                            <ItemTitle
                                                                className="w-full truncate pr-2"
                                                                title={contactRequest.messagePreview || 'Messaggio non disponibile'}
                                                            >
                                                                {contactRequest.messagePreview || 'Messaggio non disponibile'}
                                                            </ItemTitle>
                                                            <Badge variant="outline" className="shrink-0">
                                                                <Inbox />
                                                                {formatDateTime(contactRequest.createdAt)}
                                                            </Badge>
                                                        </ItemHeader>
                                                        <ItemFooter className="mt-1 justify-start flex-wrap">
                                                            <Badge
                                                                variant="outline"
                                                                className="max-w-40 truncate"
                                                                title={contactRequest.citizenName}
                                                            >
                                                                <UserRound />
                                                                {contactRequest.citizenName}
                                                            </Badge>
                                                            <Badge
                                                                variant="outline"
                                                                className="max-w-44 truncate"
                                                                title={contactRequest.groupName}
                                                            >
                                                                <Building2 />
                                                                {contactRequest.groupName}
                                                            </Badge>
                                                        </ItemFooter>
                                                    </ItemContent>
                                                    <ItemActions className="ml-auto self-center">
                                                        <ChevronRight className="size-4 text-muted-foreground" />
                                                    </ItemActions>
                                                </Link>
                                            </Item>
                                        ))}
                                    </ItemGroup>
                                </div>
                            ) : null}
                            <Button asChild variant="outline" size="lg" className="w-full">
                                <Link href="/employee/group-contact-requests">
                                    Apri inbox richieste
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-amber-200 justify-between">
                        <CardHeader className="space-y-3">
                            <div className={cn(
                                    "flex",
                                    "size-11",
                                    "items-center",
                                    "justify-center",
                                    "rounded-2xl",
                                    "bg-amber-100",
                                    "dark:bg-amber-950",
                                    "dark:text-amber-300",
                                    "text-amber-700"
                            )}>
                                <UserPen className="size-5" />
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

                    <Card className="border-sky-200 justify-between">
                        <CardHeader className="space-y-3">
                            <div className={cn(
                                    "flex",
                                    "size-11",
                                    "items-center",
                                    "justify-center",
                                    "rounded-2xl",
                                    "bg-sky-100",
                                    "dark:bg-sky-950",
                                    "dark:text-sky-300",
                                    "text-sky-700"
                            )}>
                                <Settings className="size-5" />
                            </div>
                            <div className="space-y-1">
                                <CardTitle>Impostazioni</CardTitle>
                                <CardDescription>
                                    Configura la retention automatica di messaggi e conversazioni.
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Button asChild variant="outline" size="lg" className="w-full">
                                <Link href={employee.settings.index().url}>
                                    Apri impostazioni
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

interface ConversationSearchCardProps {
    appliedSearch: string;
    hasMoreConversationResults: boolean;
    activeChats: ChatSummary[];
}

function ConversationSearchCard({
    appliedSearch,
    hasMoreConversationResults,
    activeChats,
}: ConversationSearchCardProps) {
    const [searchTerm, setSearchTerm] = useState(appliedSearch);
    const lastRequestedSearchRef = useRef<string | null>(null);

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

        if (nextSearch === appliedSearch.trim()) {
            return;
        }

        if (lastRequestedSearchRef.current === nextSearch) {
            lastRequestedSearchRef.current = null;
            return;
        }

        const timeoutId = window.setTimeout(() => {
            visitConversationSearch(nextSearch);
        }, CONVERSATION_SEARCH_DEBOUNCE_MS);

        return () => window.clearTimeout(timeoutId);
    }, [appliedSearch, searchTerm]);

    function handleConversationSearchAction() {
        const nextSearch = searchTerm.trim();

        if (nextSearch !== '') {
            setSearchTerm('');
            visitConversationSearch('');
            return;
        }

        if (nextSearch !== appliedSearch.trim()) {
            visitConversationSearch(nextSearch);
        }
    }

    return (
        <Card className="border-sky-200">
            <CardHeader className="space-y-3">
                <div
                    className={cn(
                        'flex',
                        'size-11',
                        'items-center',
                        'justify-center',
                        'rounded-2xl',
                        'bg-sky-100',
                        'text-sky-700',
                        'dark:bg-sky-900',
                        'dark:text-sky-300',
                    )}
                >
                    <MessageSquareMore className="size-5" />
                </div>
                <div className="space-y-1">
                    <CardTitle>Conversazioni recenti</CardTitle>
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
                            size={searchTerm.trim() !== '' ? 'xs' : 'icon-xs'}
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
                                ...(appliedSearch ? { search: appliedSearch } : {}),
                            },
                        })
                    }
                    emptyTitle={
                        appliedSearch
                            ? 'Nessuna conversazione trovata.'
                            : 'Non hai ancora conversazioni attive.'
                    }
                    emptyDescription={
                        appliedSearch
                            ? 'Prova a cambiare i termini di ricerca o apri la pagina chat per una ricerca completa.'
                            : 'Quando parteciperai a una chat la troverai qui.'
                    }
                />

                <Button asChild size="lg" className="w-full">
                    <Link
                        href={employee.chats.index.url({
                            query: appliedSearch
                                ? { search: appliedSearch }
                                : {},
                        })}
                    >
                        Apri la pagina chat
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}
