import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User | null;
    activeGuard: 'citizen' | 'employee' | null;
    guards: {
        citizen: boolean;
        employee: boolean;
    };
    homeUrl: string | null;
    logoutUrl: string | null;
    portalLabel: string | null;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at?: string | null;
    created_at: string;
    updated_at: string;
    department_name?: string;
    department_id?: string;
    fiscal_code?: string;
    phone_number?: string;
    [key: string]: string | number | boolean | null | undefined;
}
