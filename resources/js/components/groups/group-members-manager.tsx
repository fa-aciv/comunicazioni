import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { useForm } from '@inertiajs/react';
import { Check, ChevronDown, IdCard, MoreHorizontal, MoreVertical, Save, UserMinus, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { ButtonGroup } from '../ui/button-group';
import { cn } from '@/lib/utils';

export interface GroupRoleSummary {
    id: number;
    key: string;
    name: string;
    description: string | null;
    isManager: boolean;
    permissionKeys: string[];
    permissionNames: string[];
}

export interface GroupEmployeeOption {
    id: number;
    name: string;
    email: string;
    employeeId: string | null;
    departmentName: string | null;
}

export interface GroupMembershipSummary {
    id: number;
    user: GroupEmployeeOption;
    role: GroupRoleSummary | null;
    updateUrl: string;
    removeUrl: string;
}

export interface GroupManagementAbilities {
    canAddMembers: boolean;
    canRemoveMembers: boolean;
    canManageMemberRoles: boolean;
    canAcceptContactRequests: boolean;
}

interface GroupMembersManagerProps {
    currentEmployeeId: number;
    abilities: GroupManagementAbilities;
    memberships: GroupMembershipSummary[];
    availableEmployees: GroupEmployeeOption[];
    availableRoles: GroupRoleSummary[];
    membershipStoreUrl: string;
}

export function GroupMembersManager({
    currentEmployeeId,
    abilities,
    memberships,
    availableEmployees,
    availableRoles,
    membershipStoreUrl,
}: GroupMembersManagerProps) {
    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                    <h2 className="font-semibold">Membri del gruppo</h2>
                    <p className="text-sm text-muted-foreground">
                        Assegna ai membri uno dei ruoli configurati. I permessi derivano sempre dal ruolo selezionato.
                    </p>
                </div>
                {abilities.canAddMembers ? (
                    <AddMemberDialog
                        availableEmployees={availableEmployees}
                        availableRoles={availableRoles}
                        storeUrl={membershipStoreUrl}
                    />
                ) : null}
            </div>

            {memberships.length === 0 ? (
                <div className="rounded-2xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
                    Nessun membro assegnato al gruppo.
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {memberships.map((membership) => (
                        <MembershipCard
                            key={membership.id}
                            membership={membership}
                            currentEmployeeId={currentEmployeeId}
                            availableRoles={availableRoles}
                            canManageMemberRoles={abilities.canManageMemberRoles}
                            canRemoveMembers={abilities.canRemoveMembers}
                        />
                    ))}
                </div>
            )}

            {abilities.canAddMembers && availableEmployees.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    Tutti i dipendenti risultano gia assegnati a questo gruppo.
                </p>
            ) : null}
        </div>
    );
}

