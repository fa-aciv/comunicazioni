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
import { IdCard, UserRound } from 'lucide-react';

interface WelcomeProps extends SharedData {
    hasCitizenSession: boolean;
    hasEmployeeSession: boolean;
}

export default function Welcome() {
    const { hasCitizenSession, hasEmployeeSession } = usePage<WelcomeProps>().props;
    const year = new Date().getFullYear();

    return (
        <>
            <Head title="Benvenuto" />

            <div className="relative flex min-h-screen overflow-hidden">
                <div // TODO: Use auth simple layout
                    className="
                        absolute 
                        inset-0 
                        bg-fixed 
                        bg-center 
                        bg-cover
                    "
                    style={{ backgroundImage: "url('/assets/hero-bg.jpg')" }}
                />

                <Card className="relative z-10 container mx-auto my-auto flex flex-col gap-8 border-none bg-transparent px-6 py-12 shadow-none sm:bg-background/80 sm:p-12 sm:backdrop-blur-3xl lg:flex-row lg:items-center lg:justify-between">
                    <div className="hidden w-full max-w-xl p-8 sm:block">
                        <h1 className="text-6xl font-extrabold">Comunicazioni</h1>
                        <p className="mt-4 text-lg text-foreground/90">
                            Comunica in sicurezza con l'ARNAS Civico di Cristina Benfratelli
                        </p>
                    </div>

                    <Card className="w-full lg:max-w-md border-none bg-background/85 py-10 backdrop-blur-xl">
                        <CardHeader className="gap-3 text-center">
                            <CardTitle className="text-2xl font-bold">
                                Accedi
                            </CardTitle>
                            <CardDescription>
                                Effettua l'accesso per accedere alle tue comunicazioni
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4 py-4">
                            <Link
                                href={
                                    hasCitizenSession
                                        ? '/citizen/dashboard'
                                        : '/citizen/login'
                                }
                            >
                                <Button className="mt-4 w-full" size="lg">
                                    <UserRound />
                                    {hasCitizenSession
                                        ? 'Apri area cittadini'
                                        : 'Accedi come cittadino'}
                                </Button>
                            </Link>

                            <Link
                                href={
                                    hasEmployeeSession
                                        ? '/employee/dashboard'
                                        : '/employee/login'
                                }
                            >
                                <Button
                                    className="mt-4 w-full"
                                    size="sm"
                                    variant="outline"
                                >
                                    <IdCard />
                                    {hasEmployeeSession
                                        ? 'Apri area dipendenti'
                                        : 'Area dipendenti'}
                                </Button>
                            </Link>
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
