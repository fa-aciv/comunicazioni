import { File } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Item } from '../ui/item';

type MessageAttachmentSummary = {
    id: number | string;
    file_name: string;
    download_url: string;
};

type MessageBubbleProps = {
    variant?: 'author' | 'other';
    authorName: string;
    timestamp: string;
    messages: {
        id: number | string;
        content: string;
        detailedTimestamp: string;
        attachments?: MessageAttachmentSummary[];
    }[];
};

export default function MessageBubble({
    variant = 'other',
    authorName,
    timestamp,
    messages,
}: MessageBubbleProps) {
    const isAuthor = variant === 'author';
    const showDetailedTimestampOnHover = messages.length > 1;

    return (
        <div
            className={cn(
                isAuthor ? 'self-end' : 'self-start',
                'flex w-2/3 flex-col',
            )}
        >
            <Item
                className={cn(
                    'bg-card border shadow-xs flex flex-col gap-2',
                    isAuthor
                        ? 'rounded-br-none border-amber-200 bg-amber-50 dark:border-amber-950/50 dark:bg-amber-950/80'
                        : 'rounded-bl-none border-gray-200 dark:border-card dark:bg-gray-700/50',
                )}
            >
                <div className="flex w-full flex-row items-center justify-between self-start text-sm">
                    <span className="font-semibold capitalize">
                        {authorName.toLowerCase()}
                    </span>
                    <span className="text-xs font-light text-muted-foreground">
                        {timestamp}
                    </span>
                </div>

                <div className="flex w-full flex-col gap-2">
                    {messages.map((message, index) => {
                        const showInlineTimestamp =
                            showDetailedTimestampOnHover &&
                            index > 0 &&
                            message.detailedTimestamp;

                        return (
                            <div
                                key={message.id}
                                className={cn(
                                    'group/message flex w-full flex-col gap-2',
                                )}
                            >
                            {message.content ? (
                                <div className="min-w-0 self-start text-sm whitespace-pre-wrap wrap-break-words after:block after:clear-both after:content-['']">
                                    {showInlineTimestamp ? (
                                        <span className="float-right ml-2 hidden whitespace-nowrap text-xs font-light text-muted-foreground group-hover/message:block">
                                            {message.detailedTimestamp}
                                        </span>
                                    ) : null}
                                    {message.content}
                                </div>
                            ) : null}

                            {!message.content && showInlineTimestamp ? (
                                <div className="hidden w-full justify-end group-hover/message:flex">
                                    <span className="shrink-0 text-xs font-light text-muted-foreground">
                                        {message.detailedTimestamp}
                                    </span>
                                </div>
                            ) : null}

                            {message.attachments && message.attachments.length > 0 ? (
                                <div className="flex w-full flex-row flex-wrap justify-end gap-1 py-1">
                                    {message.attachments.map((attachment) => (
                                        <MessageAttachment
                                            key={attachment.id}
                                            attachment={attachment}
                                            isAuthor={isAuthor}
                                        />
                                    ))}
                                </div>
                            ) : null}
                            </div>
                        );
                    })}
                </div>
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
