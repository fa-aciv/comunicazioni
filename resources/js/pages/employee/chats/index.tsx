import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupText, InputGroupTextarea } from '@/components/ui/input-group';
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import employee from '@/routes/employee';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { ArrowUp, Search, Send, SendHorizonal, SendHorizontal, Sidebar, SidebarClose, UserRound } from 'lucide-react';


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

            <div className="flex min-h-0 flex-1 flex-col gap-4 rounded-xl p-4">
                    {status && (
                        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                            {status}
                        </div>
                    )}
                    <div className="flex gap-2 min-h-0 flex-1 w-full flex-row">
                        <aside className="min-h-0 flex-1">
                            <Card className="rounded-sm h-full">
                                <CardHeader>
                                    <CardTitle className="flex flex-row justify-between items-center">
                                        Conversazioni 
                                        <div className="rounded-full p-1 hover:bg-black/10">
                                            <Sidebar size="20"/>
                                        </div>
                                    </CardTitle>
                                    <CardContent className="flex flex-col px-0 h-full gap-2 mt-2">
                                        <ButtonGroup>
                                            <Input id="input-button-group" placeholder="Cerca..." />
                                            <Button variant="outline"><Search /></Button>
                                        </ButtonGroup>
                                        <ItemGroup>
                                            <Item 
                                                size="xs"
                                                variant="outline"
                                            >
                                                <ItemMedia>
                                                    <Avatar className="size-9">
                                                        <AvatarFallback>NC</AvatarFallback>
                                                    </Avatar>
                                                </ItemMedia>
                                                <ItemContent>
                                                    <ItemTitle>
                                                        Titolo della chat
                                                    </ItemTitle>
                                                    <ItemDescription className="flex flex-row items-center gap-1">
                                                        <UserRound size="12" />Nome Cognome
                                                    </ItemDescription>
                                                </ItemContent>
                                            </Item>
                                        </ItemGroup>
                                    </CardContent>
                                </CardHeader>
                            </Card>
                        </aside>

                        <main className="flex-3">
                            <Card 
                                className="rounded-sm"
                            >
                                <CardHeader>
                                    <CardTitle>
                                        Chat
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-2">
                                    <ScrollArea className="border flex-3 bg-gray-100/50 rounded-sm">
                                        <div className="flex flex-col gap-2 p-2 justify-end">
                                            <Item className="bg-white border border-gray-200 shadow-xs w-2/3 self-start rounded-be-none">
                                                <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquam optio corrupti ad illo maiores atque, rem error omnis quibusdam, animi doloribus facere. Voluptas magnam ipsum consequuntur, non amet nulla sint?</p>
                                            </Item>
                                            <Item className="bg-white border border-gray-200 shadow-xs w-2/3 self-end rounded-br-none">
                                                <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquam optio corrupti ad illo maiores atque, rem error omnis quibusdam, animi doloribus facere. Voluptas magnam ipsum consequuntur, non amet nulla sint?</p>
                                            </Item>
                                            <Item className="bg-white border border-gray-200 shadow-xs w-2/3 self-start rounded-be-none">
                                                <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquam optio corrupti ad illo maiores atque, rem error omnis quibusdam, animi doloribus facere. Voluptas magnam ipsum consequuntur, non amet nulla sint?</p>
                                            </Item>
                                            <Item className="bg-white border border-gray-200 shadow-xs w-2/3 self-start rounded-be-none">
                                                <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquam optio corrupti ad illo maiores atque, rem error omnis quibusdam, animi doloribus facere. Voluptas magnam ipsum consequuntur, non amet nulla sint?</p>
                                            </Item>
                                            <Item className="bg-white border border-gray-200 shadow-xs w-2/3 self-start rounded-be-none">
                                                <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquam optio corrupti ad illo maiores atque, rem error omnis quibusdam, animi doloribus facere. Voluptas magnam ipsum consequuntur, non amet nulla sint?</p>
                                            </Item>
                                            <Item className="bg-white border border-gray-200 shadow-xs w-2/3 self-start rounded-be-none">
                                                <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquam optio corrupti ad illo maiores atque, rem error omnis quibusdam, animi doloribus facere. Voluptas magnam ipsum consequuntur, non amet nulla sint?</p>
                                            </Item>
                                            <Item className="bg-white border border-gray-200 shadow-xs w-2/3 self-start rounded-be-none">
                                                <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquam optio corrupti ad illo maiores atque, rem error omnis quibusdam, animi doloribus facere. Voluptas magnam ipsum consequuntur, non amet nulla sint?</p>
                                            </Item>
                                            <Item className="bg-white border border-gray-200 shadow-xs w-2/3 self-start rounded-be-none">
                                                <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquam optio corrupti ad illo maiores atque, rem error omnis quibusdam, animi doloribus facere. Voluptas magnam ipsum consequuntur, non amet nulla sint?</p>
                                            </Item>
                                            <Item className="bg-white border border-gray-200 shadow-xs w-2/3 self-start rounded-be-none">
                                                <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquam optio corrupti ad illo maiores atque, rem error omnis quibusdam, animi doloribus facere. Voluptas magnam ipsum consequuntur, non amet nulla sint?</p>
                                            </Item>
                                            <Item className="bg-white border border-gray-200 shadow-xs w-2/3 self-start rounded-be-none">
                                                <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquam optio corrupti ad illo maiores atque, rem error omnis quibusdam, animi doloribus facere. Voluptas magnam ipsum consequuntur, non amet nulla sint?</p>
                                            </Item>
                                            <Item className="bg-white border border-gray-200 shadow-xs w-2/3 self-start rounded-be-none">
                                                <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquam optio corrupti ad illo maiores atque, rem error omnis quibusdam, animi doloribus facere. Voluptas magnam ipsum consequuntur, non amet nulla sint?</p>
                                            </Item>
                                        </div>
                                    </ScrollArea>
                                    <div className="flex-1">
                                        <InputGroup>
                                            <InputGroupTextarea
                                                id="block-end-textarea"
                                                placeholder="Scrivi un messaggio..."
                                            />
                                            <InputGroupAddon align="block-end">
                                                <InputGroupText>0/280</InputGroupText>
                                                <InputGroupButton variant="default" size="sm" className="ml-auto">
                                                    Invia
                                                    <ArrowUp />
                                                </InputGroupButton>
                                            </InputGroupAddon>
                                        </InputGroup>
                                    </div>
                                </CardContent>
                            </Card>
                        </main>
                    </div>
            </div>
        </AppLayout>
    );
}
