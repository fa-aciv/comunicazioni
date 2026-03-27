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
import { UserPlus } from 'lucide-react';

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
        title: 'Nuovo cittadino',
        href: employee.citizens.create().url,
    },
];

interface EmployeeCitizenCreatePageProps {
    status?: string;
}

export default function EmployeeCitizenCreatePage({ status }: EmployeeCitizenCreatePageProps) {
    const form = useForm({
        name: '',
        email: '',
        phoneNumber: '',
        fiscalCode: '',
    });

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        form.post(employee.citizens.store.url(), {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nuovo cittadino" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {status && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                        {status}
                    </div>
                )}

                <Card className="mx-auto w-full max-w-3xl border-amber-200">
                    <CardHeader className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                                <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                                    <UserPlus className="size-5" />
                                </div>
                                <CardTitle>Registra un cittadino</CardTitle>
                                <CardDescription>
                                    Inserisci i dati essenziali per permettere l&apos;accesso tramite magic link e OTP.
                                </CardDescription>
                            </div>
                            <Button asChild variant="outline">
                                <Link href={employee.citizens.index().url}>
                                    Torna all&apos;elenco
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="grid gap-5 md:grid-cols-2">
                            <div className="grid gap-2 md:col-span-2">
                                <Label htmlFor="name">Nome completo</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={form.data.name}
                                    onChange={(event) => form.setData('name', event.currentTarget.value)}
                                    required
                                    autoComplete="name"
                                    autoCapitalize="words"
                                    placeholder="Nome Cognome"
                                />
                                <InputError message={form.errors.name} />
                            </div>

                            <div className="grid gap-2">
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

                            <div className="grid gap-2">
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

                            <div className="grid gap-2 md:col-span-2">
                                <Label htmlFor="fiscalCode">Codice fiscale</Label>
                                <Input
                                    id="fiscalCode"
                                    type="text"
                                    value={form.data.fiscalCode}
                                    onChange={(event) =>
                                        form.setData(
                                            'fiscalCode',
                                            event.currentTarget.value.toUpperCase().replace(/\s+/g, ''),
                                        )
                                    }
                                    required
                                    maxLength={16}
                                    placeholder="RSSMRA80A01H501U"
                                />
                                <InputError message={form.errors.fiscalCode} />
                            </div>

                            <div className="flex justify-end md:col-span-2">
                                <Button type="submit" disabled={form.processing}>
                                    Registra cittadino
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
