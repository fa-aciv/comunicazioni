import InputError from '@/components/input-error';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Sidebar, SidebarProvider } from '@/components/ui/sidebar';
import { Spinner } from '@/components/ui/spinner';
import AppLayout from '@/layouts/app-layout';
import employee from '@/routes/employee';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import {
    FileDown,
    FileImage,
    FileText,
    MessageSquareDot,
    Paperclip,
    Users,
} from 'lucide-react';
import { type Dispatch, type RefObject, type SetStateAction, useEffect, useState } from 'react';

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

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                    {status && (
                        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                            {status}
                        </div>
                    )}
                    <div className="flex w-full h-full">
                        <aside className="flex-[1]">
                            <CardDemo />
                        </aside>

                        <main className="flex-[3]">
                            Right
                        </main>
                    </div>
            </div>
        </AppLayout>
    );
}

import {
  CardAction,
  CardFooter,
} from "@/components/ui/card"

export function CardDemo() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Login to your account</CardTitle>
        <CardDescription>
          Enter your email below to login to your account
        </CardDescription>
        <CardAction>
          <Button variant="link">Sign Up</Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <form>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <a
                  href="#"
                  className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                >
                  Forgot your password?
                </a>
              </div>
              <Input id="password" type="password" required />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Button type="submit" className="w-full">
          Login
        </Button>
        <Button variant="outline" className="w-full">
          Login with Google
        </Button>
      </CardFooter>
    </Card>
  )
}
