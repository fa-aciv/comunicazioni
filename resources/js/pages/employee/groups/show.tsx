import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import AppLayout from '@/layouts/app-layout';
import employee from '@/routes/employee';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Clock3, ShieldCheck, UserMinus, UserPlus } from 'lucide-react';

const roleOptions = [
    { value: 'manager', label: 'Manager' },
    { value: 'user', label: 'User' },
] as const;

interface EmployeeGroupShowPageProps {
    status?: string;
    group: {
        id: number;
        name: string;
        description: string | null;
        isActive: boolean;
        openContactRequestCount: number;
        chatMessageRetentionDays: number;
        chatInactiveThreadRetentionDays: number;
    };
    currentEmployeeId: number;
    abilities: {
        canAddMembers: boolean;
        canRemoveMembers: boolean;
        canManageMemberPermissions: boolean;
        canManageRetention: boolean;
        canAcceptContactRequests: boolean;
    };
    memberships: Array<{
        id: number;
        user: {
            id: number;
            name: string;
            email: string;
            departmentName: string | null;
        };
        role: 'manager' | 'user';
        permissionKeys: string[];
        updateUrl: string;
        removeUrl: string;
    }>;
    availableEmployees: Array<{
        id: number;
        name: string;
        email: string;
        departmentName: string | null;
    }>;
    permissionCatalog: Array<{
        key: string;
        name: string;
        description: string | null;
    }>;
    roleDefaults: Record<string, string[]>;
    membershipStoreUrl: string;
    retentionUpdateUrl: string;
    requestsInboxUrl: string;
    indexUrl: string;
}

