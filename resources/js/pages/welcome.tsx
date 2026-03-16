import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

interface WelcomeProps extends SharedData {
    hasCitizenSession: boolean;
    hasEmployeeSession: boolean;
}

export default function Welcome() {
    const { auth, hasCitizenSession, hasEmployeeSession } =
        usePage<WelcomeProps>().props;
    const year = new Date().getFullYear();

    return (
        <>
            <Head title="Benvenuto" />

            <div className="relative flex min-h-screen overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-br from-sky-700 via-sky-600 to-cyan-500" />
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-25"
                    style={{ backgroundImage: "url('/assets/hero-bg.jpg')" }}
                />

                <Card className="relative z-10 container mx-auto my-auto flex flex-col gap-8 border-none bg-transparent px-6 py-12 shadow-none sm:bg-background/80 sm:p-12 sm:backdrop-blur-3xl lg:flex-row lg:items-center lg:justify-between">
                    <div className="hidden w-full max-w-xl p-8 sm:block">
                        <h1 className="text-6xl font-extrabold">Comunicazioni</h1>
                        <p className="mt-4 text-lg text-foreground/90">
                            Due percorsi di autenticazione distinti per cittadini
                            e dipendenti, con sessioni separate e aree dedicate.
                        </p>
                    </div>

                    <Card className="w-full max-w-md border-none bg-background/85 py-10 backdrop-blur-xl">
                        <CardHeader className="gap-3 text-center">
                            <CardTitle className="text-2xl font-bold">
                                Scegli il tuo accesso
                            </CardTitle>
                            <CardDescription>
                                Ogni area utilizza credenziali e sessione
                                dedicate.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4 py-4">
                            <div className="rounded-2xl border p-4 text-left">
                                <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                    Area cittadini
                                </div>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Login tramite magic link via email, codice
                                    fiscale e OTP SMS.
                                </p>
                                <Link
                                    href={
                                        hasCitizenSession
                                            ? '/citizen/dashboard'
                                            : '/citizen/login'
                                    }
                                >
                                    <Button className="mt-4 w-full" size="lg">
                                        {hasCitizenSession
                                            ? 'Apri area cittadini'
                                            : 'Accedi come cittadino'}
                                    </Button>
                                </Link>
                            </div>

                            <div className="rounded-2xl border p-4 text-left">
                                <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                    Area dipendenti
                                </div>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Accesso LDAP con credenziali di dominio
                                    ARNAS.
                                </p>
                                <Link
                                    href={
                                        hasEmployeeSession
                                            ? '/employee/dashboard'
                                            : '/employee/login'
                                    }
                                >
                                    <Button
                                        className="mt-4 w-full"
                                        size="lg"
                                        variant="secondary"
                                    >
                                        {hasEmployeeSession
                                            ? 'Apri area dipendenti'
                                            : 'Accedi come dipendente'}
                                    </Button>
                                </Link>
                            </div>

                            {auth.activeGuard && auth.homeUrl && (
                                <Link href={auth.homeUrl}>
                                    <Button className="w-full" variant="ghost">
                                        Continua nella sessione attiva
                                    </Button>
                                </Link>
                            )}
                        </CardContent>
                        <div className="mt-2 text-center text-sm text-muted-foreground">
                            &copy; {year} ARNAS Civico
                        </div>
                        <AppLogoIcon className="mx-auto h-12 w-12 py-2 text-primary" />
                    </Card>
                </Card>
            </div>
        </>
    );
}
