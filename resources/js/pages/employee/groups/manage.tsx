import {
    GroupMembersManager,
    type GroupEmployeeOption,
    type GroupManagementAbilities,
    type GroupMembershipSummary,
    type GroupRoleSummary,
} from '@/components/groups/group-members-manager';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Item } from '@/components/ui/item';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import employee from '@/routes/employee';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { ChevronDown, Users } from 'lucide-react';
import { useState } from 'react';

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
        title: 'Gestione gruppi',
        href: '/employee/groups/manage',
    },
];

interface EmployeeGroupManagePageProps {
    status?: string;
    currentEmployeeId: number;
    availableRoles: GroupRoleSummary[];
    groups: Array<{
        id: number;
        name: string;
        description: string | null;
        isActive: boolean;
        membershipCount: number;
        openContactRequestCount: number;
        defaultRole: GroupRoleSummary | null;
        currentRoleName: string | null;
        currentPermissionNames: string[];
        abilities: GroupManagementAbilities;
        memberships: GroupMembershipSummary[];
        availableEmployees: GroupEmployeeOption[];
        membershipStoreUrl: string;
    }>;
    groupsOverviewUrl: string;
    canOpenAdminPanel: boolean;
    adminPanelUrl: string | null;
}

export default function EmployeeGroupManagePage({
    status,
    currentEmployeeId,
    availableRoles,
    groups,
}: EmployeeGroupManagePageProps) {
    const [openGroupId, setOpenGroupId] = useState<number | null>(null);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gestione gruppi" />

            <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-6 p-4 md:p-6">
                {status ? (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                        {status}
                    </div>
                ) : null}

                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-semibold tracking-tight">Gestione gruppi</h1>
                        <p className="text-sm text-muted-foreground">
                            Apri un gruppo per aggiungere o rimuovere membri. I ruoli vengono configurati dall’amministrazione gruppi.
                        </p>
                    </div>
                </div>

                {groups.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex min-h-48 flex-col items-center justify-center gap-3 py-12 text-center">
                            <Users className="size-8 text-muted-foreground" />
                            <div className="space-y-1">
                                <p className="font-medium">Non gestisci ancora alcun gruppo.</p>
                                <p className="text-sm text-muted-foreground">
                                    Quando ti verranno assegnati permessi manageriali, qui compariranno i gruppi gestibili.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {groups.map((group) => {
                            const isOpen = openGroupId === group.id;

                            return (
                                <Collapsible
                                    key={group.id}
                                    open={isOpen}
                                    onOpenChange={
                                        (nextOpen) => 
                                        setOpenGroupId(nextOpen ? group.id : null)
                                    }
                                >
                                    <Item variant="outline">
                                        <CollapsibleTrigger className="w-full text-left">
                                            <div className="flex w-full items-center justify-between gap-4">
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h2 className="font-semibold">
                                                            {group.name}
                                                        </h2>
                                                        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                                                            <span>{group.membershipCount} membri</span>
                                                            <span>•</span>
                                                            <span>{group.openContactRequestCount} richieste aperte</span>
                                                        </div>
                                                    </div>

                                                    {group.description ? (
                                                        <p className="max-w-3xl text-sm text-muted-foreground">
                                                            {group.description}
                                                        </p>
                                                    ) : null}
                                                </div>

                                                <ChevronDown
                                                    className={cn(
                                                        'mt-1 size-5 shrink-0 text-muted-foreground transition-transform',
                                                        isOpen && 'rotate-180',
                                                    )}
                                                />
                                            </div>
                                        </CollapsibleTrigger>

                                        <CollapsibleContent className="border-t py-4 ps-2 mt-2 w-full">
                                                <GroupMembersManager
                                                    currentEmployeeId={currentEmployeeId}
                                                    abilities={group.abilities}
                                                    memberships={group.memberships}
                                                    availableEmployees={group.availableEmployees}
                                                    availableRoles={availableRoles}
                                                    membershipStoreUrl={group.membershipStoreUrl}
                                                    defaultRole={group.defaultRole}
                                                />
                                        </CollapsibleContent>
                                    </Item>
                                </Collapsible>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
