import { cn } from "@/lib/utils";
import { Badge } from "../badge";
import { Cross, UserRound } from "lucide-react";

type ParticipantType = "employee" | "citizen";

type ParticipantBadgeProps = {
    name: string;
    type: ParticipantType;
    className?: string;
};

export default function ParticipantBadge({ name, type, className }: ParticipantBadgeProps) {
    const isEmployee = type === "employee";

    return (
        <Badge
            variant="outline"
            className={cn(
                "flex items-center gap-1.5",
                className
            )}
        >
            {isEmployee ? <UserRound size={14} /> : <Cross size={14} />}
            <span className="capitalize">{name.toLowerCase()}</span>
        </Badge>
    );
}