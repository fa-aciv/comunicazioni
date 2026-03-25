import { useForm } from '@inertiajs/react';
import { Search, UserCog, UserMinus, UserPlus } from 'lucide-react';
import { type ReactNode, useDeferredValue, useEffect, useState } from 'react';

import type {
    EmployeeSummary,
    SelectedChatSummary,
} from '@/components/chat/chat-types';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ChatAddParticipantDialogProps {
    selectedChat: SelectedChatSummary | null;
    employees: EmployeeSummary[];
    currentActorId: number;
    buildParticipantStoreUrl: (chatId: number) => string;
    buildParticipantDestroyUrl: (chatId: number, employeeId: number) => string;
}

export function ChatAddParticipantDialog({
    selectedChat,
    employees,
    currentActorId,
    buildParticipantStoreUrl,
    buildParticipantDestroyUrl,
}: ChatAddParticipantDialogProps) {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [removingEmployeeId, setRemovingEmployeeId] = useState<number | null>(null);
    const deferredSearchTerm = useDeferredValue(searchTerm);
    const participantForm = useForm({
        employee_id: '',
    });
    const removeParticipantForm = useForm<{
        employee_id?: string;
        chat?: string;
    }>({});

    const currentParticipantIds = new Set(
        selectedChat?.employees.map((employee) => employee.id) ?? [],
    );
    const availableEmployees = employees.filter(
        (employee) => !currentParticipantIds.has(employee.id),
    );
    const removableEmployees = (selectedChat?.employees ?? []).filter(
        (employee) => employee.id !== currentActorId,
    );
    const normalizedSearchTerm = deferredSearchTerm.trim().toLowerCase();
    const filteredEmployees =
        normalizedSearchTerm.length === 0
            ? []
            : availableEmployees
                  .filter((employee) => matchesEmployeeSearch(employee, normalizedSearchTerm))
                  .slice(0, 50);
    const selectedEmployee = availableEmployees.find(
        (employee) => String(employee.id) === participantForm.data.employee_id,
    );
    const isTriggerDisabled = !selectedChat;
    let searchResultsContent: ReactNode;

    if (availableEmployees.length === 0) {
        searchResultsContent = (
            <p className="text-sm text-muted-foreground">
                Tutti i dipendenti disponibili partecipano già a questa chat.
            </p>
        );
    } else if (normalizedSearchTerm.length === 0) {
        searchResultsContent = (
            <p className="text-sm text-muted-foreground">
                Digita almeno un termine per cercare tra i dipendenti disponibili.
            </p>
        );
    } else if (filteredEmployees.length > 0) {
        searchResultsContent = (
            <ScrollArea className="h-32 rounded-lg border">
                <div className="space-y-1 p-1">
                    {filteredEmployees.map((employee) => {
                        const isSelected =
                            participantForm.data.employee_id === String(employee.id);

                        return (
                            <button
                                key={employee.id}
                                type="button"
                                className={[
                                    'w-full rounded-md px-3 py-2 text-left text-sm transition-colors',
                                    isSelected
                                        ? 'bg-primary text-primary-foreground'
                                        : 'hover:bg-muted',
                                ].join(' ')}
                                onClick={() => {
                                    participantForm.setData(
                                        'employee_id',
                                        String(employee.id),
                                    );
                                    participantForm.clearErrors();
                                }}
                            >
                                <div className="truncate font-medium">{employee.name}</div>
                                <div
                                    className={
                                        isSelected
                                            ? 'truncate text-primary-foreground/80'
                                            : 'truncate text-muted-foreground'
                                    }
                                >
                                    {formatEmployeeSecondaryText(employee)}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </ScrollArea>
        );
    } else {
        searchResultsContent = (
            <p className="text-sm text-muted-foreground">
                Nessun dipendente trovato per questa ricerca.
            </p>
        );
    }

    useEffect(() => {
        setOpen(false);
        setSearchTerm('');
        setRemovingEmployeeId(null);
        participantForm.reset();
        participantForm.clearErrors();
        removeParticipantForm.clearErrors();
    }, [selectedChat?.id]);

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);

        if (!nextOpen) {
            setSearchTerm('');
            setRemovingEmployeeId(null);
            participantForm.reset();
            participantForm.clearErrors();
            removeParticipantForm.clearErrors();
        }
    };

    const handleSubmit = () => {
        if (!selectedChat || !participantForm.data.employee_id || participantForm.processing) {
            return;
        }

        participantForm.post(buildParticipantStoreUrl(selectedChat.id), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setSearchTerm('');
                participantForm.reset();
                participantForm.clearErrors();
            },
        });
    };

    const handleRemoveParticipant = (employeeId: number) => {
        if (!selectedChat || removeParticipantForm.processing) {
            return;
        }

        setRemovingEmployeeId(employeeId);
        removeParticipantForm.clearErrors();

        removeParticipantForm.delete(
            buildParticipantDestroyUrl(selectedChat.id, employeeId),
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => {
                    setRemovingEmployeeId(null);
                },
            },
        );
    };

    const tooltipLabel = !selectedChat
        ? 'Seleziona una chat'
        : 'Gestisci i partecipanti';

    return (
        <>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        disabled={isTriggerDisabled}
                        onClick={() => handleOpenChange(true)}
                    >
                        <UserCog />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{tooltipLabel}</p>
                </TooltipContent>
            </Tooltip>

            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-lg gap-0 overflow-hidden p-0 sm:max-h-[calc(100dvh-2rem)] sm:w-full">
                    <DialogHeader className="shrink-0 px-4 pt-4 pb-0 pr-12 sm:px-6 sm:pt-6">
                        <DialogTitle>Gestisci partecipanti</DialogTitle>
                        <DialogDescription>
                            Aggiungi altri dipendenti alla conversazione o rimuovi quelli già presenti. Non puoi rimuovere te stesso.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="min-h-0 space-y-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
                        <div className="space-y-2">
                            <div className="text-sm font-medium">Dipendenti partecipanti</div>

                            {selectedChat?.employees.length ? (
                                <div className="space-y-2 rounded-lg border p-2">
                                    {selectedChat.employees.map((employee) => {
                                        const isCurrentActor = employee.id === currentActorId;
                                        const isRemoving = removingEmployeeId === employee.id;

                                        return (
                                            <div
                                                key={employee.id}
                                                className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <div className="truncate text-sm font-medium">
                                                        {employee.name}
                                                    </div>
                                                    <div className="truncate text-sm text-muted-foreground">
                                                        {formatEmployeeSecondaryText(employee)}
                                                    </div>
                                                </div>

                                                {isCurrentActor ? (
                                                    <span className="shrink-0 text-sm text-muted-foreground">
                                                        Tu
                                                    </span>
                                                ) : (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon-lg"
                                                        className="shrink-0"
                                                        onClick={() =>
                                                            handleRemoveParticipant(employee.id)
                                                        }
                                                        disabled={removeParticipantForm.processing}
                                                        aria-label={`Rimuovi ${employee.name}`}
                                                    >
                                                        {isRemoving ? (
                                                            <Spinner />
                                                        ) : (
                                                            <UserMinus />
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Nessun partecipante presente.
                                </p>
                            )}

                            {removableEmployees.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Non ci sono altri dipendenti da rimuovere.
                                </p>
                            ) : null}

                            <InputError
                                message={
                                    removeParticipantForm.errors.employee_id ??
                                    removeParticipantForm.errors.chat
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="text-sm font-medium">Aggiungi un dipendente</div>

                            <div className="relative">
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.currentTarget.value)}
                                    placeholder="Cerca per nome, email o reparto"
                                    className="pl-9"
                                    disabled={availableEmployees.length === 0 || participantForm.processing}
                                />
                            </div>

                            {searchResultsContent}

                            {normalizedSearchTerm.length > 0 && filteredEmployees.length === 50 ? (
                                <p className="text-sm text-muted-foreground">
                                    Mostro i primi 50 risultati. Affina la ricerca per restringere l'elenco.
                                </p>
                            ) : null}

                            {selectedEmployee ? (
                                <p className="text-sm text-muted-foreground">
                                    Selezionato: <span className="font-medium text-foreground">{selectedEmployee.name}</span>
                                </p>
                            ) : null}

                            <InputError message={participantForm.errors.employee_id} />
                        </div>
                    </div>

                    <div className="flex shrink-0 flex-col-reverse gap-2 border-t bg-muted/50 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full sm:w-auto"
                            onClick={() => handleOpenChange(false)}
                            disabled={participantForm.processing}
                        >
                            Chiudi
                        </Button>
                        <Button
                            type="button"
                            className="w-full sm:w-auto"
                            onClick={handleSubmit}
                            disabled={
                                !participantForm.data.employee_id ||
                                participantForm.processing
                            }
                        >
                            {participantForm.processing ? <Spinner /> : null}
                            Aggiungi
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

function formatEmployeeSecondaryText(employee: EmployeeSummary) {
    if (employee.department_name) {
        return `${employee.department_name} · ${employee.email}`;
    }

    return employee.email;
}

function matchesEmployeeSearch(employee: EmployeeSummary, searchTerm: string) {
    return [employee.name, employee.email, employee.department_name ?? '']
        .some((value) => value.toLowerCase().includes(searchTerm));
}
