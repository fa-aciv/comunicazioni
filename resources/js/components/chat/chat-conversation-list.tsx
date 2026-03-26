import { Link } from '@inertiajs/react';
import { Search } from 'lucide-react';

import { ChatCreateThreadDialog } from '@/components/chat/chat-create-thread-dialog';
import type { ChatSummary } from '@/components/chat/chat-types';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ChatThreadItem from '@/components/chat/chat-thread-item';
import { Input } from '@/components/ui/input';

interface ChatConversationListProps {
    chatSummaries: ChatSummary[];
    activeChatId: number | null;
    buildChatHref: (chatId: number) => string;
    canCreateChats?: boolean;
    buildThreadStoreUrl?: () => string;
}

export function ChatConversationList({
    chatSummaries,
    activeChatId,
    buildChatHref,
    canCreateChats = false,
    buildThreadStoreUrl,
}: ChatConversationListProps) {
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
                    <ButtonGroup>
                        <Input id="input-button-group" placeholder="Cerca..." />
                        <Button type="button" variant="outline">
                            <Search />
                        </Button>
                    </ButtonGroup>

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
