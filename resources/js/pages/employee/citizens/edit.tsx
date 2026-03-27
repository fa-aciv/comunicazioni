import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AppLayout from '@/layouts/app-layout';
import employee from '@/routes/employee';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';

interface CitizenDetails {
    uuid: string;
    name: string;
    email: string;
    phoneNumber: string;
    fiscalCode: string;
    lastLoginAt: string | null;
}

interface EmployeeCitizenEditPageProps {
    status?: string;
    citizen: CitizenDetails;
}

function formatLastLogin(date: string | null): string {
    if (!date) {
        return 'Mai effettuato';
    }

    return new Intl.DateTimeFormat('it-IT', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(date));
}

export default function EmployeeCitizenEditPage({
    status,
    citizen,
}: EmployeeCitizenEditPageProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: employee.dashboard().url,
        },
        {
            title: 'Account cittadini',
            href: employee.citizens.index().url,
        },
        {
            title: citizen.name,
            href: employee.citizens.edit.url({ citizen: citizen.uuid }),
        },
    ];

    const form = useForm({
        email: citizen.email,
        phoneNumber: citizen.phoneNumber,
    });

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        form.patch(employee.citizens.update.url({ citizen: citizen.uuid }), {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Modifica account ${citizen.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {status && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                        {status}
                    </div>
                )}

                <Card className="mx-auto w-full max-w-3xl">
                    <CardHeader className="space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-1">
                                <CardTitle>{citizen.name}</CardTitle>
                                <CardDescription>
                                    Aggiorna email e numero di telefono del cittadino.
                                </CardDescription>
                            </div>
                            <Button asChild variant="outline">
                                <Link href={employee.citizens.index().url}>
                                    Torna all&apos;elenco
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 rounded-2xl border bg-muted/20 p-4 md:grid-cols-2">
                            <div>
                                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Nome e cognome
                                </div>
                                <div className="mt-1 font-medium">{citizen.name}</div>
                            </div>
                            <div>
                                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Codice fiscale
                                </div>
                                <div className="mt-1 font-medium">{citizen.fiscalCode}</div>
                            </div>
                            <div className="md:col-span-2">
                                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Ultimo accesso
                                </div>
                                <div className="mt-1 font-medium">{formatLastLogin(citizen.lastLoginAt)}</div>
                            </div>
                        </div>

                        <form onSubmit={submit} className="grid gap-5 md:grid-cols-2">
                            <div className="grid gap-2 md:col-span-2">
                                <Label htmlFor="email">Indirizzo e-mail</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={form.data.email}
                                    onChange={(event) => form.setData('email', event.currentTarget.value)}
                                    required
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={form.errors.email} />
                            </div>

                            <div className="grid gap-2 md:col-span-2">
                                <Label htmlFor="phoneNumber">Numero di telefono</Label>
                                <Input
                                    id="phoneNumber"
                                    type="tel"
                                    inputMode="tel"
                                    value={form.data.phoneNumber}
                                    onChange={(event) =>
                                        form.setData(
                                            'phoneNumber',
                                            event.currentTarget.value.replace(/[^\d+]/g, ''),
                                        )
                                    }
                                    required
                                    autoComplete="tel"
                                    placeholder="+390916661111"
                                />
                                <InputError message={form.errors.phoneNumber} />
                            </div>

                            <div className="flex justify-end md:col-span-2">
                                <Button type="submit" disabled={form.processing}>
                                    Salva modifiche
                                    {form.processing && <Spinner />}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
