import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ArrowLeft, Play } from "lucide-react";
import { RecordingModal } from "./components/recordingModal";
import { api } from "@/api/axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Session, SessionProvider } from "@/api/sessions";

interface Server {
    id: string;
    name: string;
    host: string;
    username: string;
    operatingSystem: string;
    lastConnectedAt: string | null;
}


export const SessionsPage = () => {
    const [selectedServer, setSelectedServer] = useState<Server | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [activePlaybackSession, setActivePlaybackSession] = useState<Session | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const { data: servers = [], isLoading: loadingServers } = useQuery({
        queryKey: ["servers", "all"],
        queryFn: async () => {
            const response = await api.get("/server/all");
            return response.data.data as Server[];
        },
    });

    const { data: sessions = [], isLoading: loadingSessions } = useQuery({
        queryKey: ["sessions", selectedServer?.id],
        queryFn: async () => {
            const response = await api.get(`/sessions?serverId=${selectedServer?.id}`);
            return response.data.data as Session[];
        },
        enabled: !!selectedServer?.id,
    });

    const totalSessions = sessions.length;
    const totalDurationSeconds = sessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);

    const formatTotalDuration = (sec: number) => {
        const hours = Math.floor(sec / 3600);
        const mins = Math.floor((sec % 3600) / 60);
        return `${hours}h ${mins}m`;
    };

    const lastSessionTime = sessions[0]?.startedAt
        ? new Date(sessions[0].startedAt).toLocaleString("en-US", {
            month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
        })
        : "N/A";

    const filteredServers = servers.filter((s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.host.includes(searchQuery)
    );

    const totalPages = Math.ceil(sessions.length / pageSize) || 1;
    const paginatedSessions = sessions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const formatDuration = (sec: number) => {
        if (sec < 60) return `${sec}s`;
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}m ${s}s`;
    };

    // ==================== VIEW 1: SERVER SELECTION LIST ====================
    if (!selectedServer) {
        return (
            <div className="p-6 bg-background min-h-screen text-foreground">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold">Sessions</h1>
                        <p className="text-sm text-muted-foreground">Select a server to view active connections and session recordings</p>
                    </div>
                </div>

                <div className="flex justify-between items-center mb-4 gap-4">
                    <div className="relative w-80">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search servers..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="border rounded-lg bg-card overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>Server Name</TableHead>
                                <TableHead>Host IP</TableHead>
                                <TableHead>OS</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Last Connection</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loadingServers ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Loading servers...</TableCell></TableRow>
                            ) : filteredServers.map((server) => (
                                <TableRow key={server.id} className="hover:bg-muted/50">
                                    <TableCell className="font-medium text-foreground">{server.name}</TableCell>
                                    <TableCell className="font-mono text-sm text-muted-foreground">{server.host}</TableCell>
                                    <TableCell>{server.operatingSystem || "Unknown"}</TableCell>
                                    <TableCell>
                                        <span className={`text-xs ${server.lastConnectedAt ? 'text-green-500' : 'text-muted-foreground'}`}>
                                            {server.lastConnectedAt ? 'Connected' : 'Never Connected'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {server.lastConnectedAt ? new Date(server.lastConnectedAt).toLocaleString() : "—"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedServer(server);
                                                setCurrentPage(1);
                                            }}
                                        >
                                            View Sessions
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredServers.length === 0 && !loadingServers && (
                                <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No servers found.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        );
    }

    // ==================== VIEW 2: SERVER SESSIONS LIST ====================
    return (
        <div className="p-6 bg-background min-h-screen text-foreground">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <span role="button" className="cursor-pointer" onClick={() => setSelectedServer(null)}>Sessions</span>
                        <span>/</span>
                        <span className="text-foreground">{selectedServer.name}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                        <h1 className="text-2xl font-semibold">{selectedServer.name}</h1>
                        <span className="font-mono text-xs px-2 py-1 rounded bg-muted text-muted-foreground border">
                            {selectedServer.host}
                        </span>
                    </div>
                </div>

                <Button variant="outline" onClick={() => setSelectedServer(null)}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Servers
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-card border rounded-xl">
                    <span className="text-sm text-muted-foreground font-medium">Total Sessions</span>
                    <p className="text-2xl font-bold mt-1">{totalSessions}</p>
                </div>
                <div className="p-4 bg-card border rounded-xl">
                    <span className="text-sm text-muted-foreground font-medium">Total Duration</span>
                    <p className="text-2xl font-bold mt-1">{formatTotalDuration(totalDurationSeconds)}</p>
                </div>
                <div className="p-4 bg-card border rounded-xl">
                    <span className="text-sm text-muted-foreground font-medium">Last Session</span>
                    <p className="text-sm font-semibold mt-2 truncate">{lastSessionTime}</p>
                </div>
                {/* <div className="p-4 bg-card border rounded-xl">
                    <span className="text-sm text-muted-foreground font-medium">Connected Users</span>
                    <p className="text-2xl font-bold text-green-500 mt-1">{connectedUsersCount}</p>
                </div> */}
            </div>

            <div className="border rounded-lg bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead>Start Time</TableHead>
                            <TableHead>End Time</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>IP Address</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loadingSessions ? (
                            <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">Loading sessions...</TableCell></TableRow>
                        ) : paginatedSessions.map((s) => (
                            <TableRow key={s.id} className="hover:bg-muted/50">
                                <TableCell className="font-mono text-sm">{new Date(s.startedAt).toLocaleString()}</TableCell>
                                <TableCell className="font-mono text-sm text-muted-foreground">
                                    {s.endedAt ? new Date(s.endedAt).toLocaleString() : "Active"}
                                </TableCell>
                                <TableCell className="font-medium">{s.userName || "Unknown"}</TableCell>
                                <TableCell className="font-mono text-sm text-muted-foreground">{s.ipAddress || "::1"}</TableCell>
                                <TableCell className="text-sm">{formatDuration(s.durationSeconds || 0)}</TableCell>
                                <TableCell>
                                    <span className={`text-xs ${s.status === "completed" ? "text-green-500" : "text-destructive"}`}>
                                        {s.status === "completed" ? "Completed" : "Terminated"}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant={s.status === "completed" ? "secondary" : "ghost"}
                                        size="sm"
                                        disabled={s.status !== "completed"}
                                        onClick={() =>
                                            setActivePlaybackSession({ ...s })
                                        }
                                    >
                                        <Play className="w-3 h-3 mr-2" />
                                        Play
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {sessions.length === 0 && !loadingSessions && (
                            <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">No session recordings found.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>

                {sessions.length > 0 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/20 text-sm text-muted-foreground">
                        <div>
                            Showing {(currentPage - 1) * pageSize + 1} to{" "}
                            {Math.min(currentPage * pageSize, sessions.length)} of {sessions.length} sessions
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <RecordingModal
                isOpen={!!activePlaybackSession}
                onClose={() => setActivePlaybackSession(null)}
                session={activePlaybackSession}
            />
        </div>
    );
};