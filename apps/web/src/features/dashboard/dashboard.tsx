import { useQuery } from "@tanstack/react-query";
import { 
  Server, Activity, Users, HardDrive, Terminal, ArrowRight, Play, FolderKey, ShieldCheck, Clock 
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell, ResponsiveContainer } from "recharts";
import { formatDistanceToNow } from "date-fns";

import { api } from "@/api/axios";
import { useCurrentUser } from "../auth/hooks/use-current-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router";

const chartConfig = {
  sessions: { label: "Sessions", theme: { light: "var(--primary)", dark: "var(--primary)" } },
  recordings: { label: "Recordings", theme: { light: "var(--secondary)", dark: "var(--secondary)" } },
  ubuntu: { label: "Ubuntu", theme: { light: "var(--chart-1)", dark: "var(--chart-1)" } },
  debian: { label: "Debian", theme: { light: "var(--chart-2)", dark: "var(--chart-2)" } },
  centos: { label: "CentOS", theme: { light: "var(--chart-3)", dark: "var(--chart-3)" } },
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUser();
  
  const canManageWorkspace = currentUser?.role === "owner" || currentUser?.role === "admin";

  const { data: dashboardData, isLoading, isError } = useQuery({
    queryKey: ["dashboard", "metrics"],
    queryFn: async () => {
      const response = await api.get("/dashboard/metrics");
      return response.data;
    },
  });

  const formatBytes = (bytes: number) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatDuration = (sec: number | null | undefined) => {
    if (sec === null || sec === undefined) return "—";
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  if (isLoading) {
    return <div className="p-8 flex items-center justify-center min-h-screen text-muted-foreground">Loading metrics...</div>;
  }

  if (isError || !dashboardData) {
    return <div className="p-8 flex items-center justify-center min-h-screen text-destructive">Failed to load dashboard data.</div>;
  }

  const { metrics, charts, recentSessions } = dashboardData;

  const mappedOsDistribution = (charts.osDistribution || []).reduce((acc: any[], curr: any) => {
    const lower = curr.name.toLowerCase();
    let bucketName = "Other";
    let color = "hsl(var(--muted-foreground))";

    if (lower.includes("ubuntu")) { bucketName = "Ubuntu"; color = "var(--color-ubuntu)"; }
    else if (lower.includes("debian")) { bucketName = "Debian"; color = "var(--color-debian)"; }
    else if (lower.includes("centos")) { bucketName = "CentOS"; color = "var(--color-centos)"; }
    
    const existing = acc.find(a => a.name === bucketName);
    if (existing) {
      existing.value += curr.value;
    } else {
      acc.push({ name: bucketName, value: curr.value, color });
    }
    return acc;
  }, []);

  return (
    <div className="p-8 w-full bg-background min-h-screen text-foreground space-y-8">
      
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back, {currentUser?.name?.split(' ')[0]}. Here is what's happening today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canManageWorkspace && (
            <Button variant="outline" onClick={() => navigate('/audit')} className="bg-background shadow-sm">
              View Audit Logs
            </Button>
          )}
          <Button onClick={() => navigate('/servers')} className="shadow-sm">
            <Terminal className="w-4 h-4 mr-2" />
            Quick Connect
          </Button>
        </div>
      </div>

      {/* 2. Top Metric Cards (Dynamically adjusts grid columns based on role) */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${canManageWorkspace ? 'lg:grid-cols-4' : 'lg:grid-cols-2'}`}>
        <Card className="shadow-sm flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {canManageWorkspace ? "Total Servers" : "Accessible Servers"}
            </CardTitle>
            <Server className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalServers}</div>
            {canManageWorkspace ? (
              <p className="text-xs text-muted-foreground mt-1">Across entire workspace</p>
            ) : (
              <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
                <span className="text-xs text-muted-foreground">Assigned to you</span>
                <button onClick={() => navigate('/servers')} className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                  Connect <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </CardContent>
        </Card>
        
      <Card className="shadow-sm flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {canManageWorkspace ? "Active Sessions" : "Total Connections"}
            </CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {canManageWorkspace ? metrics.activeSessions : metrics.totalSessions}
            </div>
            {canManageWorkspace ? (
              <p className="text-xs text-muted-foreground mt-1">Live right now</p>
            ) : (
              <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
                <span className="text-xs text-muted-foreground">Historical sessions</span>
                <button onClick={() => navigate('/sessions')} className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                  View History <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {canManageWorkspace && (
          <>
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Team Members</CardTitle>
                <Users className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.teamMembers}</div>
                <p className="text-xs text-muted-foreground mt-1">Active accounts</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Storage Used</CardTitle>
                <HardDrive className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatBytes(metrics.storageBytes)}</div>
                <p className="text-xs text-muted-foreground mt-1">Terminal Recordings</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* 3. Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        
        <Card className={`${canManageWorkspace ? 'lg:col-span-4' : 'lg:col-span-7'} shadow-sm flex flex-col`}>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              {canManageWorkspace ? "Workspace Activity" : "Your Activity"}
            </CardTitle>
            <CardDescription>Session and recording volume over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px] p-4 sm:p-6">
            <ChartContainer config={chartConfig} className="w-full h-full">
              <AreaChart data={charts.activity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillSessions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-sessions)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-sessions)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillRecordings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-recordings)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-recordings)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="recordings" stroke="var(--color-recordings)" fill="url(#fillRecordings)" strokeWidth={2} />
                <Area type="monotone" dataKey="sessions" stroke="var(--color-sessions)" fill="url(#fillSessions)" strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {canManageWorkspace && (
          <Card className="lg:col-span-3 shadow-sm flex flex-col">
            <CardHeader>
              <CardTitle className="text-base font-semibold">OS Distribution</CardTitle>
              <CardDescription>Operating systems across your fleet</CardDescription>
            </CardHeader>
            <CardContent className="h-[320px] flex items-center justify-center p-4 sm:p-6">
              <ChartContainer config={chartConfig} className="w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                    <Pie
                      data={mappedOsDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={100}
                      stroke="hsl(var(--background))"
                      strokeWidth={4}
                    >
                      {mappedOsDistribution.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 4. Bottom Row: Quick Links & Recent Activity */}
      <div className={`grid grid-cols-1 gap-6 ${canManageWorkspace ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>
        
        {canManageWorkspace && (
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Quick Navigation</h3>
            
            <button onClick={() => navigate('/servers')} className="w-full text-left group flex items-center justify-between p-4 bg-card border rounded-xl hover:border-primary/50 hover:bg-muted/30 transition-all shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-sm">Server Fleet</p>
                  <p className="text-xs text-muted-foreground">Connect to your servers</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>

            <button onClick={() => navigate('/groups')} className="w-full text-left group flex items-center justify-between p-4 bg-card border rounded-xl hover:border-primary/50 hover:bg-muted/30 transition-all shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                  <FolderKey className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-sm">Access Groups</p>
                  <p className="text-xs text-muted-foreground">RBAC & Server Mapping</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-500 transition-colors" />
            </button>

            <button onClick={() => navigate('/users')} className="w-full text-left group flex items-center justify-between p-4 bg-card border rounded-xl hover:border-primary/50 hover:bg-muted/30 transition-all shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-sm">Team Members</p>
                  <p className="text-xs text-muted-foreground">Manage users & invites</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
            </button>
          </div>
        )}

        <Card className={`${canManageWorkspace ? 'lg:col-span-2' : 'lg:col-span-1'} shadow-sm flex flex-col`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-semibold">Recent Sessions</CardTitle>
              <CardDescription>
                {canManageWorkspace ? "Latest SSH activity across the infrastructure" : "Your recent connections"}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/sessions')} className="text-xs">
              View All <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b-border bg-muted/20">
                  <TableHead className="pl-6 text-xs">Server</TableHead>
                  <TableHead className="text-xs">User</TableHead>
                  <TableHead className="text-xs">Duration</TableHead>
                  <TableHead className="text-right pr-6 text-xs">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground text-sm">No recent sessions found.</TableCell>
                  </TableRow>
                ) : recentSessions.map((session: any) => (
                  <TableRow key={session.id} className="hover:bg-muted/40">
                    <TableCell className="pl-6">
                      <div className="font-medium text-sm">{session.serverName}</div>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                        <Clock className="w-3 h-3" /> {formatDistanceToNow(new Date(session.startedAt), { addSuffix: true })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                            {session.userName?.substring(0, 2).toUpperCase() || "??"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{session.userName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-mono text-muted-foreground">{formatDuration(session.durationSeconds)}</span>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      {session.status === "recording" ? (
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium text-emerald-500 bg-emerald-500/10 border border-emerald-500/20">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          Live
                        </div>
                      ) : (
                        <Button variant="secondary" size="sm" onClick={() => navigate(`/sessions`)} className="h-7 text-xs bg-muted/50 hover:bg-muted">
                          <Play className="w-3 h-3 mr-1.5" /> Replay
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}