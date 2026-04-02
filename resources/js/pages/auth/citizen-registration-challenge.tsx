import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { Head, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface CitizenRegistrationChallengeProps {
    invitation: {
        name: string;
        email: string;
        phoneNumber: string;
        fiscalCode: string;
        maskedPhoneNumber: string;
    };
    expiresAt?: string | null;
    status?: string;
}

export default function CitizenRegistrationChallenge({
    invitation,
    expiresAt,
    status,
}: CitizenRegistrationChallengeProps) {
    const form = useForm({
        accept: false,
        otp: '',
    });

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.post('/citizen/register/verify');
    };

    return (
        <AuthLayout
            title="Conferma creazione account"
            description={`Controlla i tuoi dati e inserisci l'OTP inviato al numero ${invitation.maskedPhoneNumber}.`}
        >
            <Head title="Conferma registrazione cittadino" />

            <OTPCountdown expiresAt={expiresAt ?? undefined} />

            <Card className="border-amber-200">
                <CardHeader>
                    <CardTitle>I dati inseriti dall&apos;operatore</CardTitle>
                    <CardDescription>
                        Se trovi un errore, non confermare e contatta la struttura.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm">
                    <DataRow label="Nome completo" value={invitation.name} />
                    <DataRow label="Email" value={invitation.email} />
                    <DataRow label="Numero di telefono" value={invitation.phoneNumber} />
                    <DataRow label="Codice fiscale" value={invitation.fiscalCode} />
                </CardContent>
            </Card>

            <form onSubmit={submit} className="mt-6 flex flex-col gap-6">
                <div className="flex flex-col items-center gap-2">
                    <Label className="self-start" htmlFor="otp">Codice OTP</Label>
                    <InputOTP
                        id="otp"
                        value={form.data.otp}
                        onChange={(value) => form.setData('otp', value)}
                        maxLength={6}
                    >
                        <InputOTPGroup>
                            {Array.from({ length: 6 }).map((_, index) => (
                                <InputOTPSlot key={index} index={index} />
                            ))}
                        </InputOTPGroup>
                    </InputOTP>
                    <InputError message={form.errors.otp} />
                </div>

                <div className="flex items-start gap-3 rounded-xl border bg-muted/20 p-4">
                    <Checkbox
                        id="accept"
                        checked={form.data.accept}
                        onCheckedChange={(checked) => form.setData('accept', checked === true)}
                    />
                    <div className="grid gap-1">
                        <Label htmlFor="accept" className="leading-5">
                            Confermo che i dati sopra riportati sono corretti e autorizzo la creazione del mio account cittadino.
                        </Label>
                        <InputError message={form.errors.accept} />
                    </div>
                </div>

                <Button type="submit" disabled={form.processing} className="w-full">
                    {form.processing && <Spinner />}
                    Conferma e crea account
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

function DataRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="grid gap-1 rounded-lg border bg-background px-4 py-3">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
            </div>
            <div className="font-medium text-foreground">{value}</div>
        </div>
    );
}

function OTPCountdown({ expiresAt }: { expiresAt?: string }) {
    const [timeLeft, setTimeLeft] = useState<number>(0);

    useEffect(() => {
        if (!expiresAt) return;

        const targetTime = new Date(expiresAt).getTime();

        const updateCountdown = () => {
            const now = Date.now();
            const diff = Math.max(targetTime - now, 0);
            setTimeLeft(diff);
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);

        return () => clearInterval(interval);
    }, [expiresAt]);

    if (!expiresAt) return null;

    const totalSeconds = Math.floor(timeLeft / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    const isExpired = timeLeft === 0;

    return (
        <div className="mb-6 flex items-center justify-center gap-1 rounded-xl border bg-muted/30 p-4 text-muted-foreground">
            {isExpired ? (
                <span>Il codice OTP è scaduto.</span>
            ) : (
                <>
                    Il codice OTP scadrà tra: <strong>{formatted}</strong>
                </>
            )}
        </div>
    );
}
