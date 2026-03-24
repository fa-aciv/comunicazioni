import { useForm } from '@inertiajs/react';
import { type ChangeEvent, useRef } from 'react';

import type { SelectedChatSummary } from '@/components/chat/chat-types';
import InputError from '@/components/input-error';
import { ChatMessageTextarea } from '@/components/chat/chat-message-textarea';
import { Spinner } from '@/components/ui/spinner';

interface ChatComposerProps {
    selectedChat: SelectedChatSummary | null;
    buildMessageStoreUrl: (chatId: number) => string;
}

export function ChatComposer({
    selectedChat,
    buildMessageStoreUrl,
}: ChatComposerProps) {
    const attachmentInputRef = useRef<HTMLInputElement>(null);
    const messageForm = useForm({
        content: '',
        attachments: [] as File[],
    });
    const formErrors = messageForm.errors as Record<string, string | undefined>;
    const attachmentError = Object.entries(formErrors).find(
        ([key]) => key === 'attachments' || key.startsWith('attachments.'),
    )?.[1];
    const isDisabled = !selectedChat || messageForm.processing;

    const handleMessageChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        messageForm.setData('content', event.currentTarget.value);
        messageForm.clearErrors();
    };

    const handleAttachmentSelection = (event: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.currentTarget.files ?? []);

        if (files.length === 0) {
            return;
        }

        messageForm.setData('attachments', [
            ...messageForm.data.attachments,
            ...files,
        ]);
        messageForm.clearErrors();
        event.currentTarget.value = '';
    };

    const handleRemoveAttachment = (attachmentId: string | number) => {
        const index = Number(attachmentId);

        messageForm.setData(
            'attachments',
            messageForm.data.attachments.filter(
                (_, attachmentIndex) => attachmentIndex !== index,
            ),
        );
        messageForm.clearErrors();
    };

    const handleSendMessage = () => {
        if (!selectedChat || messageForm.processing) {
            return;
        }

        messageForm.post(buildMessageStoreUrl(selectedChat.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                messageForm.reset();

                if (attachmentInputRef.current) {
                    attachmentInputRef.current.value = '';
                }
            },
        });
    };

    return (
        <div className="space-y-2">
            <input
                ref={attachmentInputRef}
                type="file"
                accept="application/pdf,image/*"
                multiple
                className="hidden"
                onChange={handleAttachmentSelection}
                disabled={isDisabled}
            />
            <ChatMessageTextarea
                id="chat-message"
                name="content"
                value={messageForm.data.content}
                onChange={handleMessageChange}
                attachments={messageForm.data.attachments.map((attachment, index) => ({
                    id: index,
                    name: attachment.name,
                }))}
                onAttachClick={() => attachmentInputRef.current?.click()}
                onSendClick={handleSendMessage}
                onRemoveAttachment={handleRemoveAttachment}
                disabled={isDisabled}
            />

            {messageForm.processing ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Spinner />
                    Invio in corso...
                </div>
            ) : null}

            <InputError message={formErrors.content ?? formErrors.chat} />
            <InputError message={attachmentError} />
        </div>
    );
}
