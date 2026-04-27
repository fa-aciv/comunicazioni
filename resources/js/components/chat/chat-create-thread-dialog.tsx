import { useForm } from '@inertiajs/react';
import { MessageSquarePlus } from 'lucide-react';
import { useState } from 'react';

import InputError from '@/components/input-error';
import type { ChatGroupSummary } from '@/components/chat/chat-types';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ChatCreateThreadDialogProps {
    buildThreadStoreUrl: () => string;
    availableGroups: ChatGroupSummary[];
}

export function ChatCreateThreadDialog({
    buildThreadStoreUrl,
    availableGroups,
}: ChatCreateThreadDialogProps) {
    const [open, setOpen] = useState(false);
    const defaultGroupId =
        availableGroups.length === 1 ? String(availableGroups[0].id) : '';
    const createThreadForm = useForm({
        title: '',
        citizen_identifier: '',
        group_id: defaultGroupId,
    });
    const selectedGroup =
        availableGroups.find(
            (group) => String(group.id) === createThreadForm.data.group_id,
        ) ?? null;

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);

        createThreadForm.reset();
        createThreadForm.setData({
            title: '',
            citizen_identifier: '',
            group_id: defaultGroupId,
        });
        createThreadForm.clearErrors();
    };

    const handleSubmit = () => {
        createThreadForm.post(buildThreadStoreUrl(), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setOpen(false);
                createThreadForm.reset();
                createThreadForm.clearErrors();
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                    <MessageSquarePlus />
                    Nuova chat
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Nuova conversazione</DialogTitle>
                    <DialogDescription>
                        Crea una nuova conversazione indicando il cittadino tramite email, telefono o codice fiscale.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                    <div className="space-y-2">
                        {availableGroups.length > 0 ? (
                            <>
                                <label className="text-sm font-medium">
                                    Gruppo
                                </label>
                                <Select
                                    value={createThreadForm.data.group_id}
                                    onValueChange={(value) =>
                                        createThreadForm.setData('group_id', value)
                                    }
                                    disabled={
                                        createThreadForm.processing ||
                                        availableGroups.length === 1
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Seleziona un gruppo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableGroups.map((group) => (
                                            <SelectItem
                                                key={group.id}
                                                value={String(group.id)}
                                            >
                                                {group.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={createThreadForm.errors.group_id} />
                                {selectedGroup ? (
                                    <p className="text-sm text-muted-foreground">
                                        La retention della chat seguira la policy del gruppo{' '}
                                        <span className="font-medium text-foreground">
                                            {selectedGroup.name}
                                        </span>
                                        .
                                    </p>
                                ) : null}
                            </>
                        ) : (
                            <div className="rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground">
                                Non appartieni a nessun gruppo: questa chat usera la retention globale.
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="chat-title"
                            className="text-sm font-medium"
                        >
                            Titolo
                        </label>
                        <Input
                            id="chat-title"
                            value={createThreadForm.data.title}
                            onChange={(event) =>
                                createThreadForm.setData('title', event.currentTarget.value)
                            }
                            placeholder="Titolo opzionale"
                            disabled={createThreadForm.processing}
                        />
                        <InputError message={createThreadForm.errors.title} />
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="citizen-identifier"
                            className="text-sm font-medium"
                        >
                            Cittadino
                        </label>
                        <Input
                            id="citizen-identifier"
                            value={createThreadForm.data.citizen_identifier}
                            onChange={(event) =>
                                createThreadForm.setData(
                                    'citizen_identifier',
                                    event.currentTarget.value,
                                )
                            }
                            placeholder="Email, telefono o codice fiscale"
                            disabled={createThreadForm.processing}
                        />
                        <InputError
                            message={
                                createThreadForm.errors.citizen_identifier ??
                                createThreadForm.errors.citizen_email ??
                                createThreadForm.errors.citizen_phone_number ??
                                createThreadForm.errors.citizen_fiscal_code
                            }
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={
                            !createThreadForm.data.citizen_identifier.trim() ||
                            (availableGroups.length > 0 &&
                                createThreadForm.data.group_id.trim() === '') ||
                            createThreadForm.processing
                        }
                    >
                        Crea chat
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
