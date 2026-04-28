import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import employee from '@/routes/employee';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Building2, Clock3, ShieldCheck, ShieldPlus, Users } from 'lucide-react';
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
        href: '/employee/groups/admin',
    },
];

interface PermissionDefinition {
    key: string;
    name: string;
    description: string | null;
}

interface RoleSummary {
    id: number;
    key: string;
    name: string;
    description: string | null;
    isManager: boolean;
    permissionKeys: string[];
    permissionNames: string[];
    memberCount: number;
    updateUrl: string;
    destroyUrl: string;
}

interface EmployeeGroupAdminPageProps {
    status?: string;
    groups: Array<{
        id: number;
        name: string;
        description: string | null;
        isActive: boolean;
        membershipCount: number;
        openContactRequestCount: number;
        chatMessageRetentionDays: number;
        chatInactiveThreadRetentionDays: number;
        retentionUpdateUrl: string;
    }>;
    canCreateGroups: boolean;
    canManageGroupRoles: boolean;
    availableManagers: Array<{
        id: number;
        name: string;
        email: string;
        departmentName: string | null;
    }>;
    storeUrl: string;
    permissionCatalog: PermissionDefinition[];
    groupRoles: RoleSummary[];
    groupRoleStoreUrl: string;
    groupsOverviewUrl: string;
    canOpenManagerPanel: boolean;
    managerPanelUrl: string | null;
}

