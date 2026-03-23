import { SidebarProvider } from '@/components/ui/sidebar';
import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { TooltipProvider } from './ui/tooltip';

interface AppShellProps {
    children: React.ReactNode;
    variant?: 'header' | 'sidebar';
}

export function AppShell({ children, variant = 'header' }: AppShellProps) {
    const isOpen = usePage<SharedData>().props.sidebarOpen;

    if (variant === 'header') {
        return (
            <TooltipProvider><div className="flex min-h-screen w-full flex-col">{children}</div></TooltipProvider>
        );
    }

    return <TooltipProvider><SidebarProvider defaultOpen={isOpen}>{children}</SidebarProvider></TooltipProvider>;
}
