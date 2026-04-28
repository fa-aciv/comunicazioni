import {
    GroupMembersManager,
    type GroupEmployeeOption,
    type GroupManagementAbilities,
    type GroupMembershipSummary,
    type GroupRoleSummary,
} from '@/components/groups/group-members-manager';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import employee from '@/routes/employee';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';

interface EmployeeGroupShowPageProps {
    status?: string;
    group: {
        id: number;
        name: string;
        description: string | null;
        isActive: boolean;
        openContactRequestCount: number;
    };
    currentEmployeeId: number;
    abilities: GroupManagementAbilities;
    memberships: GroupMembershipSummary[];
    availableEmployees: GroupEmployeeOption[];
    availableRoles: GroupRoleSummary[];
    membershipStoreUrl: string;
    requestsInboxUrl: string;
    indexUrl: string;
    groupsOverviewUrl: string;
}

export default function EmployeeGroupShowPage({
    status,
    group,
    currentEmployeeId,
    abilities,
    memberships,
    availableEmployees,
    availableRoles,
    membershipStoreUrl,
    requestsInboxUrl,
    indexUrl,
    groupsOverviewUrl,
}: EmployeeGroupShowPageProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: employee.dashboard().url,
        },
        {
            title: 'Panel manager',
            href: indexUrl,
        },
        {
            title: group.name,
            href: `/employee/groups/${group.id}`,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={group.name} />

            <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-6 p-4 md:p-6">
                {status ? (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                        {status}
                    </div>
                ) : null}

                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-3xl font-semibold tracking-tight">{group.name}</h1>
                            <Badge variant={group.isActive ? 'secondary' : 'outline'}>
                                {group.isActive ? 'Attivo' : 'Non attivo'}
                            </Badge>
                        </div>
                        <p className="max-w-3xl text-sm text-muted-foreground">
                            {group.description || 'Nessuna descrizione disponibile per questo gruppo.'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">Richieste aperte: {group.openContactRequestCount}</Badge>
                            {abilities.canAcceptContactRequests ? (
                                <Badge variant="outline">Puoi accettare richieste</Badge>
                            ) : null}
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline">
                            <Link href={requestsInboxUrl}>Apri inbox richieste</Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href={indexUrl}>Torna al panel manager</Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href={groupsOverviewUrl}>Panoramica gruppi</Link>
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardContent className="pt-6">
                        <GroupMembersManager
                            currentEmployeeId={currentEmployeeId}
                            abilities={abilities}
                            memberships={memberships}
                            availableEmployees={availableEmployees}
                            availableRoles={availableRoles}
                            membershipStoreUrl={membershipStoreUrl}
                        />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
