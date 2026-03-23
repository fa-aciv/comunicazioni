import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChatMessageTextarea } from '@/components/ui/chat/ChatMessageTextarea';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupText, InputGroupTextarea } from '@/components/ui/input-group';
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import employee from '@/routes/employee';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { ArrowUp, Cross, File, Paperclip, Plus, Search, UserPlus, UserRound } from 'lucide-react';
import { ReactNode } from "react";


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: employee.dashboard().url,
    },
    {
        title: 'Chat',
        href: employee.chats.index().url,
    },
];

const seenChatsStoragePrefix = 'employee-chat-last-seen:';

interface EmployeeSummary {
    id: number;
    name: string;
    email: string;
    department_name?: string;
}

interface CitizenSummary {
    id: number;
    name: string;
    email: string;
    phone_number: string;
    fiscal_code: string;
}

interface ChatSummary {
    id: number;
    title: string;
    latest_message_date?: string | null;
    latest_message_preview: string;
    message_count: number;
    latest_message_author?: {
        id?: number | null;
        type: string;
        name?: string | null;
    } | null;
    citizen: CitizenSummary | null;
    employee_count: number;
}

interface AttachmentSummary {
    id: number;
    file_name: string;
    kind: 'image' | 'pdf' | 'file';
    preview_url: string;
    download_url: string;
}

interface ChatMessageSummary {
    id: number;
    content: string;
    created_at?: string | null;
    author: {
        id?: number | null;
        type: string;
        name?: string | null;
        email?: string | null;
    };
    attachments: AttachmentSummary[];
}

interface SelectedChatSummary {
    id: number;
    title: string;
    latest_message_date?: string | null;
    citizen: CitizenSummary | null;
    employees: EmployeeSummary[];
    messages: ChatMessageSummary[];
}

interface EmployeeChatsProps {
    status?: string;
    currentEmployeeId: number;
    pollIntervalSeconds: number;
    selectedChatId?: number | null;
    employees: EmployeeSummary[];
    chatSummaries: ChatSummary[];
    selectedChat: SelectedChatSummary | null;
}

export default function EmployeeChatsPage({
    status,
    currentEmployeeId,
    pollIntervalSeconds,
    selectedChatId,
    employees,
    chatSummaries,
    selectedChat,
}: EmployeeChatsProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Chat dipendenti" />

            <div className="flex flex-col gap-4 overflow-hidden rounded-xl p-4">
                    {status && (
                        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                            {status}
                        </div>
                    )}
                    <div className="min-h-0 flex-1">
                        <div className="flex h-full w-full flex-col-reverse sm:flex-row items-stretch gap-2 p-1">
                            <aside className="flex min-h-0 flex-1 flex-col self-stretch">
                                <Card className="flex h-full flex-col rounded-sm">
                                    <CardHeader className="shrink-0">
                                        <CardTitle className="flex flex-row justify-between items-center">
                                            Conversazioni 

                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex flex-col gap-2 pt-0">
                                        <ButtonGroup>
                                            <Input id="input-button-group" placeholder="Cerca..." />
                                            <Button variant="outline"><Search /></Button>
                                        </ButtonGroup>
                                        <div className="flex flex-col gap-2">
                                            <ChatThreadItem 
                                                title="Titolo della chat"
                                                fullName="Nome Cognome"
                                                unreadMessagesAmount={0}
                                                active
                                            />
                                            <ChatThreadItem 
                                                title="Titolo della chat"
                                                fullName="Nome Cognome"
                                                unreadMessagesAmount={10} 
                                            />     
                                        </div>
                                    </CardContent>
                                </Card>
                            </aside>

                            <main className="flex h-[calc(100dvh-10rem)] sm:min-w-sm sm:flex-2 flex-col self-stretch">
                                <Card 
                                    className="flex flex-col rounded-sm"
                                >
                                    <CardHeader className="flex flex-row flex-wrap justify-between items-center">
                                        <CardTitle className="me-2">
                                            Chat
                                        </CardTitle>
                                        <div className="flex flex-row gap-2 items-center">
                                            <div className="flex flex-wrap gap-2">
                                                <ParticipantBadge type="employee" name="Nome Cognome" />
                                                <ParticipantBadge type="citizen" name="Nome Cognome" />
                                            </div>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="outline" size="lg">
                                                        <UserPlus />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Aggiungi un partecipante</p>
                                                </TooltipContent>
                                            </Tooltip>
                                            
                                        </div>
                                        
                                    </CardHeader>
                                    <CardContent className="flex flex-1 flex-col gap-2 overflow-hidden">
                                        <div className="flex-1 overflow-auto rounded-sm border bg-gray-100/50 dark:bg-card">
                                            <div className="flex flex-col gap-2 p-2 justify-end">
                                                <MessageBubble>
                                                    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Pariatur minima odit, harum aliquam quaerat non adipisci aliquid neque, minus quia ipsa sed, cum dignissimos. Modi veniam reprehenderit ipsum deleniti maxime.</p>
                                                </MessageBubble>
                                                <MessageBubble variant="author">
                                                    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Pariatur minima odit, harum aliquam quaerat non adipisci aliquid neque, minus quia ipsa sed, cum dignissimos. Modi veniam reprehenderit ipsum deleniti maxime.</p>
                                                </MessageBubble>
                                                <MessageBubble variant="author">
                                                    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Pariatur minima odit, harum aliquam quaerat non adipisci aliquid neque, minus quia ipsa sed, cum dignissimos. Modi veniam reprehenderit ipsum deleniti maxime.</p>
                                                </MessageBubble>
                                                <MessageBubble variant="author">
                                                    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Pariatur minima odit, harum aliquam quaerat non adipisci aliquid neque, minus quia ipsa sed, cum dignissimos. Modi veniam reprehenderit ipsum deleniti maxime.</p>
                                                </MessageBubble>
                                                <MessageBubble variant="author">
                                                    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Pariatur minima odit, harum aliquam quaerat non adipisci aliquid neque, minus quia ipsa sed, cum dignissimos. Modi veniam reprehenderit ipsum deleniti maxime.</p>
                                                </MessageBubble>
                                                <MessageBubble variant="author">
                                                    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Pariatur minima odit, harum aliquam quaerat non adipisci aliquid neque, minus quia ipsa sed, cum dignissimos. Modi veniam reprehenderit ipsum deleniti maxime.</p>
                                                </MessageBubble>
                                                <MessageBubble variant="author">
                                                    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Pariatur minima odit, harum aliquam quaerat non adipisci aliquid neque, minus quia ipsa sed, cum dignissimos. Modi veniam reprehenderit ipsum deleniti maxime.</p>
                                                </MessageBubble>
                                                <MessageBubble variant="author">
                                                    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Pariatur minima odit, harum aliquam quaerat non adipisci aliquid neque, minus quia ipsa sed, cum dignissimos. Modi veniam reprehenderit ipsum deleniti maxime.</p>
                                                </MessageBubble>
                                            </div>
                                        </div>
                                        <div>
                                            <ChatMessageTextarea />
                                        </div>
                                    </CardContent>
                                </Card>
                            </main>
                        </div>
                    </div>
            </div>
        </AppLayout>
    );
}

