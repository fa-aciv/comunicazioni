import {
    GroupMembersManager,
    type GroupEmployeeOption,
    type GroupManagementAbilities,
    type GroupMembershipSummary,
    type GroupRoleSummary,
} from '@/components/groups/group-members-manager';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import employee from '@/routes/employee';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

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
    defaultRole: GroupRoleSummary | null;
    abilities: GroupManagementAbilities;
    memberships: GroupMembershipSummary[];
    availableEmployees: GroupEmployeeOption[];
    availableRoles: GroupRoleSummary[];
    membershipStoreUrl: string;
}

export default function EmployeeGroupShowPage({
    status,
    group,
    currentEmployeeId,
    defaultRole,
    abilities,
    memberships,
    availableEmployees,
    availableRoles,
    membershipStoreUrl,
}: EmployeeGroupShowPageProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: employee.dashboard().url,
        },
        {
            title: 'Gruppi',
            href: '/employee/groups',
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

                <Card>
                    <CardHeader className="space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-1">
                                <CardTitle>{group.name}</CardTitle>
                                <CardDescription>
                                    {group.description ?? 'Nessuna descrizione disponibile per questo gruppo.'}
                                </CardDescription>
                            </div>
                            <Badge variant={group.isActive ? 'secondary' : 'outline'}>
                                {group.isActive ? 'Attivo' : 'Non attivo'}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <GroupMembersManager
                            currentEmployeeId={currentEmployeeId}
                            abilities={abilities}
                            memberships={memberships}
                            availableEmployees={availableEmployees}
                            availableRoles={availableRoles}
                            membershipStoreUrl={membershipStoreUrl}
                            defaultRole={defaultRole}
                        />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
