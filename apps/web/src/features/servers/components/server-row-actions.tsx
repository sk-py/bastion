import { MoreVertical, Eye, Edit2, Trash2, SquareTerminal, History, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { Server } from "../servers";

export const ServerRowActions = ({ server, canManageServers, onView, onEdit, onDelete, onOpenTerminal, onViewSessions }: {
    server: Server;
    canManageServers: boolean;
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onOpenTerminal: () => void;
    onViewSessions: () => void;
}) => {
    return (
        <DropdownMenu>
            {/* @ts-ignore */}
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                    Actions
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 cursor-pointer">
                <DropdownMenuItem className={"cursor-pointer"} onClick={onOpenTerminal}>
                    <SquareTerminal className="w-4 h-4 mr-2" /> Open Terminal
                </DropdownMenuItem>
                <DropdownMenuItem className={"cursor-pointer"} onClick={onView}>
                    <Eye className="w-4 h-4 mr-2" /> View Details
                </DropdownMenuItem>
                <DropdownMenuItem className={"cursor-pointer"} onClick={onViewSessions}>
                    <History className="w-4 h-4 mr-2" /> View Sessions
                </DropdownMenuItem>
                {canManageServers && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className={"cursor-pointer"} onClick={onEdit}>
                            <Edit2 className="w-4 h-4 mr-2" /> Edit Server
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onDelete} className="text-destructive focus:bg-destructive focus:text-foreground cursor-pointer">
                            <Trash2 className="w-4 h-4 mr-2" /> Delete Server
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}