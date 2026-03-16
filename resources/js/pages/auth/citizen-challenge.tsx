import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { Head, useForm } from '@inertiajs/react';

interface CitizenChallengeProps {
    email: string;
    maskedPhoneNumber: string;
    expiresAt?: string | null;
    status?: string;
}

export default function CitizenChallenge({
    email,
    maskedPhoneNumber,
    expiresAt,
    status,
}: CitizenChallengeProps) {
    const form = useForm({
        fiscal_code: '',
        otp: '',
    });

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.post('/citizen/login/verify');
    };

    return (
        <AuthLayout
            title="Conferma identità"
            description={`Abbiamo inviato un OTP al numero ${maskedPhoneNumber}.`}
        >
            <Head title="Conferma accesso cittadino" />

            <div className="mb-6 rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                <div>Email di accesso: {email}</div>
                {expiresAt && (
                    <div>
                        OTP valido fino a:{' '}
                        {new Date(expiresAt).toLocaleTimeString('it-IT', {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </div>
                )}
            </div>

            <form onSubmit={submit} className="flex flex-col gap-6">
                <div className="grid gap-2">
                    <Label htmlFor="fiscal_code">Codice fiscale</Label>
                    <Input
                        id="fiscal_code"
                        value={form.data.fiscal_code}
                        onChange={(event) =>
                            form.setData(
                                'fiscal_code',
                                event.currentTarget.value.toUpperCase(),
                            )
                        }
                        maxLength={16}
                        autoFocus
                        required
                        placeholder="RSSMRA80A01H501U"
                    />
                    <InputError message={form.errors.fiscal_code} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="otp">Codice OTP</Label>
                    <InputOTP
                        id="otp"
                        value={form.data.otp}
                        onChange={(value) => form.setData('otp', value)}
                        maxLength={6}
                    >
                        <InputOTPGroup className="w-full justify-between">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <InputOTPSlot key={index} index={index} />
                            ))}
                        </InputOTPGroup>
                    </InputOTP>
                    <InputError message={form.errors.otp} />
                </div>

                <Button type="submit" disabled={form.processing} className="w-full">
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
