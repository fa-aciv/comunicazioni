import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { Head, useForm } from '@inertiajs/react';

interface CitizenLoginProps {
    status?: string;
}

export default function CitizenLogin({ status }: CitizenLoginProps) {
    const form = useForm({
        email: '',
    });

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.post('/citizen/login/link');
    };

    return (
        <AuthLayout
            title="Accesso cittadini"
            description="Ricevi un link via email e completa l'accesso con codice fiscale e OTP SMS."
        >
            <Head title="Accesso cittadini" />

            <form onSubmit={submit} className="flex flex-col gap-6">
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        value={form.data.email}
                        onChange={(event) =>
                            form.setData('email', event.currentTarget.value)
                        }
                        required
                        autoFocus
                        autoComplete="email"
                        placeholder="nome@dominio.it"
                    />
                    <InputError message={form.errors.email} />
                </div>

                <Button type="submit" disabled={form.processing} className="w-full">
                    {form.processing && <Spinner />}
                    Invia link di accesso
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