function AddMemberDialog({
    availableEmployees,
    availableRoles,
    storeUrl,
}: {
    availableEmployees: GroupEmployeeOption[];
    availableRoles: GroupRoleSummary[];
    storeUrl: string;
}) {
    const [open, setOpen] = useState(false);
    const defaultRoleId = (
        availableRoles.find((role) => role.key === 'user') ?? availableRoles[0]
    )?.id;
    const defaultRoleValue = defaultRoleId ? String(defaultRoleId) : '';

    const form = useForm({
        user_id: '',
        group_role_id: defaultRoleValue,
    });

    const selectedRole =
        availableRoles.find((role) => String(role.id) === form.data.group_role_id) ?? null;

    function resetForm() {
        form.reset();
        form.clearErrors();
        form.setData('group_role_id', defaultRoleValue);
    }

    function handleOpenChange(nextOpen: boolean) {
        setOpen(nextOpen);

        if (! nextOpen) {
            resetForm();
        }
    }

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        form.post(storeUrl, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setOpen(false);
                resetForm();
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen(true)}
                disabled={availableEmployees.length === 0 || availableRoles.length === 0}
            >
                <UserPlus className="size-4" />
                Aggiungi utente
            </Button>

            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Aggiungi un membro</DialogTitle>
                    <DialogDescription>
                        Seleziona un dipendente e assegnagli uno dei ruoli disponibili per questo gruppo.
                    </DialogDescription>
                </DialogHeader>

                {availableEmployees.length === 0 ? (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Tutti i dipendenti risultano gia assegnati a questo gruppo.
                        </p>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="outline">
                                    Chiudi
                                </Button>
                            </DialogClose>
                        </DialogFooter>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid gap-5 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="member-user">Dipendente</Label>
                                <Select
                                    value={form.data.user_id}
                                    onValueChange={(value) => form.setData('user_id', value)}
                                >
                                    <SelectTrigger id="member-user">
                                        <SelectValue placeholder="Seleziona un dipendente" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableEmployees.map((employeeOption) => (
                                            <SelectItem
                                                key={employeeOption.id}
                                                value={employeeOption.id.toString()}
                                            >
                                                {employeeOption.name} · {employeeOption.email}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.user_id} />
                            </div>

                            <div className="grid gap-2">
                                <Label>Ruolo</Label>
                                <RolePicker
                                    roles={availableRoles}
                                    value={form.data.group_role_id}
                                    onValueChange={(value) => form.setData('group_role_id', value)}
                                    placeholder="Seleziona un ruolo"
                                    disabled={availableRoles.length === 0}
                                />
                                <InputError message={form.errors.group_role_id} />
                            </div>
                        </div>

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="outline" disabled={form.processing}>
                                    Annulla
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                disabled={
                                    form.processing
                                    || form.data.user_id === ''
                                    || form.data.group_role_id === ''
                                }
                            >
                                Aggiungi membro
                                {form.processing ? <Spinner /> : null}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}

function MembershipCard({
    membership,
    currentEmployeeId,
    availableRoles,
    canManageMemberRoles,
    canRemoveMembers,
}: {
    membership: GroupMembershipSummary;
    currentEmployeeId: number;
    availableRoles: GroupRoleSummary[];
    canManageMemberRoles: boolean;
    canRemoveMembers: boolean;
}) {
    const currentRoleId = membership.role ? membership.role.id.toString() : '';
    const form = useForm({
        group_role_id: currentRoleId,
    });

    const selectedRole =
        availableRoles.find((role) => String(role.id) === form.data.group_role_id) ?? membership.role;

    function handleRoleSave(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        form.patch(membership.updateUrl, {
            preserveScroll: true,
            preserveState: true,
        });
    }

    function handleRemove() {
        form.delete(membership.removeUrl, {
            preserveScroll: true,
            preserveState: true,
        });
    }

    return (
        <div className="rounded-lg border px-4 py-2">
            <form 
                onSubmit={handleRoleSave} 
                className="flex flex-row flex-wrap items-center justify-between gap-2"
            >
                <div className="flex flex-row flex-wrap items-center gap-2">
                    <div className="text-base font-medium">{membership.user.name}</div>
                    {membership.user.employeeId ? (
                        <Badge variant="outline">
                            <IdCard />{membership.user.employeeId}
                        </Badge>
                    ) : null}
                    {   membership.user.departmentName &&
                        <Badge variant="outline">
                            {membership.user.departmentName}
                        </Badge>
                    }
                </div>

                <div className="flex flex-col gap-2 justify-end items-end">
                    <div className="flex flex-row gap-1">
                        
                        <ButtonGroup>
                            <RolePicker
                            roles={availableRoles}
                            value={form.data.group_role_id}
                            onValueChange={(value) => form.setData('group_role_id', value)}
                            placeholder="Seleziona un ruolo"
                            disabled={!canManageMemberRoles || availableRoles.length === 0}
                            />
                            {
                                canManageMemberRoles
                                && !(form.data.group_role_id === currentRoleId)
                             ? (
                                <Button
                                    type="submit"
                                    disabled={form.processing || form.data.group_role_id === currentRoleId}
                                >
                                    <Save />
                                    Salva
                                    {form.processing ? <Spinner /> : null}
                                </Button>
                            ) : null}
                            </ButtonGroup>
                            {canRemoveMembers ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={form.processing}
                                            aria-label="Azioni membro"
                                        >
                                            <MoreHorizontal className="size-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 min-w-0">
                                        <DropdownMenuItem
                                            variant="destructive"
                                            onClick={handleRemove}
                                            disabled={form.processing}
                                        >
                                            <UserMinus className="size-4" />
                                            Rimuovi utente
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : null}
                        
                    </div>
                </div>
                
                
            </form>
            <InputError message={form.errors.group_role_id} />
        </div>
    );
}

function RolePicker({
    roles,
    value,
    onValueChange,
    placeholder,
    disabled = false,
}: {
    roles: GroupRoleSummary[];
    value: string;
    onValueChange: (value: string) => void;
    placeholder: string;
    disabled?: boolean;
}) {
    const [open, setOpen] = useState(false);

    const selectedRole = roles.find((role) => String(role.id) === value) ?? null;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="justify-between gap-3"
                    disabled={disabled}
                >
                    <span className="min-w-0 flex-1 truncate text-left">
                        {selectedRole ? (
                            <span className="flex flex-wrap items-center gap-2">
                                <span className="truncate font-medium">{selectedRole.name}</span>
                            </span>
                        ) : (
                            <span className="text-muted-foreground">{placeholder}</span>
                        )}
                    </span>
                    <ChevronDown className="size-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>

            <PopoverContent className="sm:w-105 p-0" align="start">
                <Command>
                    <CommandList>
                        <CommandEmpty>Nessun ruolo disponibile.</CommandEmpty>
                        <CommandGroup>
                            {roles.map((role) => {
                                const selected = String(role.id) === value;

                                return (
                                    <CommandItem
                                        key={role.id}
                                        value={`${role.name} ${role.description ?? ''} ${role.permissionNames.join(' ')}`}
                                        onSelect={() => {
                                            onValueChange(String(role.id));
                                            setOpen(false);
                                        }}
                                        className="p-0"
                                    >
                                        <div className="flex w-full items-start justify-between gap-3 px-3 py-2">
                                            <Check
                                                className={`mt-0.5 size-4 shrink-0 ${
                                                    selected ? 'opacity-100' : 'opacity-0'
                                                }`}
                                            />

                                            <div className="flex flex-wrap items-center gap-2">
                                                <div className="text-sm font-medium">{role.name}</div>
                                                {role.description ? (
                                                    <p className="text-sm text-muted-foreground">
                                                        {role.description}
                                                    </p>
                                                ) : null}
                                            </div>

                                            <div className="flex flex-wrap gap-2 pt-1">
                                                {role.permissionNames.length > 0 ? (
                                                    role.permissionNames.map((permissionName) => (
                                                        <Badge key={permissionName} variant="outline">
                                                            {permissionName}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">
                                                        Nessun permesso ereditato
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