export default function EmployeeGroupShowPage(props: EmployeeGroupShowPageProps) {
    const {
        status,
        group,
        currentEmployeeId,
        abilities,
        memberships,
        availableEmployees,
        permissionCatalog,
        roleDefaults,
        membershipStoreUrl,
        retentionUpdateUrl,
        requestsInboxUrl,
        indexUrl,
    } = props;

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: employee.dashboard().url,
        },
        {
            title: 'Gruppi',
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
                {status && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                        {status}
                    </div>
                )}

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
                            <Badge variant="outline">
                                Richieste aperte: {group.openContactRequestCount}
                            </Badge>
                            {abilities.canAcceptContactRequests && (
                                <Badge variant="outline">Puoi accettare richieste</Badge>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline">
                            <Link href={requestsInboxUrl}>Apri inbox richieste</Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href={indexUrl}>Torna ai gruppi</Link>
                        </Button>
                    </div>
                </div>

                {abilities.canAddMembers ? (
                    <AddMemberCard
                        availableEmployees={availableEmployees}
                        permissionCatalog={permissionCatalog}
                        roleDefaults={roleDefaults}
                        storeUrl={membershipStoreUrl}
                    />
                ) : null}

                <GroupRetentionCard
                    group={group}
                    canManageRetention={abilities.canManageRetention}
                    updateUrl={retentionUpdateUrl}
                />

                <Card>
                    <CardHeader>
                        <CardTitle>Membri del gruppo</CardTitle>
                        <CardDescription>
                            Aggiorna ruolo e permessi dei membri assegnati al gruppo.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {memberships.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Nessun membro assegnato al gruppo.
                            </p>
                        ) : (
                            memberships.map((membership) => (
                                <MembershipCard
                                    key={membership.id}
                                    membership={membership}
                                    currentEmployeeId={currentEmployeeId}
                                    permissionCatalog={permissionCatalog}
                                    roleDefaults={roleDefaults}
                                    canManageMemberPermissions={abilities.canManageMemberPermissions}
                                    canRemoveMembers={abilities.canRemoveMembers}
                                />
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

function GroupRetentionCard({
    group,
    canManageRetention,
    updateUrl,
}: {
    group: EmployeeGroupShowPageProps['group'];
    canManageRetention: boolean;
    updateUrl: string;
}) {
    const form = useForm({
        chatMessageRetentionDays: group.chatMessageRetentionDays.toString(),
        chatInactiveThreadRetentionDays: group.chatInactiveThreadRetentionDays.toString(),
    });

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        form.patch(updateUrl, {
            preserveScroll: true,
        });
    }

    return (
        <Card className="border-sky-200">
            <CardHeader className="space-y-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                    <Clock3 className="size-5" />
                </div>
                <div className="space-y-1">
                    <CardTitle>Retention chat del gruppo</CardTitle>
                    <CardDescription>
                        Le chat generate dalle richieste di contatto di questo gruppo seguono questa policy di retention dedicata.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-4 rounded-2xl border bg-muted/20 p-4 md:grid-cols-2">
                    <div className="rounded-xl border bg-background p-4">
                        <div className="text-sm text-muted-foreground">Retention messaggi</div>
                        <div className="mt-1 text-sm font-semibold">
                            {group.chatMessageRetentionDays} giorni
                        </div>
                    </div>
                    <div className="rounded-xl border bg-background p-4">
                        <div className="text-sm text-muted-foreground">Retention chat inattive</div>
                        <div className="mt-1 text-sm font-semibold">
                            {group.chatInactiveThreadRetentionDays} giorni
                        </div>
                    </div>
                </div>

                {canManageRetention ? (
                    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border p-4">
                        <div className="grid gap-5 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="chatMessageRetentionDays">Messaggi</Label>
                                <Input
                                    id="chatMessageRetentionDays"
                                    type="number"
                                    min={1}
                                    max={3650}
                                    value={form.data.chatMessageRetentionDays}
                                    onChange={(event) =>
                                        form.setData('chatMessageRetentionDays', event.currentTarget.value)
                                    }
                                    required
                                />
                                <p className="text-sm text-muted-foreground">
                                    I messaggi delle chat del gruppo più vecchi di questo limite verranno rimossi automaticamente.
                                </p>
                                <InputError message={form.errors.chatMessageRetentionDays} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="chatInactiveThreadRetentionDays">Chat inattive</Label>
                                <Input
                                    id="chatInactiveThreadRetentionDays"
                                    type="number"
                                    min={1}
                                    max={3650}
                                    value={form.data.chatInactiveThreadRetentionDays}
                                    onChange={(event) =>
                                        form.setData('chatInactiveThreadRetentionDays', event.currentTarget.value)
                                    }
                                    required
                                />
                                <p className="text-sm text-muted-foreground">
                                    Le chat del gruppo senza nuove azioni oltre questo limite vengono eliminate definitivamente.
                                </p>
                                <InputError message={form.errors.chatInactiveThreadRetentionDays} />
                            </div>
                        </div>

                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                            <p className="font-medium">
                                Le eliminazioni sono permanenti.
                            </p>
                            <p className="mt-1 text-amber-800">
                                Mantieni la retention delle chat inattive uguale o superiore a quella dei messaggi.
                            </p>
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={form.processing || !form.isDirty}>
                                Salva retention
                                {form.processing && <Spinner />}
                            </Button>
                        </div>
                    </form>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Non hai i permessi per modificare la retention delle chat di questo gruppo.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

function AddMemberCard({
    availableEmployees,
    permissionCatalog,
    roleDefaults,
    storeUrl,
}: {
    availableEmployees: EmployeeGroupShowPageProps['availableEmployees'];
    permissionCatalog: EmployeeGroupShowPageProps['permissionCatalog'];
    roleDefaults: EmployeeGroupShowPageProps['roleDefaults'];
    storeUrl: string;
}) {
    const initialRole = 'user';
    const form = useForm<{
        user_id: string;
        role: 'manager' | 'user';
        permissions: string[];
    }>({
        user_id: availableEmployees[0] ? String(availableEmployees[0].id) : '',
        role: initialRole,
        permissions: roleDefaults[initialRole] ?? [],
    });

    function togglePermission(permissionKey: string, checked: boolean) {
        form.setData(
            'permissions',
            checked
                ? [...new Set([...form.data.permissions, permissionKey])]
                : form.data.permissions.filter((key) => key !== permissionKey),
        );
    }

    function handleRoleChange(nextRole: 'manager' | 'user') {
        form.setData({
            ...form.data,
            role: nextRole,
            permissions: roleDefaults[nextRole] ?? [],
        });
    }

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        form.post(storeUrl, {
            preserveScroll: true,
            onSuccess: () => {
                const fallbackRole = 'user';

                form.reset();
                form.setData({
                    user_id: availableEmployees[0] ? String(availableEmployees[0].id) : '',
                    role: fallbackRole,
                    permissions: roleDefaults[fallbackRole] ?? [],
                });
            },
        });
    }

    return (
        <Card className="border-emerald-200">
            <CardHeader className="space-y-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <UserPlus className="size-5" />
                </div>
                <div className="space-y-1">
                    <CardTitle>Aggiungi un membro</CardTitle>
                    <CardDescription>
                        Seleziona un dipendente, assegna ruolo e permessi iniziali per questo gruppo.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                {availableEmployees.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Tutti i dipendenti disponibili sono già assegnati a questo gruppo.
                    </p>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid gap-5 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label>Dipendente</Label>
                                <Select
                                    value={form.data.user_id}
                                    onValueChange={(value) => form.setData('user_id', value)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Seleziona un dipendente" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableEmployees.map((employeeOption) => (
                                            <SelectItem
                                                key={employeeOption.id}
                                                value={String(employeeOption.id)}
                                            >
                                                {employeeOption.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.user_id} />
                            </div>

                            <div className="grid gap-2">
                                <Label>Ruolo</Label>
                                <Select
                                    value={form.data.role}
                                    onValueChange={(value: 'manager' | 'user') =>
                                        handleRoleChange(value)
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roleOptions.map((roleOption) => (
                                            <SelectItem key={roleOption.value} value={roleOption.value}>
                                                {roleOption.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.role} />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label>Permessi iniziali</Label>
                            <div className="grid gap-3 md:grid-cols-2">
                                {permissionCatalog.map((permission) => (
                                    <label
                                        key={permission.key}
                                        className="flex items-start gap-3 rounded-xl border p-3"
                                    >
                                        <Checkbox
                                            checked={form.data.permissions.includes(permission.key)}
                                            onCheckedChange={(checked) =>
                                                togglePermission(permission.key, checked === true)
                                            }
                                        />
                                        <div className="space-y-1">
                                            <div className="text-sm font-medium">{permission.name}</div>
                                            {permission.description ? (
                                                <div className="text-sm text-muted-foreground">
                                                    {permission.description}
                                                </div>
                                            ) : null}
                                        </div>
                                    </label>
                                ))}
                            </div>
                            <InputError message={form.errors.permissions} />
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={form.processing}>
                                Aggiungi membro
                                {form.processing && <Spinner />}
                            </Button>
                        </div>
                    </form>
                )}
            </CardContent>
        </Card>
    );
}

function MembershipCard({
    membership,
    currentEmployeeId,
    permissionCatalog,
    roleDefaults,
    canManageMemberPermissions,
    canRemoveMembers,
}: {
    membership: EmployeeGroupShowPageProps['memberships'][number];
    currentEmployeeId: number;
    permissionCatalog: EmployeeGroupShowPageProps['permissionCatalog'];
    roleDefaults: EmployeeGroupShowPageProps['roleDefaults'];
    canManageMemberPermissions: boolean;
    canRemoveMembers: boolean;
}) {
    const form = useForm<{
        role: 'manager' | 'user';
        permissions: string[];
    }>({
        role: membership.role,
        permissions: membership.permissionKeys,
    });

    function togglePermission(permissionKey: string, checked: boolean) {
        form.setData(
            'permissions',
            checked
                ? [...new Set([...form.data.permissions, permissionKey])]
                : form.data.permissions.filter((key) => key !== permissionKey),
        );
    }

    function handleRoleChange(nextRole: 'manager' | 'user') {
        form.setData({
            role: nextRole,
            permissions: roleDefaults[nextRole] ?? [],
        });
    }

    function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        form.patch(membership.updateUrl, {
            preserveScroll: true,
        });
    }

    function handleRemove() {
        form.delete(membership.removeUrl, {
            preserveScroll: true,
        });
    }

    return (
        <form onSubmit={handleUpdate} className="rounded-2xl border p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{membership.user.name}</h3>
                        {membership.user.id === currentEmployeeId ? (
                            <Badge variant="secondary">Tu</Badge>
                        ) : null}
                        <Badge variant="outline">
                            {form.data.role === 'manager' ? 'Manager' : 'User'}
                        </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{membership.user.email}</p>
                    {membership.user.departmentName ? (
                        <p className="text-sm text-muted-foreground">
                            {membership.user.departmentName}
                        </p>
                    ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                    {canManageMemberPermissions ? (
                        <Button type="submit" disabled={form.processing || !form.isDirty}>
                            <ShieldCheck className="size-4" />
                            Salva
                            {form.processing && <Spinner />}
                        </Button>
                    ) : null}
                    {canRemoveMembers ? (
                        <Button
                            type="button"
                            variant="outline"
                            disabled={form.processing}
                            onClick={handleRemove}
                        >
                            <UserMinus className="size-4" />
                            Rimuovi
                        </Button>
                    ) : null}
                </div>
            </div>

            <div className="mt-5 grid gap-5">
                <div className="grid gap-2 md:max-w-xs">
                    <Label>Ruolo</Label>
                    <Select
                        disabled={!canManageMemberPermissions}
                        value={form.data.role}
                        onValueChange={(value: 'manager' | 'user') => handleRoleChange(value)}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {roleOptions.map((roleOption) => (
                                <SelectItem key={roleOption.value} value={roleOption.value}>
                                    {roleOption.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <InputError message={form.errors.role} />
                </div>

                <div className="space-y-3">
                    <Label>Permessi assegnati</Label>
                    <div className="grid gap-3 md:grid-cols-2">
                        {permissionCatalog.map((permission) => (
                            <label
                                key={permission.key}
                                className="flex items-start gap-3 rounded-xl border p-3"
                            >
                                <Checkbox
                                    disabled={!canManageMemberPermissions}
                                    checked={form.data.permissions.includes(permission.key)}
                                    onCheckedChange={(checked) =>
                                        togglePermission(permission.key, checked === true)
                                    }
                                />
                                <div className="space-y-1">
                                    <div className="text-sm font-medium">{permission.name}</div>
                                    {permission.description ? (
                                        <div className="text-sm text-muted-foreground">
                                            {permission.description}
                                        </div>
                                    ) : null}
                                </div>
                            </label>
                        ))}
                    </div>
                    <InputError message={form.errors.permissions} />
                </div>
            </div>
        </form>
    );
}
