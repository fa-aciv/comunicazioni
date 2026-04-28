import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import employee from '@/routes/employee';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Building2, Inbox, ShieldCheck, Users } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: employee.dashboard().url,
    },
    {
        title: 'Gruppi',
        href: '/employee/groups',
    },
];

interface EmployeeGroupIndexPageProps {
    status?: string;
    groups: Array<{
        id: number;
        name: string;
        description: string | null;
        isActive: boolean;
        membershipCount: number;
        openContactRequestCount: number;
        currentRoleName: string | null;
        currentRoleDescription: string | null;
        currentPermissionNames: string[];
    }>;
    requestsInboxUrl: string;
    canOpenAdminPanel: boolean;
    adminPanelUrl: string | null;
    canOpenManagerPanel: boolean;
    managerPanelUrl: string | null;
}

export default function EmployeeGroupIndexPage({
    status,
    groups,
    requestsInboxUrl,
    canOpenAdminPanel,
    adminPanelUrl,
    canOpenManagerPanel,
    managerPanelUrl,
}: EmployeeGroupIndexPageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gruppi" />

            <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-6 p-4 md:p-6">
                {status ? (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                        {status}
                    </div>
                ) : null}

                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-semibold tracking-tight">Gruppi</h1>
                        <p className="text-sm text-muted-foreground">
                            Qui trovi una panoramica dei gruppi assegnati e del ruolo con cui operi in ciascuno.
                        </p>
                    </div>
                </div>

                {groups.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex min-h-48 flex-col items-center justify-center gap-3 py-12 text-center">
                            <Building2 className="size-8 text-muted-foreground" />
                            <div className="space-y-1">
                                <p className="font-medium">Non fai ancora parte di nessun gruppo.</p>
                                <p className="text-sm text-muted-foreground">
                                    Quando verrai assegnato a un gruppo, qui vedrai il tuo ruolo e i permessi ereditati.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 lg:grid-cols-2">
                        {groups.map((group) => (
                            <Card key={group.id} className="justify-between">
                                <CardHeader className="space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="space-y-1">
                                            <CardTitle>{group.name}</CardTitle>
                                            <CardDescription>
                                                {group.description || 'Nessuna descrizione disponibile.'}
                                            </CardDescription>
                                        </div>
                                        <Badge variant={group.isActive ? 'secondary' : 'outline'}>
                                            {group.isActive ? 'Attivo' : 'Non attivo'}
                                        </Badge>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {group.currentRoleName ? (
                                            <Badge variant="outline">
                                                Ruolo: {group.currentRoleName}
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline">Accesso amministratore</Badge>
                                        )}
                                        <Badge variant="outline">Membri: {group.membershipCount}</Badge>
                                        <Badge variant="outline">
                                            Richieste aperte: {group.openContactRequestCount}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {group.currentRoleDescription ? (
                                        <p className="text-sm text-muted-foreground">
                                            {group.currentRoleDescription}
                                        </p>
                                    ) : null}
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">
                                            {group.currentRoleName ? 'Permessi del tuo ruolo' : 'Permessi disponibili'}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {group.currentPermissionNames.length > 0 ? (
                                                group.currentPermissionNames.map((permission) => (
                                                    <Badge key={permission} variant="secondary">
                                                        {permission}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <p className="text-sm text-muted-foreground">
                                                    Nessun permesso di gruppo assegnato.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
