import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
import { Search, ArrowLeft, Play } from "lucide-react";

import { RecordingModal } from "./components/recordingModal";
import { api } from "@/api/axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { Session } from "@/api/sessions";

interface Server {
  id: string;
  name: string;
  host: string;
  username: string;
  operatingSystem: string | null;
  lastConnectedAt: string | null;
}

export const SessionsPage = () => {
  const [searchParams, setSearchParams] =
    useSearchParams();

  const serverId = searchParams.get("serverId");

  const [searchQuery, setSearchQuery] = useState("");
  const [activePlaybackSession, setActivePlaybackSession] =
    useState<Session | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 10;

  /*
   * ------------------------------------------------------------
   * Accessible servers
   * ------------------------------------------------------------
   */

  const {
    data: servers = [],
    isLoading: loadingServers,
    isError: serversError,
  } = useQuery({
    queryKey: ["servers", "all"],
    queryFn: async () => {
      const response = await api.get("/server/all");

      return response.data.data as Server[];
    },
  });

  /*
   * ------------------------------------------------------------
   * Selected server
   *
   * The URL is the source of truth.
   *
   * /sessions
   * /sessions?serverId=<id>
   * ------------------------------------------------------------
   */

  const selectedServer = useMemo(() => {
    if (!serverId) {
      return null;
    }

    return (
      servers.find(
        (server) => server.id === serverId,
      ) ?? null
    );
  }, [servers, serverId]);

  /*
   * ------------------------------------------------------------
   * Sessions
   * ------------------------------------------------------------
   */

  const {
    data: sessions = [],
    isLoading: loadingSessions,
    isError: sessionsError,
  } = useQuery({
    queryKey: ["sessions", serverId],
    queryFn: async () => {
      if (!serverId) {
        return [] as Session[];
      }

      const response = await api.get(
        `/sessions?serverId=${encodeURIComponent(serverId)}`,
      );

      return response.data.data as Session[];
    },
    enabled: !!serverId,
  });

  /*
   * Reset pagination whenever the server changes.
   */

  useEffect(() => {
    setCurrentPage(1);
  }, [serverId]);

  /*
   * ------------------------------------------------------------
   * Derived values
   * ------------------------------------------------------------
   */

  const filteredServers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return servers;
    }

    return servers.filter(
      (server) =>
        server.name.toLowerCase().includes(query) ||
        server.host.toLowerCase().includes(query),
    );
  }, [servers, searchQuery]);

  const totalSessions = sessions.length;

  const totalDurationSeconds = sessions.reduce(
    (acc, session) =>
      acc + (session.durationSeconds || 0),
    0,
  );

  const formatTotalDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor(
      (seconds % 3600) / 60,
    );

    return `${hours}h ${minutes}m`;
  };

  const lastSessionTime = sessions[0]?.startedAt
    ? new Date(
        sessions[0].startedAt,
      ).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "N/A";

  const totalPages =
    Math.ceil(sessions.length / pageSize) || 1;

  const paginatedSessions = sessions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const formatDuration = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}m ${remainingSeconds}s`;
  };

  /*
   * ------------------------------------------------------------
   * Server selection helpers
   * ------------------------------------------------------------
   */

  const openServerSessions = (
    selectedServerId: string,
  ) => {
    setCurrentPage(1);

    setSearchParams({
      serverId: selectedServerId,
    });
  };

  const clearSelectedServer = () => {
    setCurrentPage(1);

    setSearchParams({});
  };

  /*
   * ------------------------------------------------------------
   * VIEW 1
   *
   * /sessions
   * ------------------------------------------------------------
   */

  if (!serverId) {
    return (
      <div className="p-6 bg-background min-h-screen text-foreground">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-semibold">
              Sessions
            </h1>

            <p className="text-sm text-muted-foreground">
              Select a server to view active connections
              and session recordings.
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4 gap-4">
          <div className="relative w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />

            <Input
              placeholder="Search servers..."
              className="pl-9"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
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
                <TableHead className="text-right">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loadingServers ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-6 text-muted-foreground"
                  >
                    Loading servers...
                  </TableCell>
                </TableRow>
              ) : serversError ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-6 text-destructive"
                  >
                    Failed to load servers.
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {filteredServers.map((server) => (
                    <TableRow
                      key={server.id}
                      className="hover:bg-muted/50"
                    >
                      <TableCell className="font-medium text-foreground">
                        {server.name}
                      </TableCell>

                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {server.host}
                      </TableCell>

                      <TableCell>
                        {server.operatingSystem ||
                          "Unknown"}
                      </TableCell>

                      <TableCell>
                        <span
                          className={`text-xs ${
                            server.lastConnectedAt
                              ? "text-green-500"
                              : "text-muted-foreground"
                          }`}
                        >
                          {server.lastConnectedAt
                            ? "Connected"
                            : "Never Connected"}
                        </span>
                      </TableCell>

                      <TableCell className="text-muted-foreground">
                        {server.lastConnectedAt
                          ? new Date(
                              server.lastConnectedAt,
                            ).toLocaleString()
                          : "—"}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            openServerSessions(
                              server.id,
                            )
                          }
                        >
                          View Sessions
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {filteredServers.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-6 text-muted-foreground"
                      >
                        No servers found.
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  /*
   * ------------------------------------------------------------
   * URL contains serverId but server list is still loading.
   * ------------------------------------------------------------
   */

  if (loadingServers) {
    return (
      <div className="p-6 bg-background min-h-screen text-foreground">
        <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
          Loading server...
        </div>
      </div>
    );
  }

  /*
   * ------------------------------------------------------------
   * URL contains a serverId that isn't accessible.
   *
   * Do not call/render its sessions.
   * ------------------------------------------------------------
   */

  if (!selectedServer) {
    return (
      <div className="p-6 bg-background min-h-screen text-foreground">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <h1 className="text-xl font-semibold">
            Server not found
          </h1>

          <p className="text-sm text-muted-foreground mt-2">
            This server does not exist or you do not have
            access to it.
          </p>

          <Button
            variant="outline"
            className="mt-6"
            onClick={clearSelectedServer}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Servers
          </Button>
        </div>
      </div>
    );
  }

  /*
   * ------------------------------------------------------------
   * VIEW 2
   *
   * /sessions?serverId=<id>
   * ------------------------------------------------------------
   */

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <button
              type="button"
              className="cursor-pointer hover:text-foreground"
              onClick={clearSelectedServer}
            >
              Sessions
            </button>

            <span>/</span>

            <span className="text-foreground">
              {selectedServer.name}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl font-semibold">
              {selectedServer.name}
            </h1>

            <span className="font-mono text-xs px-2 py-1 rounded bg-muted text-muted-foreground border">
              {selectedServer.host}
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={clearSelectedServer}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Servers
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-card border rounded-xl">
          <span className="text-sm text-muted-foreground font-medium">
            Total Sessions
          </span>

          <p className="text-2xl font-bold mt-1">
            {totalSessions}
          </p>
        </div>

        <div className="p-4 bg-card border rounded-xl">
          <span className="text-sm text-muted-foreground font-medium">
            Total Duration
          </span>

          <p className="text-2xl font-bold mt-1">
            {formatTotalDuration(
              totalDurationSeconds,
            )}
          </p>
        </div>

        <div className="p-4 bg-card border rounded-xl">
          <span className="text-sm text-muted-foreground font-medium">
            Last Session
          </span>

          <p className="text-sm font-semibold mt-2 truncate">
            {lastSessionTime}
          </p>
        </div>
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
              <TableHead className="text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loadingSessions ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-6 text-muted-foreground"
                >
                  Loading sessions...
                </TableCell>
              </TableRow>
            ) : sessionsError ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-6 text-destructive"
                >
                  Failed to load session recordings.
                </TableCell>
              </TableRow>
            ) : (
              <>
                {paginatedSessions.map((session) => (
                  <TableRow
                    key={session.id}
                    className="hover:bg-muted/50"
                  >
                    <TableCell className="font-mono text-sm">
                      {new Date(
                        session.startedAt,
                      ).toLocaleString()}
                    </TableCell>

                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {session.endedAt
                        ? new Date(
                            session.endedAt,
                          ).toLocaleString()
                        : "Active"}
                    </TableCell>

                    <TableCell className="font-medium">
                      {session.userName || "Unknown"}
                    </TableCell>

                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {session.ipAddress || "::1"}
                    </TableCell>

                    <TableCell className="text-sm">
                      {formatDuration(
                        session.durationSeconds || 0,
                      )}
                    </TableCell>

                    <TableCell>
                      <span
                        className={`text-xs ${
                          session.status ===
                          "completed"
                            ? "text-green-500"
                            : "text-destructive"
                        }`}
                      >
                        {session.status ===
                        "completed"
                          ? "Completed"
                          : "Terminated"}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant={
                          session.status ===
                          "completed"
                            ? "secondary"
                            : "ghost"
                        }
                        size="sm"
                        disabled={
                          session.status !==
                          "completed"
                        }
                        onClick={() =>
                          setActivePlaybackSession({
                            ...session,
                          })
                        }
                      >
                        <Play className="w-3 h-3 mr-2" />
                        Play
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {sessions.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-6 text-muted-foreground"
                    >
                      No session recordings found.
                    </TableCell>
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>

        {sessions.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/20 text-sm text-muted-foreground">
            <div>
              Showing{" "}
              {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(
                currentPage * pageSize,
                sessions.length,
              )}{" "}
              of {sessions.length} sessions
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.max(page - 1, 1),
                  )
                }
                disabled={currentPage === 1}
              >
                Previous
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.min(
                      page + 1,
                      totalPages,
                    ),
                  )
                }
                disabled={
                  currentPage === totalPages
                }
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <RecordingModal
        isOpen={!!activePlaybackSession}
        onClose={() =>
          setActivePlaybackSession(null)
        }
        session={activePlaybackSession}
      />
    </div>
  );
};