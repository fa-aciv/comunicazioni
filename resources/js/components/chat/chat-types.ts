export type ChatActorType = 'User' | 'Citizen';

export interface EmployeeSummary {
    id: number;
    name: string;
    email: string;
    department_name?: string;
}

export interface ChatGroupSummary {
    id: number;
    name: string;
}

export interface CitizenSummary {
    id: number;
    name: string;
    email: string;
    phone_number: string;
    fiscal_code: string;
}

export interface ChatSummary {
    id: number;
    title: string;
    latest_message_date?: string | null;
    last_activity_at?: string | null;
    latest_message_preview: string;
    message_count: number;
    unread_message_count?: number;
    latest_message_author?: {
        id?: number | null;
        type: string;
        name?: string | null;
    } | null;
    citizen: CitizenSummary | null;
    employee_count: number;
}

export interface AttachmentSummary {
    id: number;
    file_name: string;
    kind: 'image' | 'pdf' | 'file';
    preview_url: string;
    download_url: string;
}

export interface ChatMessageSummary {
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

export interface SelectedChatSummary {
    id: number;
    title: string;
    latest_message_date?: string | null;
    last_activity_at?: string | null;
    citizen: CitizenSummary | null;
    employees: EmployeeSummary[];
    messages: ChatMessageSummary[];
}
