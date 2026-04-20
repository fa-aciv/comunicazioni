import { useForm } from '@inertiajs/react';
import { UserCog } from 'lucide-react';
import { useDeferredValue, useState } from 'react';

import {
    AddParticipantSection,
    type ParticipantSearchView,
} from '@/components/chat/chat-add-participant-dialog-add-section';
import {
    ParticipantsSection,
    type ParticipantListView,
} from '@/components/chat/chat-add-participant-dialog-participants-section';
import {
    matchesEmployeeSearch,
    SEARCH_RESULT_LIMIT,
} from '@/components/chat/chat-add-participant-dialog-utils';
import type {
    EmployeeSummary,
    SelectedChatSummary,
} from '@/components/chat/chat-types';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ChatAddParticipantDialogProps {
    selectedChat: SelectedChatSummary | null;
    employees: EmployeeSummary[];
    currentActorId: number;
    buildParticipantStoreUrl: (chatId: number) => string;
    buildParticipantDestroyUrl: (chatId: number, employeeId: number) => string;
}

interface RemoveFormData {
    employee_id?: string;
    chat?: string;
}

export function ChatAddParticipantDialog({
    selectedChat,
    employees,
    currentActorId,
    buildParticipantStoreUrl,
    buildParticipantDestroyUrl,
}: ChatAddParticipantDialogProps) {
    const [open, setOpen] = useState(false);
    const [searchQuery, setQuery] = useState('');
    const [removingId, setRemovingId] = useState<number | null>(null);
    const deferredSearchQuery = useDeferredValue(searchQuery);

    const addForm = useForm({
        employee_id: '',
    });
    const removeForm = useForm<RemoveFormData>({});

    const participants = selectedChat?.employees ?? [];
    const selectedId = addForm.data.employee_id;
    const normalizedSearchQuery = deferredSearchQuery.trim().toLowerCase();
    const participantIds = new Set(participants.map(({ id }) => id));
    const available = employees.filter(({ id }) => !participantIds.has(id));
    const results =
        normalizedSearchQuery.length === 0
            ? []
            : available
                  .filter((employee) => matchesEmployeeSearch(employee, normalizedSearchQuery))
                  .slice(0, SEARCH_RESULT_LIMIT);
    const selected = available.find(({ id }) => String(id) === selectedId);
    const canSubmit = !!selectedChat && !!selectedId && !addForm.processing;

    const reset = () => {
        setQuery('');
        setRemovingId(null);
        addForm.reset();
        addForm.clearErrors();
        removeForm.clearErrors();
    };

    const onOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);

        if (!nextOpen) {
            reset();
        }
    };

    const onSelect = (employeeId: string) => {
        addForm.setData('employee_id', employeeId);
        addForm.clearErrors();
    };

    const onSubmit = () => {
        if (!selectedChat || !canSubmit) {
            return;
        }

        addForm.post(buildParticipantStoreUrl(selectedChat.id), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setQuery('');
                addForm.reset();
                addForm.clearErrors();
            },
        });
    };

    const onRemove = (employeeId: number) => {
        if (!selectedChat || removeForm.processing) {
            return;
        }

        setRemovingId(employeeId);
        removeForm.clearErrors();

        removeForm.delete(buildParticipantDestroyUrl(selectedChat.id, employeeId), {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => {
                setRemovingId(null);
            },
        });
    };

    const list: ParticipantListView = {
        items: participants,
        currentActorId,
        removingId,
        busy: removeForm.processing,
        error: removeForm.errors.employee_id ?? removeForm.errors.chat,
        remove: onRemove,
    };

    const search: ParticipantSearchView = {
        available,
        results,
        query: searchQuery,
        normalizedQuery: normalizedSearchQuery,
        selected,
        selectedId,
        busy: addForm.processing,
        error: addForm.errors.employee_id,
        setQuery,
        select: onSelect,
    };

    return (
        <>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        disabled={!selectedChat}
                        onClick={() => onOpenChange(true)}
                    >
                        <UserCog />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{selectedChat ? 'Gestisci i partecipanti' : 'Seleziona una chat'}</p>
                </TooltipContent>
            </Tooltip>

            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-lg gap-0 overflow-hidden p-0 sm:max-h-[calc(100dvh-2rem)] sm:w-full">
                    <DialogHeader className="shrink-0 px-4 pt-4 pb-0 pr-12 sm:px-6 sm:pt-6">
                        <DialogTitle>Gestisci partecipanti</DialogTitle>
                        <DialogDescription>
                            Aggiungi altri dipendenti alla conversazione o rimuovi quelli già presenti. Non puoi rimuovere te stesso.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="min-h-0 space-y-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
                        <ParticipantsSection list={list} />
                        <AddParticipantSection search={search} />
                    </div>

                    <div className="flex shrink-0 flex-col-reverse gap-2 border-t bg-muted/50 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full sm:w-auto"
                            onClick={() => onOpenChange(false)}
                            disabled={addForm.processing}
                        >
                            Chiudi
                        </Button>
                        <Button
                            type="button"
                            className="w-full sm:w-auto"
                            onClick={onSubmit}
                            disabled={!canSubmit}
                        >
                            {addForm.processing ? <Spinner /> : null}
                            Aggiungi
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