export default function EmployeeGroupAdminPage({
    status,
    groups,
    canCreateGroups,
    canManageGroupRoles,
    availableManagers,
    storeUrl,
    permissionCatalog,
    groupRoles,
    groupRoleStoreUrl,
}: EmployeeGroupAdminPageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gestione gruppi" />

            <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-6 p-4 md:p-6">
                {status ? (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                        {status}
                    </div>
                ) : null}

                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-semibold tracking-tight">Gestione admin gruppi</h1>
                        <p className="text-sm text-muted-foreground">
                            Crea nuovi gruppi, gestisci i ruoli assegnabili e configura la retention delle chat per ogni gruppo.
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.05fr_1.35fr]">
                    {canCreateGroups ? (
                        <CreateGroupCard availableManagers={availableManagers} storeUrl={storeUrl} />
                    ) : null}
                    {canManageGroupRoles ? (
                        <RoleCatalogCard
                            permissionCatalog={permissionCatalog}
                            roles={groupRoles}
                            storeUrl={groupRoleStoreUrl}
                        />
                    ) : null}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Gruppi esistenti</CardTitle>
                        <CardDescription>
                            Panoramica rapida dei gruppi attualmente configurati, con le relative impostazioni di retention.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {groups.length === 0 ? (
                            <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-8 text-center">
                                <Building2 className="size-8 text-muted-foreground" />
                                <div className="space-y-1">
                                    <p className="font-medium">Nessun gruppo configurato.</p>
                                    <p className="text-sm text-muted-foreground">
                                        Crea il primo gruppo da questo pannello.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-4 lg:grid-cols-2">
                                {groups.map((group) => (
                                    <GroupAdminCard key={group.id} group={group} />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

function CreateGroupCard({
    availableManagers,
    storeUrl,
}: {
    availableManagers: EmployeeGroupAdminPageProps['availableManagers'];
    storeUrl: string;
}) {
    const form = useForm<{
        name: string;
        description: string;
        manager_ids: number[];
    }>({
        name: '',
        description: '',
        manager_ids: [],
    });

    function toggleManager(managerId: number, checked: boolean) {
        form.setData(
            'manager_ids',
            checked
                ? [...new Set([...form.data.manager_ids, managerId])]
                : form.data.manager_ids.filter((value) => value !== managerId),
        );
    }

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        form.post(storeUrl, {
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    }

    return (
        <Card className="border-sky-200">
            <CardHeader className="space-y-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                    <ShieldPlus className="size-5" />
                </div>
                <div className="space-y-1">
                    <CardTitle>Crea un nuovo gruppo</CardTitle>
                    <CardDescription>
                        Definisci il nome del gruppo e assegna subito uno o più group manager iniziali.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                {availableManagers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Non ci sono dipendenti disponibili da assegnare come manager iniziali.
                    </p>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid gap-5">
                            <div className="grid gap-2">
                                <Label htmlFor="group-name">Nome gruppo</Label>
                                <Input
                                    id="group-name"
                                    value={form.data.name}
                                    onChange={(event) => form.setData('name', event.currentTarget.value)}
                                    placeholder="Es. Ufficio Relazioni con il Pubblico"
                                    required
                                />
                                <InputError message={form.errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="group-description">Descrizione</Label>
                                <Textarea
                                    id="group-description"
                                    value={form.data.description}
                                    onChange={(event) => form.setData('description', event.currentTarget.value)}
                                    placeholder="Descrivi in breve il perimetro operativo del gruppo."
                                />
                                <InputError message={form.errors.description} />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label>Manager iniziali</Label>
                            <div className="grid gap-3">
                                {availableManagers.map((manager) => (
                                    <label
                                        key={manager.id}
                                        className="flex items-start gap-3 rounded-xl border p-3"
                                    >
                                        <Checkbox
                                            checked={form.data.manager_ids.includes(manager.id)}
                                            onCheckedChange={(checked) =>
                                                toggleManager(manager.id, checked === true)
                                            }
                                        />
                                        <div className="space-y-1">
                                            <div className="text-sm font-medium">{manager.name}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {manager.email}
                                            </div>
                                            {manager.departmentName ? (
                                                <div className="text-sm text-muted-foreground">
                                                    {manager.departmentName}
                                                </div>
                                            ) : null}
                                        </div>
                                    </label>
                                ))}
                            </div>
                            <InputError message={form.errors.manager_ids} />
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={form.processing}>
                                Crea gruppo
                                {form.processing ? <Spinner /> : null}
                            </Button>
                        </div>
                    </form>
                )}
            </CardContent>
        </Card>
    );
}

function GroupAdminCard({
    group,
}: {
    group: EmployeeGroupAdminPageProps['groups'][number];
}) {
    const form = useForm({
        chatMessageRetentionDays: group.chatMessageRetentionDays.toString(),
        chatInactiveThreadRetentionDays: group.chatInactiveThreadRetentionDays.toString(),
    });

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        form.patch(group.retentionUpdateUrl, {
            preserveScroll: true,
        });
    }

    return (
        <Card size="sm">
            <CardHeader className="space-y-2">
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
            </CardHeader>
            <CardContent className="space-y-5">
                <div className="px-2">
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                        <Clock3 className="size-4 text-muted-foreground" />
                        Rimozione automatica (policy di retention)
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border bg-background p-3">
                            <div className="text-sm text-muted-foreground">Messaggi </div>
                            <div className="mt-1 text-sm font-semibold">
                                {group.chatMessageRetentionDays} giorni
                            </div>
                        </div>
                        <div className="rounded-xl border bg-background p-3">
                            <div className="text-sm text-muted-foreground">Chat inattive</div>
                            <div className="mt-1 text-sm font-semibold">
                                {group.chatInactiveThreadRetentionDays} giorni
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border p-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor={`group-${group.id}-message-retention`}>Messaggi</Label>
                            <Input
                                id={`group-${group.id}-message-retention`}
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
                            <Label htmlFor={`group-${group.id}-inactive-retention`}>Chat inattive</Label>
                            <Input
                                id={`group-${group.id}-inactive-retention`}
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
                    </div>

                    <p className="text-sm text-muted-foreground">
                        Mantieni la retention delle chat inattive uguale o superiore a quella dei messaggi.
                    </p>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={form.processing || !form.isDirty}>
                            Salva retention
                            {form.processing ? <Spinner /> : null}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

function RoleCatalogCard({
    permissionCatalog,
    roles,
    storeUrl,
}: {
    permissionCatalog: PermissionDefinition[];
    roles: RoleSummary[];
    storeUrl: string;
}) {
    return (
        <Card className="border-emerald-200">
            <CardHeader className="space-y-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <ShieldCheck className="size-5" />
                </div>
                <div className="space-y-1">
                    <CardTitle>Ruoli assegnabili</CardTitle>
                    <CardDescription>
                        I permessi dei membri derivano sempre dal ruolo assegnato. Da qui puoi creare, aggiornare o eliminare i ruoli disponibili.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <CreateRoleForm permissionCatalog={permissionCatalog} storeUrl={storeUrl} />

                <div className="space-y-4">
                    {roles.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Nessun ruolo disponibile.
                        </p>
                    ) : (
                        roles.map((role) => (
                            <RoleEditorCard
                                key={role.id}
                                role={role}
                                permissionCatalog={permissionCatalog}
                            />
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function CreateRoleForm({
    permissionCatalog,
    storeUrl,
}: {
    permissionCatalog: PermissionDefinition[];
    storeUrl: string;
}) {
    const form = useForm<{
        name: string;
        description: string;
        permission_keys: string[];
    }>({
        name: '',
        description: '',
        permission_keys: [],
    });

    function togglePermission(permissionKey: string, checked: boolean) {
        form.setData(
            'permission_keys',
            checked
                ? [...new Set([...form.data.permission_keys, permissionKey])]
                : form.data.permission_keys.filter((value) => value !== permissionKey),
        );
    }

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        form.post(storeUrl, {
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border p-4">
            <div className="space-y-1">
                <h2 className="text-sm font-semibold">Nuovo ruolo</h2>
                <p className="text-sm text-muted-foreground">
                    Crea un ruolo riutilizzabile da assegnare ai membri dei gruppi.
                </p>
            </div>

            <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="group-role-name">Nome ruolo</Label>
                    <Input
                        id="group-role-name"
                        value={form.data.name}
                        onChange={(event) => form.setData('name', event.currentTarget.value)}
                        placeholder="Es. Operatore protocollo"
                        required
                    />
                    <InputError message={form.errors.name} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="group-role-description">Descrizione</Label>
                    <Textarea
                        id="group-role-description"
                        value={form.data.description}
                        onChange={(event) => form.setData('description', event.currentTarget.value)}
                        placeholder="Descrivi quando usare questo ruolo."
                    />
                    <InputError message={form.errors.description} />
                </div>
            </div>

            <RolePermissionChecklist
                permissionCatalog={permissionCatalog}
                selectedKeys={form.data.permission_keys}
                onToggle={togglePermission}
                error={form.errors.permission_keys}
                disabled={form.processing}
            />

            <div className="flex justify-end">
                <Button type="submit" disabled={form.processing}>
                    Crea ruolo
                    {form.processing ? <Spinner /> : null}
                </Button>
            </div>
        </form>
    );
}

function RoleEditorCard({
    role,
    permissionCatalog,
}: {
    role: RoleSummary;
    permissionCatalog: PermissionDefinition[];
}) {
    const [isEditing, setIsEditing] = useState(false);
    const form = useForm<{
        name: string;
        description: string;
        permission_keys: string[];
    }>({
        name: role.name,
        description: role.description ?? '',
        permission_keys: role.permissionKeys,
    });

    function togglePermission(permissionKey: string, checked: boolean) {
        form.setData(
            'permission_keys',
            checked
                ? [...new Set([...form.data.permission_keys, permissionKey])]
                : form.data.permission_keys.filter((value) => value !== permissionKey),
        );
    }

    function handleSave(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        form.patch(role.updateUrl, {
            preserveScroll: true,
            onSuccess: () => setIsEditing(false),
        });
    }

    function handleDelete() {
        form.delete(role.destroyUrl, {
            preserveScroll: true,
        });
    }

    return (
        <div className="rounded-2xl border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium">{role.name}</h3>
                        {role.isManager ? <Badge variant="secondary">Manager</Badge> : null}
                        <Badge variant="outline">{role.memberCount} membri</Badge>
                    </div>
                    {role.description ? (
                        <p className="text-sm text-muted-foreground">{role.description}</p>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                        {role.permissionNames.map((permissionName) => (
                            <Badge key={permissionName} variant="outline">
                                {permissionName}
                            </Badge>
                        ))}
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditing((current) => !current)}
                    >
                        {isEditing ? 'Chiudi' : 'Modifica'}
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={form.processing || role.memberCount > 0}
                    >
                        Elimina
                    </Button>
                </div>
            </div>

            {role.memberCount > 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                    Per eliminare questo ruolo, riassegna prima i membri che lo stanno usando.
                </p>
            ) : null}

            {isEditing ? (
                <form onSubmit={handleSave} className="mt-5 space-y-5 border-t pt-5">
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor={`role-name-${role.id}`}>Nome ruolo</Label>
                            <Input
                                id={`role-name-${role.id}`}
                                value={form.data.name}
                                onChange={(event) => form.setData('name', event.currentTarget.value)}
                                required
                            />
                            <InputError message={form.errors.name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor={`role-description-${role.id}`}>Descrizione</Label>
                            <Textarea
                                id={`role-description-${role.id}`}
                                value={form.data.description}
                                onChange={(event) => form.setData('description', event.currentTarget.value)}
                            />
                            <InputError message={form.errors.description} />
                        </div>
                    </div>

                    <RolePermissionChecklist
                        permissionCatalog={permissionCatalog}
                        selectedKeys={form.data.permission_keys}
                        onToggle={togglePermission}
                        error={form.errors.permission_keys || form.errors.role}
                        disabled={form.processing}
                    />

                    <div className="flex justify-end">
                        <Button type="submit" disabled={form.processing}>
                            Salva ruolo
                            {form.processing ? <Spinner /> : null}
                        </Button>
                    </div>
                </form>
            ) : null}
        </div>
    );
}

function RolePermissionChecklist({
    permissionCatalog,
    selectedKeys,
    onToggle,
    error,
    disabled,
}: {
    permissionCatalog: PermissionDefinition[];
    selectedKeys: string[];
    onToggle: (permissionKey: string, checked: boolean) => void;
    error?: string;
    disabled?: boolean;
}) {
    return (
        <div className="space-y-3">
            <div className="space-y-1">
                <Label>Permessi del ruolo</Label>
                <p className="text-sm text-muted-foreground">
                    I membri assegnati a questo ruolo erediteranno automaticamente questi permessi.
                </p>
            </div>

            <div className="grid gap-3">
                {permissionCatalog.map((permission) => (
                    <label
                        key={permission.key}
                        className="flex items-start gap-3 rounded-xl border p-3"
                    >
                        <Checkbox
                            checked={selectedKeys.includes(permission.key)}
                            disabled={disabled}
                            onCheckedChange={(checked) => onToggle(permission.key, checked === true)}
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

            <InputError message={error} />
        </div>
    );
}
