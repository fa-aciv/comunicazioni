import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import employee from '@/routes/employee';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { BellRing, Building2, Clock3, Mail, MessageSquareDot, Settings, UserRoundCog, UsersRound } from 'lucide-react';

interface EmployeeSettingsPageProps {
    status?: string;
    settings: {
        messageRetentionDays: number;
        inactiveThreadRetentionDays: number;
        lastCleanupAt: string | null;
        notifications: {
            emailNotificationsEnabled: boolean;
            notifyUnreadChatMessages: boolean;
            unreadChatEmailDelayMinutes: number;
            notifyGroupContactRequests: boolean;
            groupContactRequestEmailDelayMinutes: number;
        };
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

    const retentionForm = useForm({
        messageRetentionDays: settings.messageRetentionDays.toString(),
        inactiveThreadRetentionDays: settings.inactiveThreadRetentionDays.toString(),
    });

    const notificationForm = useForm({
        emailNotificationsEnabled: settings.notifications.emailNotificationsEnabled,
        notifyUnreadChatMessages: settings.notifications.notifyUnreadChatMessages,
        unreadChatEmailDelayMinutes: settings.notifications.unreadChatEmailDelayMinutes.toString(),
        notifyGroupContactRequests: settings.notifications.notifyGroupContactRequests,
        groupContactRequestEmailDelayMinutes: settings.notifications.groupContactRequestEmailDelayMinutes.toString(),
    });

    function handleRetentionSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        retentionForm.patch(employee.settings.update.url(), {
            preserveScroll: true,
        });
    }

