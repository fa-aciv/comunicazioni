import { cn } from "@/lib/utils";
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "../item";
import { Avatar, AvatarFallback } from "../avatar";
import { UserRound } from "lucide-react";
import { Badge } from "../badge";

type ChatThreadItemProps = {
    fullName: string;
    title: string;
    unreadMessagesAmount: number;
    active?: boolean;
};

export default function ChatThreadItem({ fullName, title, unreadMessagesAmount, active = false }: ChatThreadItemProps) {
    function getInitials(name: string) {
        return name
            .split(" ")
            .filter(Boolean)
            .map(n => n[0].toUpperCase())
            .slice(0, 2) // max 2 letters
            .join("");
    }

    const initials = getInitials(fullName);

    return (
        <ItemGroup >
            <Item 
                className={cn(active && "ms-1 bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 shadow-xs")} 
                size="xs" variant="outline"
            >
                <ItemMedia>
                    <Avatar className="size-9">
                        <AvatarFallback>{initials || "N/A"}</AvatarFallback>
                    </Avatar>
                </ItemMedia>
                <ItemContent>
                    <ItemTitle>{title}</ItemTitle>
                    <ItemDescription className="flex flex-row items-center gap-1">
                        <UserRound size={12} />
                        {fullName}
                    </ItemDescription>
                </ItemContent>
                
                { unreadMessagesAmount > 0 && 
                    <ItemContent>
                        <Badge className="bg-amber-800 dark:bg-amber-500">{unreadMessagesAmount}</Badge>
                    </ItemContent>
                }
            </Item>
        </ItemGroup>
    );
}