type MessageBubbleProps = {
    children: ReactNode;
    variant?: "author" | "other";
    authorName: string;
    timestamp: string;
};

function MessageBubble({ children, variant = "other", authorName, timestamp }: MessageBubbleProps) {
    const isAuthor = variant === "author";
    return (
        <div className={cn(
            isAuthor
            ? "self-end" : "self-start",
            "w-2/3 flex flex-col"
        )}>
            <Item
                className={cn(
                    "bg-card border shadow-xs flex flex-col",
                    isAuthor
                        ? "rounded-br-none bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-950/50"
                        : "rounded-bl-none border-gray-200 dark:border-card dark:bg-gray-700/50"
                )}
            >
                <div className={cn(
                    isAuthor ? "self-start" : "self-start",
                    "text-xs"
                )}>
                    <span className="font-semibold text">Nome Cognome</span> <span className="italic">12:30:00 16/02/2026</span>
                </div>
                {children}
                <div className="flex flex-row flex-wrap gap-2">
                    <MessageAttachment isAuthor={isAuthor} filename="Nome del file.pdf" />
                    <MessageAttachment isAuthor={isAuthor} filename="Nome del file.pdf" />
                    <MessageAttachment isAuthor={isAuthor} filename="Nome del file.pdf" />
                    <MessageAttachment isAuthor={isAuthor} filename="Nome del file.pdf" />
                </div>
                
            </Item>
            
        </div>

    );
}

type MessageAttachmentProps = {
    filename: string;
    isAuthor?: boolean;
};

function MessageAttachment({ filename, isAuthor = false }: MessageAttachmentProps) {
    return (
        <Item
            variant="outline"
            className={cn(
                "w-auto bg-card gap-1.5 border shadow-xs border-border p-1 px-2",
                isAuthor && "border-amber-700/20"
            )}
        >
            <File size={14} />
            <p>{filename}</p>
        </Item>
    );
}

type ParticipantType = "employee" | "citizen";

type ParticipantBadgeProps = {
    name: string;
    type: ParticipantType;
    className?: string;
};

function ParticipantBadge({ name, type, className }: ParticipantBadgeProps) {
    const isEmployee = type === "employee";

    return (
        <Badge
            variant="outline"
            className={cn(
                "flex items-center gap-1.5",
                className
            )}
        >
            {isEmployee ? <UserRound size={14} /> : <Cross size={14} />}
            <span>{name}</span>
        </Badge>
    );
}

type ChatThreadItemProps = {
    fullName: string;
    title: string;
    unreadMessagesAmount: number;
    active?: boolean;
};

function ChatThreadItem({ fullName, title, unreadMessagesAmount, active = false }: ChatThreadItemProps) {
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
            <Item className={cn(active && "ms-2 bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 shadow-xs")} size="xs" variant="outline">
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