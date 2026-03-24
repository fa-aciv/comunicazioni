import { ArrowUp, File, Paperclip, X } from 'lucide-react';
import { type ChangeEventHandler } from 'react';

import { ButtonGroup } from '@/components/ui/button-group';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupText,
    InputGroupTextarea,
} from '@/components/ui/input-group';

type Attachment = {
    id: string | number;
    name: string;
};

type ChatMessageComposerProps = {
    id?: string;
    name?: string;
    placeholder?: string;
    attachments?: Attachment[];
    value?: string;
    onChange?: ChangeEventHandler<HTMLTextAreaElement>;
    onAttachClick?: () => void;
    onSendClick?: () => void;
    onRemoveAttachment?: (id: Attachment['id']) => void;
    className?: string;
    disabled?: boolean;
};

export function ChatMessageTextarea({
    id = 'message-textarea',
    name,
    placeholder = 'Scrivi un messaggio...',
    attachments = [],
    value,
    onChange,
    onAttachClick,
    onSendClick,
    onRemoveAttachment,
    className,
    disabled = false,
}: ChatMessageComposerProps) {
    return (
        <InputGroup className={className}>
            <InputGroupTextarea
                id={id}
                name={name}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                disabled={disabled}
            />

            <InputGroupAddon align="block-end">
                <ButtonGroup className="ml-auto">
                    <InputGroupButton
                        variant="outline"
                        size="sm"
                        onClick={onAttachClick}
                        disabled={disabled}
                        type="button"
                    >
                        <Paperclip />
                        Allega un file
                    </InputGroupButton>

                    <InputGroupButton
                        variant="default"
                        size="sm"
                        onClick={onSendClick}
                        disabled={disabled}
                        type="button"
                    >
                        Invia
                        <ArrowUp />
                    </InputGroupButton>
                </ButtonGroup>
            </InputGroupAddon>

            {attachments.length > 0 && (
                <InputGroupAddon align="block-end" className="flex flex-wrap gap-2">
                    {attachments.map((file) => (
                        <InputGroupText
                            key={file.id}
                            className="flex items-center gap-2"
                        >
                            <File className="size-4" />
                            <span className="truncate max-w-40">
                                {file.name}
                            </span>

                            {onRemoveAttachment && (
                                <button
                                    type="button"
                                    onClick={() => onRemoveAttachment(file.id)}
                                    className="ml-1 opacity-70 hover:opacity-100"
                                >
                                    <X className="size-3" />
                                </button>
                            )}
                        </InputGroupText>
                    ))}
                </InputGroupAddon>
            )}
        </InputGroup>
    );
}
