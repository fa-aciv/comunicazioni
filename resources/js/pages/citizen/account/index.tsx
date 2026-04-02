import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AppLayout from '@/layouts/app-layout';
import citizen from '@/routes/citizen';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Settings, Trash2 } from 'lucide-react';

interface CitizenAccountPageProps {
    status?: string;
    citizen: {
        name: string;
        email: string;
        phoneNumber: string;
        fiscalCode: string;
        lastLoginAt: string | null;
    };
}

function formatDate(date: string | null): string {
    if (!date) {
        return 'Mai effettuato';
    }

    return new Intl.DateTimeFormat('it-IT', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(date));
}

export default function CitizenAccountPage({
    status,
    citizen: citizenAccount,
}: CitizenAccountPageProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: citizen.dashboard().url,
        },
        {
            title: 'Account',
            href: citizen.account.index().url,
        },
    ];

    const deleteAccountForm = useForm({});
    const accountForm = useForm({
        email: citizenAccount.email,
        phoneNumber: citizenAccount.phoneNumber,
    });

    const handleDeleteAccount = () => {
        if (
            !window.confirm(
                'Vuoi davvero eliminare il tuo account? Tutte le tue chat verranno rimosse e l’operazione non può essere annullata.',
            )
        ) {
            return;
        }

        deleteAccountForm.delete(citizen.account.destroy.url(), {
            preserveScroll: true,
        });
    };

    const handleAccountUpdate = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        accountForm.patch(citizen.account.update.url(), {
            preserveScroll: true,
            onSuccess: () => {
                accountForm.reset();
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Account" />

            <div className="mx-auto flex h-full w-full max-w-4xl flex-col gap-6 p-4 md:p-6">
                {status && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                        {status}
                    </div>
                )}

                <Card className="border-amber-200">
                    <CardHeader className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                                <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                                    <Settings className="size-5" />
                                </div>
                                <CardTitle>Impostazioni account</CardTitle>
                                <CardDescription>
                                    Gestisci i tuoi contatti e le opzioni del profilo. Email e telefono vengono aggiornati solo dopo una conferma via email e OTP SMS.
                                </CardDescription>
                            </div>
                            <Button asChild variant="outline">
                                <Link href={citizen.dashboard().url}>
                                    Torna alla dashboard
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 rounded-2xl border bg-muted/20 p-4">
                            <SettingRow label="Nome" value={citizenAccount.name} />
                            <SettingRow label="Codice fiscale" value={citizenAccount.fiscalCode} />
                            <SettingRow
                                label="Ultimo accesso"
                                value={formatDate(citizenAccount.lastLoginAt)}
                            />
                        </div>

                        <form onSubmit={handleAccountUpdate} className="space-y-4 rounded-2xl border p-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Indirizzo e-mail</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={accountForm.data.email}
                                    onChange={(event) =>
                                        accountForm.setData('email', event.currentTarget.value)
                                    }
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                    required
                                />
                                <InputError message={accountForm.errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="phoneNumber">Numero di telefono</Label>
                                <Input
                                    id="phoneNumber"
                                    type="tel"
                                    inputMode="tel"
                                    value={accountForm.data.phoneNumber}
                                    onChange={(event) =>
                                        accountForm.setData(
                                            'phoneNumber',
                                            event.currentTarget.value.replace(/[^\d+]/g, ''),
                                        )
                                    }
                                    autoComplete="tel"
                                    placeholder="+390916661111"
                                    required
                                />
                                <InputError message={accountForm.errors.phoneNumber} />
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    disabled={accountForm.processing || !accountForm.isDirty}
                                >
                                    Richiedi conferma modifiche
                                    {accountForm.processing && <Spinner />}
                                </Button>
                            </div>
                        </form>

                        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                            <div className="font-medium text-red-800">
                                Elimina account
                            </div>
                            <p className="mt-1 text-sm text-red-700">
                                Questa azione elimina definitivamente il tuo profilo e le chat collegate. Per sicurezza richiede anche conferma via email e OTP SMS.
                            </p>
                            <div className="mt-4">
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={handleDeleteAccount}
                                    disabled={deleteAccountForm.processing}
                                >
                                    <Trash2 className="size-4" />
                                    Richiedi eliminazione account
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

function SettingRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-4 border-b pb-3 last:border-b-0 last:pb-0">
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="text-right text-sm font-medium">{value}</div>
        </div>
    );
}
