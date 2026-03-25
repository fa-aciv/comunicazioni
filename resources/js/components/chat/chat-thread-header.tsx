import { ChatAddParticipantDialog } from '@/components/chat/chat-add-participant-dialog';
import type {
    EmployeeSummary,
    SelectedChatSummary,
} from '@/components/chat/chat-types';
import { CardHeader, CardTitle } from '@/components/ui/card';
import ParticipantBadge from '@/components/chat/participant-badge';

interface ChatThreadHeaderProps {
    selectedChat: SelectedChatSummary | null;
    employees: EmployeeSummary[];
    currentActorId: number;
    canManageParticipants: boolean;
    buildParticipantStoreUrl?: (chatId: number) => string;
    buildParticipantDestroyUrl?: (chatId: number, employeeId: number) => string;
}

export function ChatThreadHeader({
    selectedChat,
    employees,
    currentActorId,
    canManageParticipants,
    buildParticipantStoreUrl,
    buildParticipantDestroyUrl,
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
            </div>
        </CardHeader>
    );
}
