import { File } from 'lucide-react';
import { type ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { Item } from '../item';

type MessageAttachmentSummary = {
    id: number | string;
    file_name: string;
    download_url: string;
};

type MessageBubbleProps = {
    children?: ReactNode;
    variant?: 'author' | 'other';
    authorName: string;
    timestamp: string;
    attachments?: MessageAttachmentSummary[];
};

export default function MessageBubble({
    children,
    variant = 'other',
    authorName,
    timestamp,
    attachments = [],
}: MessageBubbleProps) {
    const isAuthor = variant === 'author';

    return (
        <div className={cn(isAuthor ? 'self-end' : 'self-start', 'w-2/3 flex flex-col')}>
            <Item
                className={cn(
                    'bg-card border shadow-xs flex flex-col gap-1',
                    isAuthor
                        ? 'rounded-br-none border-amber-200 bg-amber-50 dark:border-amber-950/50 dark:bg-amber-950/80'
                        : 'rounded-bl-none border-gray-200 dark:border-card dark:bg-gray-700/50',
                )}
            >
                <div className="self-start text-sm flex flex-row w-full items-center justify-between">
                    <span className="font-semibold capitalize">{authorName.toLowerCase()}</span>{' '}
                    <span className="text-xs font-light text-muted-foreground">{timestamp}</span>
                </div>

                {children ? (
                    <div className="text-sm self-start">
                        {children}
                    </div>
                ) : null}

                {attachments.length > 0 ? (
                    <div className="flex flex-row flex-wrap w-full justify-end gap-1 py-2">
                        {attachments.map((attachment) => (
                            <MessageAttachment
                                key={attachment.id}
                                attachment={attachment}
                                isAuthor={isAuthor}
                            />
                        ))}
                    </div>
                ) : null}
            </Item>
        </div>
    );
}

type MessageAttachmentProps = {
    attachment: MessageAttachmentSummary;
    isAuthor?: boolean;
};

function MessageAttachment({ attachment, isAuthor = false }: MessageAttachmentProps) {
    return (
        <Item
            asChild
            variant="outline"
            className={cn(
                'w-auto border border-border bg-card p-1 px-2 shadow-xs',
                isAuthor && 'border-amber-700/20',
                'flex flex-row flex-nowrap gap-1 rounded-sm justify-start align-top'
            )}
        >
            <a href={attachment.download_url} className="flex flex-row" target="_blank" rel="noreferrer">
                <File size={16} /> <span>{attachment.file_name}</span>
            </a>
        </Item>
    );
}
