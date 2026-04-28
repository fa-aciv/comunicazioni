import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import employee from '@/routes/employee';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Building2, Clock3, Settings, UserRoundCog } from 'lucide-react';

interface EmployeeSettingsPageProps {
    status?: string;
    settings: {
        messageRetentionDays: number;
        inactiveThreadRetentionDays: number;
        lastCleanupAt: string | null;
    };
    groupCount: number;
    groupsOverviewUrl: string;
    canOpenAdminGroupPanel: boolean;
    adminGroupPanelUrl: string | null;
    canOpenManagerGroupPanel: boolean;
    managerGroupPanelUrl: string | null;
}

function formatDate(date: string | null): string {
    if (!date) {
        return 'Non ancora eseguita';
    }

    return new Intl.DateTimeFormat('it-IT', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(date));
}

export default function EmployeeSettingsPage({
    status,
    settings,
    groupCount,
    groupsOverviewUrl,
    canOpenAdminGroupPanel,
    adminGroupPanelUrl,
    canOpenManagerGroupPanel,
    managerGroupPanelUrl,
}: EmployeeSettingsPageProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: employee.dashboard().url,
        },
        {
            title: 'Impostazioni',
            href: employee.settings.index().url,
        },
    ];

    const form = useForm({
        messageRetentionDays: settings.messageRetentionDays.toString(),
        inactiveThreadRetentionDays: settings.inactiveThreadRetentionDays.toString(),
    });

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        form.patch(employee.settings.update.url(), {
            preserveScroll: true,
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Impostazioni" />

            <div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-6 p-4 md:p-6">
                {status && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                        {status}
                    </div>
                )}

                <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
                    <Card className="border-sky-200">
                        <CardHeader className="space-y-3">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="space-y-1">
                                    <div className="flex size-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                                        <Settings className="size-5" />
                                    </div>
                                    <CardTitle>Impostazioni globali chat</CardTitle>
                                    <CardDescription>
                                        Configura la policy di retention predefinita per le chat non associate a un gruppo. Le chat di gruppo seguono la policy configurata sul gruppo stesso.
                                    </CardDescription>
                                </div>
                                <Button asChild variant="outline">
                                    <Link href={employee.dashboard().url}>
                                        Torna alla dashboard
                                    </Link>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 bg-muted/20 md:grid-cols-3">
                                <InfoBox
                                    label="Retention messaggi"
                                    value={`${settings.messageRetentionDays} giorni`}
                                />
                                <InfoBox
                                    label="Retention chat inattive"
                                    value={`${settings.inactiveThreadRetentionDays} giorni`}
                                />
                                <InfoBox
                                    label="Ultima pulizia automatica"
                                    value={formatDate(settings.lastCleanupAt)}
                                />
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border p-4">
                                <div className="grid gap-5 md:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="messageRetentionDays">Messaggi</Label>
                                        <Input
                                            id="messageRetentionDays"
                                            type="number"
                                            min={1}
                                            max={3650}
                                            value={form.data.messageRetentionDays}
                                            onChange={(event) =>
                                                form.setData('messageRetentionDays', event.currentTarget.value)
                                            }
                                            required
                                        />
                                        <p className="text-sm text-muted-foreground">
                                            I messaggi delle chat non di gruppo più vecchi di questo limite verranno rimossi automaticamente.
                                        </p>
                                        <InputError message={form.errors.messageRetentionDays} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="inactiveThreadRetentionDays">Chat inattive</Label>
                                        <Input
                                            id="inactiveThreadRetentionDays"
                                            type="number"
                                            min={1}
                                            max={3650}
                                            value={form.data.inactiveThreadRetentionDays}
                                            onChange={(event) =>
                                                form.setData('inactiveThreadRetentionDays', event.currentTarget.value)
                                            }
                                            required
                                        />
                                        <p className="text-sm text-muted-foreground">
                                            Una chat non di gruppo senza nuove azioni oltre questo limite viene eliminata definitivamente.
                                        </p>
                                        <InputError message={form.errors.inactiveThreadRetentionDays} />
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                                    <div className="flex items-center gap-2 font-medium">
                                        <Clock3 className="size-4" />
                                        La pulizia automatica viene eseguita ogni giorno durante la notte.
                                    </div>
                                    <p className="mt-1 text-amber-800">
                                        Le eliminazioni sono permanenti. Mantieni la retention delle chat inattive uguale o superiore a quella dei messaggi.
                                    </p>
                                </div>

                                <div className="flex justify-end">
                                    <Button type="submit" disabled={form.processing || !form.isDirty}>
                                        Salva impostazioni
                                        {form.processing && <Spinner />}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card className="justify-between border-emerald-200">
                            <CardHeader className="space-y-3">
                                <div className={cn(
                                        "flex",
                                        "size-11",
                                        "items-center",
                                        "justify-center",
                                        "rounded-2xl",
                                        "bg-red-100",
                                        "text-red-700",
                                        "dark:bg-red-950",
                                        "dark:text-red-300"
                                )}>
                                    <Building2 className="size-5" />
                                </div>
                                <div className="space-y-1">
                                    <CardTitle>Gruppi</CardTitle>
                                    <CardDescription>
                                        Consulta i gruppi a cui appartieni.
                                    </CardDescription>
                                </div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Gruppi assegnati: {groupCount}
                                </p>
                            </CardHeader>
                            <CardContent>
                                <Button asChild variant="outline" className="w-full">
                                    <Link href={groupsOverviewUrl}>
                                        <Building2 className="size-4" />
                                        Consulta i tuoi gruppi
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>

                        {(canOpenManagerGroupPanel || canOpenAdminGroupPanel) ? (
                            <Card className="justify-between border-rose-200">
                                <CardHeader className="space-y-3">
                                    <div className={cn(
                                            "flex",
                                            "size-11",
                                            "items-center",
                                            "justify-center",
                                            "rounded-2xl",
                                            "bg-rose-100",
                                            "text-rose-700",
                                            "dark:bg-rose-950",
                                            "dark:text-rose-300"
                                    )}>
                                        <UserRoundCog className="size-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <CardTitle>Gestione gruppi</CardTitle>
                                        <CardDescription>
                                            Raggiungi i pannelli dedicati per amministrazione o gestione quando disponibili.
                                        </CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {canOpenManagerGroupPanel && managerGroupPanelUrl ? (
                                        <Button asChild variant="outline" className="w-full">
                                            <Link href={managerGroupPanelUrl}>
                                                <Building2 className="size-4" />
                                                Gestisci gruppi
                                            </Link>
                                        </Button>
                                    ) : null}
                                    {canOpenAdminGroupPanel && adminGroupPanelUrl ? (
                                        <Button asChild variant="outline" className="w-full">
                                            <Link href={adminGroupPanelUrl}>
                                                <Settings className="size-4" />
                                                Amministra gruppi
                                            </Link>
                                        </Button>
                                    ) : null}
                                </CardContent>
                            </Card>
                        ) : null}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function InfoBox({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border bg-background p-4">
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="mt-1 text-sm font-semibold">{value}</div>
        </div>
    );
}
