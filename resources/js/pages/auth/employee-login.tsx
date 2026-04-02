import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { Head, useForm } from '@inertiajs/react';

interface EmployeeLoginProps {
    status?: string;
}

export default function EmployeeLogin({ status }: EmployeeLoginProps) {
    const form = useForm({
        username: '',
        password: '',
        remember: false,
    });

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.post('/employee/login', {
            onFinish: () => form.reset('password'),
        });
    };

    return (
        <AuthLayout
            title="Accesso dipendenti"
            description="Inserisci le tue credenziali LDAP di dominio per accedere all'area interna."
        >
            <Head title="Accesso dipendenti" />

            <form onSubmit={submit} className="flex flex-col gap-6">
                <div className="grid gap-2">
                    <Label htmlFor="username">Nome utente</Label>
                    <Input
                        id="username"
                        type="text"
                        value={form.data.username}
                        onChange={(event) =>
                            form.setData('username', event.currentTarget.value)
                        }
                        required
                        autoFocus
                        autoComplete="username"
                        placeholder="nome.cognome"
                    />
                    <InputError message={form.errors.username} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        value={form.data.password}
                        onChange={(event) =>
                            form.setData('password', event.currentTarget.value)
                        }
                        required
                        autoComplete="current-password"
                        placeholder="Password"
                    />
                    <InputError message={form.errors.password} />
                </div>

                <div className="flex items-center space-x-3">
                    <Checkbox
                        id="remember"
                        checked={form.data.remember}
                        onCheckedChange={(checked) =>
                            form.setData('remember', checked === true)
                        }
                    />
                    <Label htmlFor="remember">Ricordami</Label>
                </div>

                <Button type="submit" size="lg" disabled={form.processing} className="w-full">
                    {form.processing && <Spinner />}
                    Accedi
                </Button>
            </form>

            {status && (
                <div className="mt-6 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}
        </AuthLayout>
    );
}
