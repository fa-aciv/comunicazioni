import { UserPlus } from 'lucide-react';

import type { SelectedChatSummary } from '@/components/chat/chat-types';
import { Button } from '@/components/ui/button';
import { CardHeader, CardTitle } from '@/components/ui/card';
import ParticipantBadge from '@/components/chat/participant-badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ChatThreadHeaderProps {
    selectedChat: SelectedChatSummary | null;
    canManageParticipants: boolean;
}

export function ChatThreadHeader({
    selectedChat,
    canManageParticipants,
}: ChatThreadHeaderProps) {
    return (
        <CardHeader className="flex flex-row flex-wrap items-center justify-between">
            <CardTitle className="me-2">
                {selectedChat?.title ?? 'Nessuna chat selezionata'}
            </CardTitle>
            <div className="flex flex-row items-center gap-2">
                <div className="flex flex-wrap gap-2">
                    {selectedChat?.citizen ? (
                        <ParticipantBadge
                            type="citizen"
                            name={selectedChat.citizen.name}
                        />
                    ) : null}
                    {selectedChat?.employees.map((employeeParticipant) => (
                        <ParticipantBadge
                            key={employeeParticipant.id}
                            type="employee"
                            name={employeeParticipant.name}
                        />
                    ))}
                </div>

                {canManageParticipants ? (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                size="lg"
                                disabled={!selectedChat}
                            >
                                <UserPlus />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Aggiungi un partecipante</p>
                        </TooltipContent>
                    </Tooltip>
                ) : null}
            </div>
        </CardHeader>
    );
}
