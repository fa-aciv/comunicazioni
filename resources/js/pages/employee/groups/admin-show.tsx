import InputError from '@/components/input-error';
import {
    GroupMembersManager,
    type GroupEmployeeOption,
    type GroupManagementAbilities,
    type GroupMembershipSummary,
    type GroupRoleSummary,
} from '@/components/groups/group-members-manager';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import AppLayout from '@/layouts/app-layout';
import employee from '@/routes/employee';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Clock3, Users } from 'lucide-react';

interface EmployeeGroupAdminShowPageProps {
    status?: string;
    group: {
        id: number;
        name: string;
        description: string | null;
        isActive: boolean;
        membershipCount: number;
        openContactRequestCount: number;
        chatMessageRetentionDays: number;
        chatInactiveThreadRetentionDays: number;
        retentionUpdateUrl: string;
    };
    currentEmployeeId: number;
    defaultRole: GroupRoleSummary | null;
    abilities: GroupManagementAbilities;
    memberships: GroupMembershipSummary[];
    availableEmployees: GroupEmployeeOption[];
    availableRoles: GroupRoleSummary[];
    membershipStoreUrl: string;
    adminIndexUrl: string;
    groupsOverviewUrl: string;
}

export default function EmployeeGroupAdminShowPage({
    status,
    group,
    currentEmployeeId,
    defaultRole,
    abilities,
    memberships,
    availableEmployees,
    availableRoles,
    membershipStoreUrl,
    adminIndexUrl,
}: EmployeeGroupAdminShowPageProps) {
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
            href: adminIndexUrl,
        },
        {
            title: group.name,
            href: `/employee/groups/admin/${group.id}`,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${group.name} · Gestione gruppo`} />

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

                        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                            <span>{group.membershipCount} membri</span>
                            <span>•</span>
                            <span>{group.openContactRequestCount} richieste aperte</span>
                            <span>•</span>
                            <span>Ruolo di default: {defaultRole?.name ?? 'Non configurato'}</span>
                        </div>
                    </CardHeader>
                </Card>

                <div className="grid gap-6 xl:grid-cols-[1fr_1.35fr]">
                    <RetentionSettingsCard
                        group={group}
                        defaultRole={defaultRole}
                        availableRoles={availableRoles}
                    />

                    <Card>
                        <CardHeader className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Users className="size-4 text-muted-foreground" />
                                <CardTitle className="text-base">Membri del gruppo</CardTitle>
                            </div>
                            <CardDescription>
                                Aggiungi o rimuovi membri dal gruppo e assegna il ruolo più adatto a ciascun dipendente.
                            </CardDescription>
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
            </div>
        </AppLayout>
    );
}

function RetentionSettingsCard({
    group,
    defaultRole,
    availableRoles,
}: {
    group: EmployeeGroupAdminShowPageProps['group'];
    defaultRole: GroupRoleSummary | null;
    availableRoles: GroupRoleSummary[];
}) {
    const defaultRoleOptions = availableRoles.filter((role) => !role.isManager);
    const form = useForm({
        chatMessageRetentionDays: group.chatMessageRetentionDays.toString(),
        chatInactiveThreadRetentionDays: group.chatInactiveThreadRetentionDays.toString(),
        defaultGroupRoleId: defaultRole ? String(defaultRole.id) : '',
    });

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        form.patch(group.retentionUpdateUrl, {
            preserveScroll: true,
        });
    }

    return (
        <Card>
            <CardHeader className="space-y-3">
                <div className="flex items-center gap-2">
                    <Clock3 className="size-4 text-muted-foreground" />
                    <CardTitle className="text-base">Impostazioni del gruppo</CardTitle>
                </div>
                <CardDescription>
                    Configura la retention delle chat e scegli il ruolo di default con cui i nuovi membri verranno aggiunti dai gestori del gruppo.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border bg-background p-3">
                        <div className="text-sm text-muted-foreground">Messaggi</div>
                        <div className="mt-1 text-sm font-semibold">{group.chatMessageRetentionDays} giorni</div>
                    </div>
                    <div className="rounded-xl border bg-background p-3">
                        <div className="text-sm text-muted-foreground">Chat inattive</div>
                        <div className="mt-1 text-sm font-semibold">{group.chatInactiveThreadRetentionDays} giorni</div>
                    </div>
                    <div className="rounded-xl border bg-background p-3">
                        <div className="text-sm text-muted-foreground">Ruolo di default</div>
                        <div className="mt-1 text-sm font-semibold">{defaultRole?.name ?? 'Non configurato'}</div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border p-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="grid gap-2">
                            <Label htmlFor="admin-group-message-retention">Messaggi</Label>
                            <Input
                                id="admin-group-message-retention"
                                type="number"
                                min={1}
                                max={3650}
                                value={form.data.chatMessageRetentionDays}
                                onChange={(event) =>
                                    form.setData('chatMessageRetentionDays', event.currentTarget.value)
                                }
                                required
                            />
                            <InputError message={form.errors.chatMessageRetentionDays} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="admin-group-inactive-retention">Chat inattive</Label>
                            <Input
                                id="admin-group-inactive-retention"
                                type="number"
                                min={1}
                                max={3650}
                                value={form.data.chatInactiveThreadRetentionDays}
                                onChange={(event) =>
                                    form.setData('chatInactiveThreadRetentionDays', event.currentTarget.value)
                                }
                                required
                            />
                            <InputError message={form.errors.chatInactiveThreadRetentionDays} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="admin-group-default-role">Ruolo di default</Label>
                            <Select
                                value={form.data.defaultGroupRoleId}
                                onValueChange={(value) => form.setData('defaultGroupRoleId', value)}
                            >
                                <SelectTrigger id="admin-group-default-role">
                                    <SelectValue placeholder="Seleziona un ruolo utente" />
                                </SelectTrigger>
                                <SelectContent>
                                    {defaultRoleOptions.map((role) => (
                                        <SelectItem key={role.id} value={String(role.id)}>
                                            {role.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.defaultGroupRoleId} />
                        </div>
                    </div>

                    <p className="text-sm text-muted-foreground">
                        Mantieni la retention delle chat inattive uguale o superiore a quella dei messaggi. Il ruolo di default viene applicato ai nuovi membri aggiunti dal pannello gestione gruppi.
                    </p>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={form.processing || !form.isDirty}>
                            Salva impostazioni
                            {form.processing ? <Spinner /> : null}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
