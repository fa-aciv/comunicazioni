import InputError from '@/components/input-error';
import { type GroupRoleSummary } from '@/components/groups/group-members-manager';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Item, ItemActions, ItemContent, ItemFooter, ItemGroup, ItemHeader, ItemTitle } from '@/components/ui/item';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import employee from '@/routes/employee';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Building2, Check, ChevronDown, ChevronRight, Clock3, FileClock, IdCard, Plus, ShieldCheck, ShieldPlus, X } from 'lucide-react';
import { useEffect, useState } from 'react';

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
    id: GroupRoleSummary['id'];
    key: GroupRoleSummary['key'];
    name: GroupRoleSummary['name'];
    description: GroupRoleSummary['description'];
    isManager: GroupRoleSummary['isManager'];
    permissionKeys: GroupRoleSummary['permissionKeys'];
    permissionNames: GroupRoleSummary['permissionNames'];
    memberCount: number;
    updateUrl: string;
    destroyUrl: string;
}

interface ManagerSearchOption {
    id: number;
    name: string;
    email: string;
    employeeId: string | null;
    departmentName: string | null;
}

interface EmployeeGroupAdminPageProps {
    status?: string;
    groups: Array<{
        id: number;
        name: string;
        description: string | null;
        isActive: boolean;
        membershipCount: number;
        chatMessageRetentionDays: number;
        chatInactiveThreadRetentionDays: number;
        defaultRole: GroupRoleSummary | null;
        detailUrl: string;
    }>;
    canCreateGroups: boolean;
    canManageGroupRoles: boolean;
    availableRoles: GroupRoleSummary[];
    storeUrl: string;
    managerSearchUrl: string;
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
    storeUrl,
    managerSearchUrl,
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

                {canManageGroupRoles ? (
                    <RoleCatalogCard
                        permissionCatalog={permissionCatalog}
                        roles={groupRoles}
                        storeUrl={groupRoleStoreUrl}
                    />
                ) : null}

