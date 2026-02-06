import { dashboard, login } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import AppLogoIcon from '@/components/app-logo-icon'

export default function Welcome() {
  const { auth } = usePage<SharedData>().props
  const year = new Date().getFullYear()

  return (
    <>
      <Head title="Benvenuto" />

      <div className="relative flex min-h-screen overflow-hidden">
        {/* Background */}
        <div className="
            absolute 
            inset-0 
            bg-gradient-to-br 
            from-primary/100 
            to-cyan-500
        " 
        />
        <div
            className="
                absolute 
                inset-0 
                bg-fixed 
                bg-center 
                bg-cover
            "
            style={{ backgroundImage: "url('/assets/hero-bg.jpg')" }}
        />

        {/* Content */}
       
        <Card className="
            relative 
            z-10 
            container 
            mx-auto 
            my-auto 
            flex 
            flex-col
            lg:flex-row 
            items-center 
            justify-between 
            px-6 
            py-12
            sm:bg-background/80 
            sm:backdrop-blur-3xl
            bg-transparent
            sm:shadow
            shadow-none
            border-none
            ring-border 
            p-12 
            gap-0
            animate-fade-in-up
            
        ">
            <div className="hidden sm:block w-full max-w-xl p-8">
                <h1 className="text-6xl font-extrabold ">Comunicazioni</h1>
                <p className="mt-4 text-lg text-foreground/90">
                    Accedi con le tue credenziali ARNAS Civico.
                </p>
            </div>

            {/* Right Card */}
            <Card className="w-full max-w-sm bg-background/80 backdrop-blur-xl border-none py-12 gap-0">
                <CardHeader className="text-center gap-2">
                <CardTitle className="text-2xl font-bold">Benvenuto</CardTitle>
                <CardDescription>
                    {auth.user
                    ? 'Vai alla dashboard'
                    : 'Accedi al servizio'}
                </CardDescription>
                </CardHeader>

                <CardContent className="py-4">
                {auth.user ? (
                    <Link href={dashboard()}>
                    <Button size="lg" className="w-full" asChild>
                        <span>Accedi</span>
                    </Button>
                    </Link>
                ) : (
                    <>
                    <Link href={login()}>
                        <Button size="lg" className="w-full" asChild>
                        <span>Accedi</span>
                        </Button>
                    </Link>
                    </>
                )}
                </CardContent>            
                <div className="justify-self-end text-center text-sm text-muted-foreground mt-2">
                © {year} ARNAS Civico
                </div>
                <AppLogoIcon className="h-12 w-12 mx-auto text-primary py-2" />
            </Card>
        </Card>
      </div>
    </>
  )
}
