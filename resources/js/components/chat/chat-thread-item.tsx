import { MessageSquareDot, UserRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '../ui/item';
import { cn } from '@/lib/utils';

type ChatThreadItemProps = {
    fullName: string;
    title: string;
    unreadMessagesAmount: number;
    active?: boolean;
};

export default function ChatThreadItem({
    fullName,
    title,
    unreadMessagesAmount,
    active = false,
}: ChatThreadItemProps) {
    const [isUnreadCountAnimating, setIsUnreadCountAnimating] = useState(false);
    const previousUnreadCountRef = useRef(unreadMessagesAmount);

    useEffect(() => {
        if (previousUnreadCountRef.current === unreadMessagesAmount) {
            return;
        }

        previousUnreadCountRef.current = unreadMessagesAmount;
        setIsUnreadCountAnimating(true);

        const timeoutId = window.setTimeout(() => {
            setIsUnreadCountAnimating(false);
        }, 320);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [unreadMessagesAmount]);

    function getInitials(name: string) {
        return name
            .split(' ')
            .filter(Boolean)
            .map(n => n[0].toUpperCase())
            .slice(0, 2) // max 2 letters
            .join('');
    }

    const initials = getInitials(fullName);

    return (
        <ItemGroup className={cn(active && 'sm:ms-1 sm:ps-1')}>
            <Item
                className={cn(
                    'transition-[background-color,border-color,box-shadow] duration-200',
                    active && 'border-amber-500/30 bg-amber-50/50 shadow-xs dark:border-amber-950 dark:bg-amber-950/20',
                )}
                size="xs"
                variant="outline"
            >
                <ItemMedia>
                    <Avatar className="size-9">
                        <AvatarFallback className={cn(active && 'bg-card')}>
                            {initials || 'N/A'}
                        </AvatarFallback>
                    </Avatar>
                </ItemMedia>
                <ItemContent>
                    <ItemTitle>{title}</ItemTitle>
                    <ItemDescription className="flex flex-row items-center gap-1">
                        <UserRound size={12} />
                        {fullName}
                    </ItemDescription>
                </ItemContent>

                {unreadMessagesAmount > 0 && (
                    <ItemContent>
                        <Badge
                            className={cn(
                                'bg-amber-800 transition-transform duration-300 dark:bg-amber-500',
                                isUnreadCountAnimating && 'scale-110',
                            )}
                        >
                            <MessageSquareDot />
                            {unreadMessagesAmount}
                        </Badge>
                    </ItemContent>
                )}
            </Item>
        </ItemGroup>
    );
}
