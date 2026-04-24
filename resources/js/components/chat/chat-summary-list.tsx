import { Link } from '@inertiajs/react';
import { ChevronRight, Clock, Mail, MessageCircle, MessageSquareDot, MessageSquareText, MessagesSquare, UserRound } from 'lucide-react';

import type { ChatSummary } from '@/components/chat/chat-types';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
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
import { Card } from '../ui/card';

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
        <ItemGroup className="gap-2">
            {chats.map((chat) => (
                <ChatSummaryItem
                    key={chat.id}
                    chat={chat}
                    buildChatHref={buildChatHref}
                    showCitizenBadge={showCitizenBadge}
                />
            ))}
        </ItemGroup>
    );
}

function ChatSummaryItem({
    chat,
    buildChatHref,
    showCitizenBadge = false,
}: {
    chat: ChatSummary;
    buildChatHref: (chatId: number) => string;
    showCitizenBadge?: boolean;
}) {
    const unreadMessageCount = chat.unread_message_count ?? 0;

    return (
        <Item
            key={chat.id}
            asChild
            variant="outline"
            className="shadow-xs"
        >
            <Link href={buildChatHref(chat.id)}>
                <ItemContent className="min-w-0">
                    <ItemHeader className="items-start justify-between flex-wrap-reverse gap-2">
                        <div className="flex flex-row gap-2">
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
                            {unreadMessageCount > 0 ? (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Badge variant="secondary" className="hidden sm:inline-flex">
                                            <MessageSquareDot /> {unreadMessageCount}
                                        </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {unreadMessageCount} messaggi non letti
                                    </TooltipContent>
                                </Tooltip>
                            ) : null}
                        </div>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Badge variant="outline">
                                    <MessagesSquare />
                                    {formatDate(chat.last_activity_at ?? chat.latest_message_date)}
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                                Ultima attività
                            </TooltipContent>
                        </Tooltip>
                    </ItemHeader>
                    <ItemDescription>
                        {chat.latest_message_preview}
                    </ItemDescription>
                </ItemContent>
                <ItemActions className="ml-auto self-center">
                    <ChevronRight className="size-4 text-muted-foreground" />
                </ItemActions>
            </Link>
        </Item>
    );
}