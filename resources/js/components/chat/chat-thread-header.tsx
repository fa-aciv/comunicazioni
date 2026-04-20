import { ChatAddParticipantDialog } from '@/components/chat/chat-add-participant-dialog';
import type {
    EmployeeSummary,
    SelectedChatSummary,
} from '@/components/chat/chat-types';
import { Button } from '@/components/ui/button';
import { CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { router } from '@inertiajs/react';
import ParticipantBadge from '@/components/chat/participant-badge';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ChatThreadHeaderProps {
    selectedChat: SelectedChatSummary | null;
    employees: EmployeeSummary[];
    currentActorId: number;
    canManageParticipants: boolean;
    buildThreadDestroyUrl?: (chatId: number) => string;
    buildParticipantStoreUrl?: (chatId: number) => string;
    buildParticipantDestroyUrl?: (chatId: number, employeeId: number) => string;
}

export function ChatThreadHeader({
    selectedChat,
    employees,
    currentActorId,
    canManageParticipants,
    buildThreadDestroyUrl,
    buildParticipantStoreUrl,
    buildParticipantDestroyUrl,
}: ChatThreadHeaderProps) {
    const [isDeletingThread, setIsDeletingThread] = useState(false);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

    useEffect(() => {
        setConfirmDeleteOpen(false);
    }, [selectedChat?.id]);

    const handleThreadDeletion = () => {
        if (!selectedChat || !buildThreadDestroyUrl || isDeletingThread) {
            return;
        }

        setIsDeletingThread(true);

        router.delete(buildThreadDestroyUrl(selectedChat.id), {
            preserveScroll: true,
            onFinish: () => {
                setIsDeletingThread(false);
                setConfirmDeleteOpen(false);
            },
        });
    };

    return (
        <CardHeader className="flex flex-row flex-wrap items-center justify-between">
            <CardTitle className="me-2">
                {selectedChat?.title ?? 'Nessuna chat selezionata'}
            </CardTitle>
            <div className="flex flex-row items-center flex-wrap gap-2">
                <div className="flex flex-wrap gap-2">
                    {selectedChat?.citizen ? (
                        <ParticipantBadge
                            type="citizen"
                            name={selectedChat.citizen.name}
                        />
                    ) : null}
                    {selectedChat?.employees.map(
                        (employeeParticipant) => (
                            <ParticipantBadge
                                key={employeeParticipant.id}
                                type="employee"
                                name={employeeParticipant.name}
                            />
                        ))
                    }
                </div>

                {canManageParticipants &&
                    buildParticipantStoreUrl &&
                    buildParticipantDestroyUrl ? (
                    <ChatAddParticipantDialog
                        selectedChat={selectedChat}
                        employees={employees}
                        currentActorId={currentActorId}
                        buildParticipantStoreUrl={buildParticipantStoreUrl}
                        buildParticipantDestroyUrl={buildParticipantDestroyUrl}
                    />
                ) : null}

                {buildThreadDestroyUrl ? (
                    <DropdownMenu>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="lg"
                                        disabled={!selectedChat || isDeletingThread}
                                    >
                                        <MoreHorizontal />
                                    </Button>
                                </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{selectedChat ? 'Azioni chat' : 'Seleziona una chat'}</p>
                            </TooltipContent>
                        </Tooltip>
                            <DropdownMenuContent align="end" className="w-48 min-w-0">
                                <DropdownMenuItem
                                    variant="destructive"
                                    onSelect={() => setConfirmDeleteOpen(true)}
                                    disabled={!selectedChat || isDeletingThread}
                                >
                                    <Trash2 className="size-4" />
                                    Elimina chat
                                </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : null}
            </div>

            <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Eliminare questa chat?</DialogTitle>
                        <DialogDescription>
                            Questa operazione è permanente e rimuoverà definitivamente la conversazione e tutti i suoi messaggi per tutti i partecipanti.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setConfirmDeleteOpen(false)}
                            disabled={isDeletingThread}
                        >
                            Annulla
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleThreadDeletion}
                            disabled={isDeletingThread || !selectedChat}
                        >
                            <Trash2 className="size-4" />
                            Elimina definitivamente
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </CardHeader>
    );
}
