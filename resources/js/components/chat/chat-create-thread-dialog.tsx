import { useForm } from '@inertiajs/react';
import { MessageSquarePlus } from 'lucide-react';
import { useState } from 'react';

import InputError from '@/components/input-error';
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

interface ChatCreateThreadDialogProps {
    buildThreadStoreUrl: () => string;
}

export function ChatCreateThreadDialog({
    buildThreadStoreUrl,
}: ChatCreateThreadDialogProps) {
    const [open, setOpen] = useState(false);
    const createThreadForm = useForm({
        title: '',
        citizen_identifier: '',
    });

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);

        if (!nextOpen) {
            createThreadForm.reset();
            createThreadForm.clearErrors();
        }
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
