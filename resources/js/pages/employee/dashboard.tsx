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
import { MessageSquareMore, UserPlus } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: employee.dashboard().url,
    },
];

interface DashboardProps {
    status?: string;
    activeChatsCount: number;
}

export default function Dashboard({ status, activeChatsCount }: DashboardProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {status && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                        {status}
                    </div>
                )}

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_360px]">
                    <CreateNewUserForm />

                    <Card className="border-sky-200">
                        <CardHeader className="space-y-3">
                            <div className="flex size-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                                <MessageSquareMore className="size-5" />
                            </div>
                            <div className="space-y-1">
                                <CardTitle>Conversazioni</CardTitle>
                                <CardDescription>
                                    Le tue conversazioni con cittadini.
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-2xl border border-sky-200 bg-white/80 px-4 py-5">
                                <div className="text-sm text-muted-foreground">
                                    Chat attive a cui partecipi
                                </div>
                                <div className="mt-2 text-4xl font-semibold tracking-tight text-sky-900">
                                    {activeChatsCount}
                                </div>
                            </div>

                            <Button asChild className="w-full">
                                <Link href={employee.chats.index().url}>
                                    Apri la pagina chat
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

function CreateNewUserForm() {
    const newUserForm = useForm({
        name: '',
        email: '',
        phoneNumber: '',
        fiscalCode: '',
    });

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        newUserForm.post(employee.citizens.store.url(), {
            onSuccess: () => newUserForm.reset(),
            preserveScroll: true,
        });
    };

    return (
        <Card>
            <CardHeader className="space-y-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                    <UserPlus className="size-5" />
                </div>
                <div className="space-y-1">
                    <CardTitle>Registra un cittadino</CardTitle>
                    <CardDescription>
                        Inserisci i dati essenziali per permettere l&apos;accesso tramite magic link e OTP.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={submit} className="grid gap-5 md:grid-cols-2">
                    <div className="grid gap-2 md:col-span-2">
                        <Label htmlFor="name">Nome completo</Label>
                        <Input
                            id="name"
                            type="text"
                            value={newUserForm.data.name}
                            onChange={(event) =>
                                newUserForm.setData('name', event.currentTarget.value)
                            }
                            required
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
                            onChange={(event) =>
                                newUserForm.setData(
                                    'phoneNumber',
                                    event.currentTarget.value.replace(/[^\d+]/g, ''),
                                )
                            }
                            required
                            autoComplete="tel"
                            placeholder="+390916661111"
                        />
                        <InputError message={newUserForm.errors.phoneNumber} />
                    </div>

                    <div className="grid gap-2 md:col-span-2">
                        <Label htmlFor="fiscalCode">Codice fiscale</Label>
                        <Input
                            id="fiscalCode"
                            type="text"
                            value={newUserForm.data.fiscalCode}
                            onChange={(event) =>
                                newUserForm.setData(
                                    'fiscalCode',
                                    event.currentTarget.value
                                        .toUpperCase()
                                        .replace(/\s+/g, ''),
                                )
                            }
                            required
                            maxLength={16}
                            placeholder="RSSMRA80A01H501U"
                        />
                        <InputError message={newUserForm.errors.fiscalCode} />
                    </div>

                    <div className="md:col-span-2">
                        <Button
                            type="submit"
                            disabled={newUserForm.processing}
                            className="w-full"
                        >
                            Registra cittadino
                            {newUserForm.processing && <Spinner />}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
