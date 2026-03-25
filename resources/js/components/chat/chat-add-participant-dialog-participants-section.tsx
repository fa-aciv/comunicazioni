import { UserMinus } from 'lucide-react';

import type { EmployeeSummary } from '@/components/chat/chat-types';
import { formatEmployeeSecondaryText } from '@/components/chat/chat-add-participant-dialog-utils';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

export interface ParticipantListView {
    items: EmployeeSummary[];
    currentActorId: number;
    removingId: number | null;
    busy: boolean;
    error?: string;
    remove: (employeeId: number) => void;
}

export function ParticipantsSection({ list }: { list: ParticipantListView }) {
    const canRemoveOthers = list.items.some(
        (employee) => employee.id !== list.currentActorId,
    );

    return (
        <div className="space-y-2">
            <div className="text-sm font-medium">Dipendenti partecipanti</div>

            {list.items.length > 0 ? (
                <div className="space-y-2 rounded-lg border p-2">
                    {list.items.map((employee) => (
                        <ParticipantRow
                            key={employee.id}
                            employee={employee}
                            currentActorId={list.currentActorId}
                            removingId={list.removingId}
                            busy={list.busy}
                            remove={list.remove}
                        />
                    ))}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground">
                    Nessun partecipante presente.
                </p>
            )}

            {!canRemoveOthers ? (
                <p className="text-sm text-muted-foreground">
                    Non ci sono altri dipendenti da rimuovere.
                </p>
            ) : null}

            <InputError message={list.error} />
        </div>
    );
}

function ParticipantRow({
    employee,
    currentActorId,
    removingId,
    busy,
    remove,
}: {
    employee: EmployeeSummary;
    currentActorId: number;
    removingId: number | null;
    busy: boolean;
    remove: (employeeId: number) => void;
}) {
    const isCurrentActor = employee.id === currentActorId;
    const isRemoving = removingId === employee.id;

    return (
        <div className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5">
            <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{employee.name}</div>
                <div className="truncate text-sm text-muted-foreground">
                    {formatEmployeeSecondaryText(employee)}
                </div>
            </div>

            {isCurrentActor ? (
                <span className="shrink-0 text-sm text-muted-foreground">Tu</span>
            ) : (
                <Button
                    type="button"
                    variant="outline"
                    size="icon-lg"
                    className="shrink-0"
                    onClick={() => remove(employee.id)}
                    disabled={busy}
                    aria-label={`Rimuovi ${employee.name}`}
                >
                    {isRemoving ? <Spinner /> : <UserMinus />}
                </Button>
            )}
        </div>
    );
}
