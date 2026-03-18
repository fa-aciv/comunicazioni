import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AppLayout from '@/layouts/app-layout';
import employee from '@/routes/employee';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: employee.dashboard().url,
    },
];

interface DashboardProps {
    status?: string;
}

export default function Dashboard({ status }: DashboardProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <CreateNewUserForm status={status} />
            </div>
        </AppLayout>
    );
}

function CreateNewUserForm({ status }: { status?: string }) {
    const newUserForm = useForm({
        name: '',
        email: '',
        phoneNumber: '',
        fiscalCode: '',
    });

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        newUserForm.post('/employee/citizens', {
            onSuccess: () => newUserForm.reset(),
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex flex-row items-center justify-between">Registra un utente</CardTitle>
                <CardContent className="px-0">
                    {status && (
                        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                            {status}
                        </div>
                    )}
                    <form onSubmit={submit} className="flex flex-col gap-6 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nome completo</Label>
                            <Input
                                id="name"
                                type="text"
                                value={newUserForm.data.name}
                                onChange={(event) =>
                                    newUserForm.setData('name', event.currentTarget.value)
                                }
                                required
                                autoFocus
                                autoComplete="name"
                                autoCapitalize="words"
                                placeholder="Nome Cognome"
                            />
                            <InputError message={newUserForm.errors.name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email">Indirizzo e-mail</Label>
                            <Input
                                id="email"
                                type="email"
                                value={newUserForm.data.email}
                                onChange={(event) =>
                                    newUserForm.setData('email', event.currentTarget.value)
                                }
                                required
                                autoComplete="email"
                                placeholder="email@example.com"
                            />
                            <InputError message={newUserForm.errors.email} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="phoneNumber">Numero di telefono</Label>
                            <Input
                                id="phoneNumber"
                                type="tel"
                                inputMode="tel"
                                value={newUserForm.data.phoneNumber}
                                onChange={(e) =>
                                    // keep + and digits only (simple sanitization; you can relax if you want spaces)
                                    newUserForm.setData('phoneNumber', e.currentTarget.value.replace(/[^\d+]/g, ''))
                                }
                                required
                                autoComplete="phoneNumber"
                                placeholder="+390916661111"
                            />
                            <InputError message={newUserForm.errors.phoneNumber} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="fiscalCode">Codice fiscale</Label>
                            <Input
                                id="fiscalCode"
                                type="text"
                                value={newUserForm.data.fiscalCode}
                                onChange={(e) =>
                                    // uppercase and strip spaces for italian codice fiscale
                                    newUserForm.setData('fiscalCode', e.currentTarget.value.toUpperCase().replace(/\s+/g, ''))
                                }
                                required
                                autoComplete="fiscalCode"
                                pattern="[A-Z0-9]{16}"
                                maxLength={16}
                                placeholder="Inserisci il codice fiscale"
                            />
                            <InputError message={newUserForm.errors.fiscalCode} />
                        </div>

                        <Button type="submit" disabled={newUserForm.processing} className="w-full">
                            Registra utente
                            {newUserForm.processing && <Spinner />}
                        </Button>
                    </form>
                </CardContent>
            </CardHeader>
        </Card>
    );
}
