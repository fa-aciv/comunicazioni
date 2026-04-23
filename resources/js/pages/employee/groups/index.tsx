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
import { Building2, Inbox, ShieldPlus } from 'lucide-react';

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
        currentRole: string | null;
        currentRoleLabel: string | null;
        currentPermissionKeys: string[];
        showUrl: string;
    }>;
    requestsInboxUrl: string;
    canCreateGroups: boolean;
    availableManagers: Array<{
        id: number;
        name: string;
        email: string;
        departmentName: string | null;
    }>;
    storeUrl: string;
}

export default function EmployeeGroupIndexPage({
    status,
    groups,
    requestsInboxUrl,
    canCreateGroups,
    availableManagers,
    storeUrl,
}: EmployeeGroupIndexPageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gruppi" />

            <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-6 p-4 md:p-6">
                {status && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                        {status}
                    </div>
                )}

                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-semibold tracking-tight">Gruppi</h1>
                        <p className="text-sm text-muted-foreground">
                            Consulta i gruppi di cui fai parte, il tuo ruolo e i permessi assegnati.
                        </p>
                    </div>
                    <Button asChild variant="outline">
                        <Link href={requestsInboxUrl}>
                            <Inbox className="size-4" />
                            Inbox richieste
                        </Link>
                    </Button>
                </div>

                {canCreateGroups ? (
                    <CreateGroupCard availableManagers={availableManagers} storeUrl={storeUrl} />
                ) : null}

                {groups.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex min-h-48 flex-col items-center justify-center gap-3 py-12 text-center">
                            <Building2 className="size-8 text-muted-foreground" />
                            <div className="space-y-1">
                                <p className="font-medium">Non fai ancora parte di nessun gruppo.</p>
                                <p className="text-sm text-muted-foreground">
                                    Quando verrai assegnato ad un gruppo, troverai qui i dettagli operativi e i permessi disponibili.
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
                                        {group.currentRoleLabel ? (
                                            <Badge variant="outline">
                                                Ruolo: {group.currentRoleLabel}
                                            </Badge>
                                        ) : null}
                                        <Badge variant="outline">
                                            Membri: {group.membershipCount}
                                        </Badge>
                                        <Badge variant="outline">
                                            Richieste aperte: {group.openContactRequestCount}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">Permessi correnti</p>
                                        <div className="flex flex-wrap gap-2">
                                            {group.currentPermissionKeys.length > 0 ? (
                                                group.currentPermissionKeys.map((permission) => (
                                                    <Badge key={permission} variant="secondary">
                                                        {permission}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <p className="text-sm text-muted-foreground">
                                                    Nessun permesso assegnato.
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <Button asChild className="w-full">
                                        <Link href={group.showUrl}>Apri gruppo</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function CreateGroupCard({
    availableManagers,
    storeUrl,
}: {
    availableManagers: EmployeeGroupIndexPageProps['availableManagers'];
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
                        Definisci il nome del gruppo e assegna subito uno o più group manager.
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
                        <div className="grid gap-5 md:grid-cols-2">
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

                            <div className="grid gap-2 md:col-span-2">
                                <Label htmlFor="group-description">Descrizione</Label>
                                <Textarea
                                    id="group-description"
                                    value={form.data.description}
                                    onChange={(event) =>
                                        form.setData('description', event.currentTarget.value)
                                    }
                                    placeholder="Descrivi in breve il perimetro operativo del gruppo."
                                />
                                <InputError message={form.errors.description} />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label>Manager iniziali</Label>
                            <div className="grid gap-3 md:grid-cols-2">
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
