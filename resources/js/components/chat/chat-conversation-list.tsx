import { Link, router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useDeferredValue, useEffect, useState } from 'react';

import { ChatCreateThreadDialog } from '@/components/chat/chat-create-thread-dialog';
import type { ChatSummary } from '@/components/chat/chat-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ChatThreadItem from '@/components/chat/chat-thread-item';
import { Input } from '@/components/ui/input';

interface ChatConversationListProps {
    chatSummaries: ChatSummary[];
    activeChatId: number | null;
    conversationSearch?: string;
    conversationListLimit?: number;
    hasMoreConversations?: boolean;
    buildChatHref: (chatId: number) => string;
    buildConversationSearchHref: (
        search: string,
        activeChatId: number | null,
    ) => string;
    canCreateChats?: boolean;
    buildThreadStoreUrl?: () => string;
}

export function ChatConversationList({
    chatSummaries,
    activeChatId,
    conversationSearch = '',
    conversationListLimit = 100,
    hasMoreConversations = false,
    buildChatHref,
    buildConversationSearchHref,
    canCreateChats = false,
    buildThreadStoreUrl,
}: ChatConversationListProps) {
    const [searchTerm, setSearchTerm] = useState(conversationSearch);
    const deferredSearchTerm = useDeferredValue(searchTerm);

    useEffect(() => {
        setSearchTerm(conversationSearch);
    }, [conversationSearch]);

    useEffect(() => {
        const nextSearch = deferredSearchTerm.trim();
        const currentSearch = conversationSearch.trim();

        if (nextSearch === currentSearch) {
            return;
        }

        router.get(
            buildConversationSearchHref(nextSearch, activeChatId),
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }, [
        activeChatId,
        buildConversationSearchHref,
        conversationSearch,
        deferredSearchTerm,
    ]);

    return (
        <aside className="flex min-h-0 flex-1 flex-col self-stretch sm:max-w-sm sm:shadow-sm">
            <Card className="flex h-full flex-col rounded-sm">
                <CardHeader className="shrink-0">
                    <CardTitle className="flex flex-row items-center justify-between">
                        <span>Conversazioni</span>
                        {canCreateChats && buildThreadStoreUrl ? (
                            <ChatCreateThreadDialog
                                buildThreadStoreUrl={buildThreadStoreUrl}
                            />
                        ) : null}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex min-h-0 flex-1 flex-col gap-2 pt-0">
                    <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="search"
                            value={searchTerm}
                            onChange={(event) =>
                                setSearchTerm(event.currentTarget.value)
                            }
                            className="pl-9"
                            placeholder="Cerca conversazioni..."
                            aria-label="Cerca conversazioni"
                        />
                    </div>

                    {hasMoreConversations ? (
                        <div className="rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
                            {conversationSearch
                                ? `Mostro i primi ${conversationListLimit} risultati. Affina la ricerca per restringere l'elenco.`
                                : `Mostro le ${conversationListLimit} conversazioni piu recenti. Usa la ricerca per trovare quelle meno recenti.`}
                        </div>
                    ) : null}

                    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto pr-1">
                        {chatSummaries.length > 0 ? (
                            chatSummaries.map((chatSummary) => (
                                <Link
                                    key={chatSummary.id}
                                    href={buildChatHref(chatSummary.id)}
                                    preserveScroll
                                    className="block"
                                >
                                    <ChatThreadItem
                                        title={chatSummary.title}
                                        fullName={resolveConversationName(chatSummary)}
                                        unreadMessagesAmount={0}
                                        active={chatSummary.id === activeChatId}
                                    />
                                </Link>
                            ))
                        ) : conversationSearch.trim() !== '' ? (
                            <div className="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
                                Nessuna conversazione trovata per questa ricerca.
                            </div>
                        ) : (
                            <div className="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
                                Nessuna conversazione disponibile.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </aside>
    );
}

function resolveConversationName(chatSummary: ChatSummary) {
    return (
        chatSummary.citizen?.name ??
        chatSummary.latest_message_author?.name ??
        'Partecipante sconosciuto'
    );
}