    function handleNotificationSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        notificationForm.patch(employee.settings.update.url(), {
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
                    <div className="space-y-6">
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

                                <form onSubmit={handleRetentionSubmit} className="space-y-5 rounded-2xl border p-4">
                                    <div className="grid gap-5 md:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="messageRetentionDays">Messaggi</Label>
                                            <Input
                                                id="messageRetentionDays"
                                                type="number"
                                                min={1}
                                                max={3650}
                                                value={retentionForm.data.messageRetentionDays}
                                                onChange={(event) =>
                                                    retentionForm.setData('messageRetentionDays', event.currentTarget.value)
                                                }
                                                required
                                            />
                                            <p className="text-sm text-muted-foreground">
                                                I messaggi delle chat non di gruppo più vecchi di questo limite verranno rimossi automaticamente.
                                            </p>
                                            <InputError message={retentionForm.errors.messageRetentionDays} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="inactiveThreadRetentionDays">Chat inattive</Label>
                                            <Input
                                                id="inactiveThreadRetentionDays"
                                                type="number"
                                                min={1}
                                                max={3650}
                                                value={retentionForm.data.inactiveThreadRetentionDays}
                                                onChange={(event) =>
                                                    retentionForm.setData('inactiveThreadRetentionDays', event.currentTarget.value)
                                                }
                                                required
                                            />
                                            <p className="text-sm text-muted-foreground">
                                                Una chat non di gruppo senza nuove azioni oltre questo limite viene eliminata definitivamente.
                                            </p>
                                            <InputError message={retentionForm.errors.inactiveThreadRetentionDays} />
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
                                        <Button type="submit" disabled={retentionForm.processing || !retentionForm.isDirty}>
                                            Salva impostazioni
                                            {retentionForm.processing && <Spinner />}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        <Card className="border-violet-200">
                            <CardHeader className="space-y-3">
                                <div className="space-y-1">
                                    <div className="flex size-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                                        <Mail className="size-5" />
                                    </div>
                                    <CardTitle>Notifiche email dipendente</CardTitle>
                                    <CardDescription>
                                        Scegli se ricevere promemoria via email per chat non lette e richieste di contatto di gruppo ancora in attesa.
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-4 md:grid-cols-3">
                                    <InfoBox
                                        label="Email notifiche"
                                        value={notificationForm.data.emailNotificationsEnabled ? 'Attive' : 'Disattivate'}
                                    />
                                    <InfoBox
                                        label="Promemoria chat"
                                        value={notificationForm.data.notifyUnreadChatMessages ? `${notificationForm.data.unreadChatEmailDelayMinutes} min` : 'Off'}
                                    />
                                    <InfoBox
                                        label="Richieste di gruppo"
                                        value={notificationForm.data.notifyGroupContactRequests ? `${notificationForm.data.groupContactRequestEmailDelayMinutes} min` : 'Off'}
                                    />
                                </div>

                                <form onSubmit={handleNotificationSubmit} className="space-y-5 rounded-2xl border p-4">
                                    <label className="flex items-start gap-3 rounded-xl border p-4">
                                        <Checkbox
                                            checked={notificationForm.data.emailNotificationsEnabled}
                                            onCheckedChange={(checked) =>
                                                notificationForm.setData('emailNotificationsEnabled', checked === true)
                                            }
                                        />
                                        <div className="space-y-1">
                                            <div className="font-medium">Abilita notifiche email</div>
                                            <p className="text-sm text-muted-foreground">
                                                Se disattivi questa opzione non riceverai alcun promemoria via email, anche se le categorie sottostanti restano selezionate.
                                            </p>
                                        </div>
                                    </label>
                                    <InputError message={notificationForm.errors.emailNotificationsEnabled} />

                                    <div className="grid gap-4">
                                        <div className="rounded-2xl border p-4">
                                            <div className="flex flex-wrap items-start justify-between gap-4">
                                                <label className="flex items-start gap-3">
                                                    <Checkbox
                                                        checked={notificationForm.data.notifyUnreadChatMessages}
                                                        disabled={!notificationForm.data.emailNotificationsEnabled}
                                                        onCheckedChange={(checked) =>
                                                            notificationForm.setData('notifyUnreadChatMessages', checked === true)
                                                        }
                                                    />
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 font-medium">
                                                            <MessageSquareDot className="size-4" />
                                                            Messaggi chat non letti
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">
                                                            Invia un promemoria quando ricevi messaggi nelle tue chat e restano non letti oltre la soglia configurata.
                                                        </p>
                                                    </div>
                                                </label>

                                                <div className="grid min-w-40 gap-2">
                                                    <Label htmlFor="unreadChatEmailDelayMinutes">Dopo quanti minuti</Label>
                                                    <Input
                                                        id="unreadChatEmailDelayMinutes"
                                                        type="number"
                                                        min={1}
                                                        max={10080}
                                                        value={notificationForm.data.unreadChatEmailDelayMinutes}
                                                        onChange={(event) =>
                                                            notificationForm.setData('unreadChatEmailDelayMinutes', event.currentTarget.value)
                                                        }
                                                        disabled={
                                                            !notificationForm.data.emailNotificationsEnabled
                                                            || !notificationForm.data.notifyUnreadChatMessages
                                                        }
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <InputError message={notificationForm.errors.unreadChatEmailDelayMinutes} />
                                        </div>

                                        <div className="rounded-2xl border p-4">
                                            <div className="flex flex-wrap items-start justify-between gap-4">
                                                <label className="flex items-start gap-3">
                                                    <Checkbox
                                                        checked={notificationForm.data.notifyGroupContactRequests}
                                                        disabled={!notificationForm.data.emailNotificationsEnabled}
                                                        onCheckedChange={(checked) =>
                                                            notificationForm.setData('notifyGroupContactRequests', checked === true)
                                                        }
                                                    />
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 font-medium">
                                                            <UsersRound className="size-4" />
                                                            Richieste di contatto dei gruppi
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">
                                                            Invia un promemoria quando una richiesta di contatto indirizzata a un tuo gruppo resta aperta oltre la soglia configurata.
                                                        </p>
                                                    </div>
                                                </label>

                                                <div className="grid min-w-40 gap-2">
                                                    <Label htmlFor="groupContactRequestEmailDelayMinutes">Dopo quanti minuti</Label>
                                                    <Input
                                                        id="groupContactRequestEmailDelayMinutes"
                                                        type="number"
                                                        min={1}
                                                        max={10080}
                                                        value={notificationForm.data.groupContactRequestEmailDelayMinutes}
                                                        onChange={(event) =>
                                                            notificationForm.setData('groupContactRequestEmailDelayMinutes', event.currentTarget.value)
                                                        }
                                                        disabled={
                                                            !notificationForm.data.emailNotificationsEnabled
                                                            || !notificationForm.data.notifyGroupContactRequests
                                                        }
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <InputError message={notificationForm.errors.groupContactRequestEmailDelayMinutes} />
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900">
                                        <div className="flex items-center gap-2 font-medium">
                                            <BellRing className="size-4" />
                                            I promemoria vengono controllati automaticamente ogni cinque minuti.
                                        </div>
                                        <p className="mt-1 text-violet-800">
                                            Ogni email viene inviata una sola volta per lo stesso stato: se arrivano nuovi messaggi o nuove richieste, potrà partire un nuovo promemoria dopo la soglia impostata.
                                        </p>
                                    </div>

                                    <div className="flex justify-end">
                                        <Button type="submit" disabled={notificationForm.processing || !notificationForm.isDirty}>
                                            Salva preferenze notifiche
                                            {notificationForm.processing && <Spinner />}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

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
