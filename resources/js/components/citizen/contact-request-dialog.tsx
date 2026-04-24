import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';
import { LifeBuoy } from 'lucide-react';

export interface ContactRequestGroup {
    id: number;
    name: string;
    description: string | null;
}

interface ContactRequestDialogProps {
    groups: ContactRequestGroup[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    storeUrl: string;
}

export function ContactRequestDialog({
    groups,
    open,
    onOpenChange,
    storeUrl,
}: ContactRequestDialogProps) {
    const form = useForm<{
        group_id: string;
        subject: string;
        message: string;
    }>({
        group_id: '',
        subject: '',
        message: '',
    });

    const selectedGroup = groups.find((group) => String(group.id) === form.data.group_id);

    function handleOpenChange(nextOpen: boolean) {
        onOpenChange(nextOpen);

        if (nextOpen) {
            form.clearErrors();
            form.setData({
                group_id: '',
                subject: '',
                message: '',
            });
        }
    }

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        form.post(storeUrl, {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                onOpenChange(false);
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                        <LifeBuoy className="size-5" />
                    </div>
                    <DialogTitle>Nuova richiesta di contatto</DialogTitle>
                    <DialogDescription>
                        Scegli il gruppo destinatario e descrivi perché desideri essere contattato.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid gap-2">
                        <Label>Gruppo destinatario</Label>
                        <Select
                            value={form.data.group_id}
                            onValueChange={(value) => form.setData('group_id', value)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Seleziona un gruppo" />
                            </SelectTrigger>
                            <SelectContent>
                                {groups.map((group) => (
                                    <SelectItem key={group.id} value={String(group.id)}>
                                        {group.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={form.errors.group_id} />
                        {selectedGroup ? (
                            <p className="text-sm text-muted-foreground">
                                {selectedGroup.description || 'Nessuna descrizione disponibile.'}
                            </p>
                        ) : null}
                    </div>

                    {selectedGroup ? (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="contact-request-message">
                                    Descrizione della richiesta
                                </Label>
                                <Textarea
                                    id="contact-request-message"
                                    value={form.data.message}
                                    onChange={(event) => form.setData('message', event.currentTarget.value)}
                                    placeholder="Descrivi il motivo della richiesta e le informazioni utili per il gruppo."
                                    required
                                />
                                <InputError message={form.errors.message} />
                            </div>

                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">
                                        Annulla
                                    </Button>
                                </DialogClose>
                                <Button type="submit" disabled={form.processing}>
                                    Invia richiesta
                                    {form.processing ? <Spinner /> : null}
                                </Button>
                            </DialogFooter>
                        </>
                    ) : null}
                </form>
            </DialogContent>
        </Dialog>
    );
}
