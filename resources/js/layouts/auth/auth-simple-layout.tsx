import AppLogoIcon from '@/components/app-logo-icon';
import { Card } from '@/components/ui/card';
import { home } from '@/routes';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    name?: string;
    title?: string;
    description?: string;
}

/*export default function AuthSimpleLayout({
    children,
    title,
    description,
}: PropsWithChildren<AuthLayoutProps>) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <Link
                            href={home()}
                            className="flex flex-col items-center gap-2 font-medium"
                        >
                            <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-md">
                                <AppLogoIcon className="size-9 fill-current text-[var(--foreground)] dark:text-white" />
                            </div>
                            <span className="sr-only">{title}</span>
                        </Link>

                        <div className="space-y-2 text-center">
                            <h1 className="text-xl font-medium">{title}</h1>
                            <p className="text-center text-sm text-muted-foreground">
                                {description}
                            </p>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}*/

export default function AuthSimpleLayout({
  children,
  title,
  description,
}: PropsWithChildren<AuthLayoutProps>) {
  return (
    <div className="relative flex min-h-screen overflow-hidden">
      {/* exactly your welcome-screen background */}
        <div
            className="
            absolute inset-0
            bg-gradient-to-br
                from-primary/100
                to-cyan-300/90
            animate-gradient-xy
            mix-blend-normal
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

      {/* content wrapper */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-6 md:p-10">
        <Card
          className="
            w-full 
            max-w-sm
            bg-background/95 
            backdrop-blur-xl
            border-none
            p-8 
            space-y-6
            animate-fade-in-up
          "
        >
          {/* logo + home link */}
          <Link href={home()} className="flex justify-center">
            <AppLogoIcon className="h-12 w-12 text-primary dark:text-secondary" />
          </Link>

          {/* title & description */}
          <div className="text-center space-y-1">
            {title && (
              <h1 className="text-2xl font-semibold leading-snug">
                {title}
              </h1>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>

          {/* form or other children */}
          <div className="space-y-4">{children}</div>
        </Card>
      </div>
    </div>
  )
}
