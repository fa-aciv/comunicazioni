import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

interface PortalDashboardProps {
    portal: {
        name: 'citizen' | 'employee';
        title: string;
        description: string;
        highlights: Array<{
            title: string;
            description: string;
        }>;
    };
}

export default function PortalDashboard({ portal }: PortalDashboardProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: portal.title,
            href: `/${portal.name}/dashboard`,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={portal.title} />

            <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-6 p-4 md:p-6">
                <section className="rounded-3xl border bg-linear-to-br from-white to-slate-50 p-8 shadow-sm dark:from-neutral-950 dark:to-neutral-900">
                    <div className="max-w-2xl">
                        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">
                            {portal.title}
                        </div>
                        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                            {portal.description}
                        </h1>
                        <p className="mt-4 text-sm text-muted-foreground">
                            Questa dashboard e un punto di partenza dedicato al
                            profilo autenticato correntemente.
                        </p>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                    {portal.highlights.map((highlight) => (
                        <article
                            key={highlight.title}
                            className="rounded-2xl border bg-background p-6 shadow-sm"
                        >
                            <h2 className="text-lg font-semibold">
                                {highlight.title}
                            </h2>
                            <p className="mt-2 text-sm text-muted-foreground">
                                {highlight.description}
                            </p>
                        </article>
                    ))}
                </section>
            </div>
        </AppLayout>
    );
}
