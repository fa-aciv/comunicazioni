import { Link } from '@inertiajs/react';
import { ChevronRight, MessageSquareText, UserRound } from 'lucide-react';

import type { ChatSummary } from '@/components/chat/chat-types';
import { Badge } from '@/components/ui/badge';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import {
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemFooter,
    ItemGroup,
    ItemHeader,
    ItemTitle,
} from '@/components/ui/item';

interface ChatSummaryListProps {
    chats: ChatSummary[];
    buildChatHref: (chatId: number) => string;
    emptyTitle: string;
    emptyDescription: string;
    showCitizenBadge?: boolean;
}

function formatDate(date: string | null | undefined): string {
    if (!date) {
        return 'Nessuna attività recente';
    }

    return new Intl.DateTimeFormat('it-IT', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(date));
}

export function ChatSummaryList({
    chats,
    buildChatHref,
    emptyTitle,
    emptyDescription,
    showCitizenBadge = false,
}: ChatSummaryListProps) {
    if (chats.length === 0) {
        return (
            <Empty className="rounded-2xl">
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <MessageSquareText className="size-4" />
                    </EmptyMedia>
                    <EmptyTitle>{emptyTitle}</EmptyTitle>
                    <EmptyDescription>{emptyDescription}</EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    }

    return (
        <ItemGroup className="gap-0 overflow-hidden rounded-2xl border">
            {chats.map((chat) => (
                <Item
                    key={chat.id}
                    asChild
                    variant="outline"
                    className="rounded-none border-x-0 border-t-0 px-4 py-3 last:border-b-0"
                >
                    <Link href={buildChatHref(chat.id)}>
                        <ItemContent className="min-w-0 pr-2">
                            <ItemHeader className="items-start justify-start flex-wrap-reverse gap-2">
                                <ItemTitle className="">
                                    {chat.title}
                                </ItemTitle>
                                {showCitizenBadge && chat.citizen?.name ? (
                                    <Badge
                                        variant="outline"
                                        className="max-w-40 truncate"
                                    >
                                        <UserRound />
                                        {chat.citizen.name}
                                    </Badge>
                                ) : null}
                                <Badge variant="secondary" className="hidden sm:inline-flex">
                                    {chat.message_count} messaggi
                                </Badge>
                            </ItemHeader>
                            <ItemDescription>
                                {chat.latest_message_preview}
                            </ItemDescription>
                            <ItemFooter className="justify-start text-xs text-muted-foreground">
                                {formatDate(chat.last_activity_at ?? chat.latest_message_date)}
                            </ItemFooter>
                        </ItemContent>
                        <ItemActions className="ml-auto self-center">
                            <ChevronRight className="size-4 text-muted-foreground" />
                        </ItemActions>
                    </Link>
                </Item>
            ))}
        </ItemGroup>
    );
}
