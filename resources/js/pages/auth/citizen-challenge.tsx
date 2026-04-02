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
import { useEffect, useState } from 'react';

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

            <OTPCountdown expiresAt={expiresAt ?? undefined} />

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

function OTPCountdown({ expiresAt }: { expiresAt?: string }) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!expiresAt) return;

    const targetTime = new Date(expiresAt).getTime();

    const updateCountdown = () => {
      const now = Date.now();
      const diff = Math.max(targetTime - now, 0); // in milliseconds
      setTimeLeft(diff);
    };

    updateCountdown(); // initialize immediately
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  // format milliseconds to MM:SS
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  if (!expiresAt) return null;

  const isExpired = timeLeft === 0;

  return (
    <div className="mb-6 rounded-xl border bg-muted/30 p-4 text-muted-foreground flex items-center gap-1 justify-center">
      {isExpired ? (
        <span className="">
          Il codice OTP è scaduto.
        </span>
      ) : (
        <>
          Il codice OTP scadrà tra:{' '}
          <strong>{formatTime(timeLeft)}</strong>
        </>
      )}
    </div>
  );
}