                <Card>
                    <CardHeader>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-1">
                                <CardTitle>Gruppi esistenti</CardTitle>
                                <CardDescription>
                                    Panoramica rapida dei gruppi attualmente configurati, con le relative impostazioni di retention.
                                </CardDescription>
                            </div>
                            {canCreateGroups ? (
                                <CreateGroupDialog storeUrl={storeUrl} managerSearchUrl={managerSearchUrl} />
                            ) : null}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {groups.length === 0 ? (
                            <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-8 text-center">
                                <Building2 className="size-8 text-muted-foreground" />
                                <div className="space-y-1">
                                    <p className="font-medium">Nessun gruppo configurato.</p>
                                    <p className="text-sm text-muted-foreground">
                                        {canCreateGroups
                                            ? 'Crea il primo gruppo con il pulsante Nuovo gruppo.'
                                            : 'Nessun gruppo disponibile in questo momento.'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <ItemGroup className="gap-3">
                                {groups.map((group) => (
                                    <GroupAdminCard key={group.id} group={group} />
                                ))}
                            </ItemGroup>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

function CreateGroupDialog({
    storeUrl,
    managerSearchUrl,
}: {
    storeUrl: string;
    managerSearchUrl: string;
}) {
    const [open, setOpen] = useState(false);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [searchStatus, setSearchStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
    const [searchResults, setSearchResults] = useState<ManagerSearchOption[]>([]);
    const [selectedManagers, setSelectedManagers] = useState<ManagerSearchOption[]>([]);

    const form = useForm<{
        name: string;
        description: string;
        manager_ids: number[];
    }>({
        name: '',
        description: '',
        manager_ids: [],
    });

    useEffect(() => {
        if (!open) {
            return;
        }

        const trimmedQuery = query.trim();
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => {
            if (trimmedQuery.length < 2) {
                setSearchResults([]);
                setSearchStatus('idle');
                return;
            }

            setSearchResults([]);
            setSearchStatus('loading');

            void fetch(`${managerSearchUrl}?${new URLSearchParams({ query: trimmedQuery }).toString()}`, {
                signal: controller.signal,
                headers: {
                    Accept: 'application/json',
                },
            })
                .then(async (response) => {
                    if (!response.ok) {
                        throw new Error('Unable to load managers');
                    }

                    const payload = (await response.json()) as { employees: ManagerSearchOption[] };

                    setSearchResults(
                        payload.employees.filter(
                            (manager) => !form.data.manager_ids.includes(manager.id),
                        ),
                    );
                    setSearchStatus('ready');
                })
                .catch(() => {
                    if (controller.signal.aborted) {
                        return;
                    }

                    setSearchResults([]);
                    setSearchStatus('error');
                });
        }, trimmedQuery.length >= 2 ? 250 : 0);

        return () => {
            controller.abort();
            window.clearTimeout(timeoutId);
        };
    }, [form.data.manager_ids, managerSearchUrl, open, query]);

    function resetDialog() {
        form.reset();
        form.clearErrors();
        setPickerOpen(false);
        setQuery('');
        setSearchStatus('idle');
        setSearchResults([]);
        setSelectedManagers([]);
    }

    function handleOpenChange(nextOpen: boolean) {
        setOpen(nextOpen);

        if (!nextOpen) {
            resetDialog();
        }
    }

    function addManager(manager: ManagerSearchOption) {
        if (form.data.manager_ids.includes(manager.id)) {
            return;
        }

        setSelectedManagers((current) => [...current, manager]);
        form.setData('manager_ids', [...form.data.manager_ids, manager.id]);
        setQuery('');
        setSearchResults([]);
        setSearchStatus('idle');
        setPickerOpen(false);
    }

    function removeManager(managerId: number) {
        setSelectedManagers((current) => current.filter((manager) => manager.id !== managerId));
        form.setData(
            'manager_ids',
            form.data.manager_ids.filter((value) => value !== managerId),
        );
    }

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        form.post(storeUrl, {
            preserveScroll: true,
            onSuccess: () => {
                resetDialog();
                setOpen(false);
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button type="button">
                    <Plus />
                    Nuovo gruppo
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Nuovo gruppo</DialogTitle>
                    <DialogDescription>
                        Definisci il nome del gruppo e assegna subito uno o più group manager iniziali.
                    </DialogDescription>
                </DialogHeader>

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
                        <div className="space-y-1">
                            <Label>Manager iniziali</Label>
                            <p className="text-sm text-muted-foreground">
                                Cerca per nome, email, matricola o ufficio. La ricerca mostra fino a 25 risultati per volta.
                            </p>
                        </div>

                        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                            <PopoverTrigger asChild>
                                <Button type="button" variant="outline" className="justify-between gap-3">
                                    <span className="min-w-0 flex-1 truncate text-left">
                                        {selectedManagers.length > 0
                                            ? `${selectedManagers.length} manager selezionati`
                                            : 'Cerca e seleziona i manager iniziali'}
                                    </span>
                                    <ChevronDown className="size-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>

                            <PopoverContent className="w-[min(32rem,calc(100vw-3rem))] p-0" align="start">
                                <Command shouldFilter={false}>
                                    <CommandInput
                                        value={query}
                                        onValueChange={setQuery}
                                        placeholder="Cerca dipendente..."
                                    />
                                    <CommandList>
                                        <CommandEmpty>
                                            {query.trim().length < 2
                                                ? 'Digita almeno 2 caratteri per cercare un dipendente.'
                                                : searchStatus === 'loading'
                                                  ? 'Ricerca in corso...'
                                                  : searchStatus === 'error'
                                                    ? 'Non è stato possibile caricare i dipendenti.'
                                                    : 'Nessun dipendente trovato.'}
                                        </CommandEmpty>
                                        <CommandGroup>
                                            {searchResults.map((manager) => (
                                                <CommandItem
                                                    key={manager.id}
                                                    value={`${manager.name} ${manager.email} ${manager.employeeId ?? ''} ${manager.departmentName ?? ''}`}
                                                    onSelect={() => addManager(manager)}
                                                    className="p-0"
                                                >
                                                    <div className="flex w-full items-start gap-3 px-3 py-2">
                                                        <Check className="mt-0.5 size-4 shrink-0 opacity-0" />
                                                        <div className="min-w-0 flex-1 space-y-1">
                                                            <div className="truncate text-sm font-medium">
                                                                {manager.name}
                                                            </div>
                                                            <div className="truncate text-sm text-muted-foreground">
                                                                {manager.email}
                                                            </div>
                                                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                                                {manager.employeeId ? (
                                                                    <span>Matricola {manager.employeeId}</span>
                                                                ) : null}
                                                                {manager.departmentName ? (
                                                                    <span>{manager.departmentName}</span>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>

                        {selectedManagers.length > 0 ? (
                            <ScrollArea className="max-h-40 rounded-xl border p-3">
                                <div className="flex flex-wrap gap-2">
                                    {selectedManagers.map((manager) => (
                                        <Badge
                                            key={manager.id}
                                            variant="secondary"
                                            className="gap-1.5 pr-1"
                                        >
                                            <span className="max-w-52 truncate">{manager.name}</span>
                                            <button
                                                type="button"
                                                className="rounded-full p-0.5 transition hover:bg-black/10"
                                                onClick={() => removeManager(manager.id)}
                                                aria-label={`Rimuovi ${manager.name}`}
                                            >
                                                <X className="size-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            </ScrollArea>
                        ) : (
                            <div className="rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
                                Nessun manager selezionato.
                            </div>
                        )}

                        <InputError message={form.errors.manager_ids} />
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline" disabled={form.processing}>
                                Annulla
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={form.processing}>
                            Crea gruppo
                            {form.processing ? <Spinner /> : null}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function GroupAdminCard({
    group,
}: {
    group: EmployeeGroupAdminPageProps['groups'][number];
}) {
    return (
        <Item asChild variant="outline" className="hover:bg-muted/40">
            <Link href={group.detailUrl}>
                <ItemContent className="min-w-0">
                    <ItemHeader className="items-start gap-3">
                        <div className="min-w-0 space-y-1">
                            <ItemTitle className="max-w-full flex-wrap">
                                <span className="truncate">{group.name}</span>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Badge variant="outline">{group.membershipCount} membri</Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>Numero totale di membri assegnati al gruppo.</TooltipContent>
                                </Tooltip>
                            </ItemTitle>
                        </div>
                        <Badge variant={group.isActive ? 'secondary' : 'outline'}>
                            {group.isActive ? 'Attivo' : 'Non attivo'}
                        </Badge>
                    </ItemHeader>

                    <ItemFooter className="mt-2 flex-wrap items-start justify-start gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Badge variant="outline">
                                    <FileClock className="size-3.5" />
                                    {group.chatMessageRetentionDays} giorni
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent>Retention dei messaggi della chat per questo gruppo.</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Badge variant="outline">
                                    <Clock3 className="size-3.5" />
                                    {group.chatInactiveThreadRetentionDays} giorni
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent>Retention delle chat inattive per questo gruppo.</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Badge variant="outline">
                                    <IdCard className="size-3.5" />
                                    {group.defaultRole?.name ?? 'Ruolo default non configurato'}
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent>Ruolo di default assegnato ai nuovi membri del gruppo.</TooltipContent>
                        </Tooltip>
                    </ItemFooter>
                </ItemContent>

                <ItemActions className="ml-auto self-center">
                    <ChevronRight className="size-4 text-muted-foreground" />
                </ItemActions>
            </Link>
        </Item>
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
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                        <CardTitle>Ruoli assegnabili</CardTitle>
                        <CardDescription>
                            I permessi dei membri derivano sempre dal ruolo assegnato. Da qui puoi creare, aggiornare o eliminare i ruoli disponibili.
                        </CardDescription>
                    </div>
                    <CreateRoleForm permissionCatalog={permissionCatalog} storeUrl={storeUrl} />
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
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
    const [open, setOpen] = useState(false);

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
            onSuccess: () => {
                form.reset();
                setOpen(false);
            },
        });
    }

    function handleOpenChange(nextOpen: boolean) {
        setOpen(nextOpen);

        if (!nextOpen) {
            form.reset();
            form.clearErrors();
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button type="button">
                    <Plus />
                    Nuovo ruolo
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Nuovo ruolo</DialogTitle>
                    <DialogDescription>
                        Crea un ruolo riutilizzabile da assegnare ai membri dei gruppi.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5">
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

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline" disabled={form.processing}>
                                Annulla
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={form.processing}>
                            Crea ruolo
                            {form.processing ? <Spinner /> : null}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
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
