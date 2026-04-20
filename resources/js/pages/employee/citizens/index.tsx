import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import employee from '@/routes/employee';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ChevronRight, Search, UserPlus, UsersRound } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: employee.dashboard().url,
    },
    {
        title: 'Account cittadini',
        href: employee.citizens.index().url,
    },
];

interface CitizenAccountSummary {
    uuid: string;
    name: string;
    fiscalCode: string;
    lastLoginAt: string | null;
}

interface EmployeeCitizensPageProps {
    status?: string;
    filters: {
        search: string;
    };
    resultsLimit: number;
    citizens: CitizenAccountSummary[];
}

function formatLastLogin(date: string | null): string {
    if (!date) {
        return 'Mai';
    }

    return new Intl.DateTimeFormat('it-IT', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(date));
}

export default function EmployeeCitizensPage({
    status,
    filters,
    resultsLimit,
    citizens,
}: EmployeeCitizensPageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Account cittadini" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {status && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                        {status}
                    </div>
                )}

                <Card>
                    <CardHeader className="space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-1">
                                <CardTitle>Account cittadini</CardTitle>
                                <CardDescription>
                                    Elenco minimale degli account. Clicca una riga per aprire la modifica dei contatti.
                                </CardDescription>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                <Button asChild variant="outline">
                                    <Link href={employee.dashboard().url}>
                                        Torna alla dashboard
                                    </Link>
                                </Button>
                                <Button asChild>
                                    <Link href={employee.citizens.create().url}>
                                        <UserPlus className="size-4" />
                                        Nuovo cittadino
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <CitizenSearchForm
                            key={filters.search}
                            initialSearch={filters.search}
                        />

                        <div className="rounded-2xl border border-dashed bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                            {filters.search
                                ? `Risultati per "${filters.search}". Mostro fino a ${resultsLimit} account.`
                                : `Mostro ${resultsLimit} account ordinati per nome.`}
                        </div>

                        {citizens.length > 0 ? (
                            <div className="overflow-hidden rounded-2xl border">
                                <div className="hidden bg-muted/40 px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid md:grid-cols-[minmax(0,1.3fr)_190px_190px_32px] md:gap-4">
                                    <span>Nome e cognome</span>
                                    <span>Codice fiscale</span>
                                    <span>Ultimo accesso</span>
                                    <span></span>
                                </div>

                                <div className="divide-y">
                                    {citizens.map((citizen) => (
                                        <Link
                                            key={citizen.uuid}
                                            href={employee.citizens.edit.url({ citizen: citizen.uuid })}
                                            className="flex flex-col gap-2 px-4 py-4 transition-colors hover:bg-muted/40 md:grid md:grid-cols-[minmax(0,1.3fr)_190px_190px_32px] md:items-center md:gap-4"
                                        >
                                            <div className="min-w-0 font-medium">{citizen.name}</div>
                                            <div className="text-sm text-muted-foreground md:text-foreground">
                                                {citizen.fiscalCode}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {formatLastLogin(citizen.lastLoginAt)}
                                            </div>
                                            <div className="flex justify-end text-muted-foreground">
                                                <ChevronRight className="size-4" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-2xl border text-center">
                                <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                                    <UsersRound className="size-5" />
                                </div>
                                <div className="space-y-1">
                                    <div className="font-medium">Nessun account trovato</div>
                                    <div className="text-sm text-muted-foreground">
                                        Prova a cercare con un altro nome, contatto o codice fiscale.
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

interface CitizenSearchFormProps {
    initialSearch: string;
}

function CitizenSearchForm({ initialSearch }: CitizenSearchFormProps) {
    const [search, setSearch] = useState(initialSearch);

    const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmedSearch = search.trim();

        router.get(
            employee.citizens.index().url,
            trimmedSearch === '' ? {} : { search: trimmedSearch },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

    const clearSearch = () => {
        setSearch('');

        router.get(employee.citizens.index().url, {}, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    return (
        <form onSubmit={submitSearch} className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={search}
                    onChange={(event) => setSearch(event.currentTarget.value)}
                    className="pl-9"
                    placeholder="Cerca per nome, codice fiscale, email o telefono"
                />
            </div>
            <div className="flex gap-2">
                <Button type="submit">Cerca</Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={clearSearch}
                    disabled={search === '' && initialSearch === ''}
                >
                    Pulisci
                </Button>
            </div>
        </form>
    );
}
