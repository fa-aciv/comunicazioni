import { Search } from 'lucide-react';

import type { EmployeeSummary } from '@/components/chat/chat-types';
import {
    formatEmployeeSecondaryText,
    SEARCH_RESULT_LIMIT,
} from '@/components/chat/chat-add-participant-dialog-utils';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface ParticipantSearchView {
    available: EmployeeSummary[];
    results: EmployeeSummary[];
    query: string;
    normalizedQuery: string;
    selected?: EmployeeSummary;
    selectedId: string;
    busy: boolean;
    error?: string;
    setQuery: (value: string) => void;
    select: (employeeId: string) => void;
}

export function AddParticipantSection({
    search,
}: {
    search: ParticipantSearchView;
}) {
    const hasReachedLimit =
        search.normalizedQuery.length > 0 &&
        search.results.length === SEARCH_RESULT_LIMIT;

    return (
        <div className="space-y-2">
            <div className="text-sm font-medium">Aggiungi un dipendente</div>

            <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={search.query}
                    onChange={(event) => search.setQuery(event.currentTarget.value)}
                    placeholder="Cerca per nome, email o reparto"
                    className="pl-9"
                    disabled={search.available.length === 0 || search.busy}
                />
            </div>

            <SearchResults search={search} />

            {hasReachedLimit ? (
                <p className="text-sm text-muted-foreground">
                    Mostro i primi 50 risultati. Affina la ricerca per restringere l'elenco.
                </p>
            ) : null}

            {search.selected ? (
                <p className="text-sm text-muted-foreground">
                    Selezionato:{' '}
                    <span className="font-medium text-foreground">
                        {search.selected.name}
                    </span>
                </p>
            ) : null}

            <InputError message={search.error} />
        </div>
    );
}

function SearchResults({
    search,
}: {
    search: Pick<
        ParticipantSearchView,
        'available' | 'results' | 'normalizedQuery' | 'selectedId' | 'select'
    >;
}) {
    if (search.available.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                Tutti i dipendenti disponibili partecipano già a questa chat.
            </p>
        );
    }

    if (search.normalizedQuery.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                Digita almeno un termine per cercare tra i dipendenti disponibili.
            </p>
        );
    }

    if (search.results.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                Nessun dipendente trovato per questa ricerca.
            </p>
        );
    }

    return (
        <ScrollArea className="h-32 rounded-lg border">
            <div className="space-y-1 p-1">
                {search.results.map((employee) => (
                    <button
                        key={employee.id}
                        type="button"
                        className={[
                            'w-full rounded-md px-3 py-2 text-left text-sm transition-colors',
                            search.selectedId === String(employee.id)
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted',
                        ].join(' ')}
                        onClick={() => search.select(String(employee.id))}
                    >
                        <div className="truncate font-medium">{employee.name}</div>
                        <div
                            className={
                                search.selectedId === String(employee.id)
                                    ? 'truncate text-primary-foreground/80'
                                    : 'truncate text-muted-foreground'
                            }
                        >
                            {formatEmployeeSecondaryText(employee)}
                        </div>
                    </button>
                ))}
            </div>
        </ScrollArea>
    );
}
