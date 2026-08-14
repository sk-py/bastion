import { useState } from "react";
import { 
  Server, 
  Activity, 
  Users, 
  HardDrive, 
  Terminal, 
  ArrowRight, 
  Play, 
  FolderKey,
  ShieldCheck,
  Clock
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell, ResponsiveContainer } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// --- Mock Data ---
const activityData = [
  { date: "Aug 06", sessions: 12, recordings: 4 },
  { date: "Aug 07", sessions: 18, recordings: 7 },
  { date: "Aug 08", sessions: 15, recordings: 5 },
  { date: "Aug 09", sessions: 24, recordings: 12 },
  { date: "Aug 10", sessions: 10, recordings: 2 },
  { date: "Aug 11", sessions: 32, recordings: 18 },
  { date: "Aug 12", sessions: 28, recordings: 14 },
];

const osDistribution = [
  { name: "Ubuntu", value: 14, color: "var(--color-ubuntu)" },
  { name: "Debian", value: 6, color: "var(--color-debian)" },
  { name: "CentOS", value: 4, color: "var(--color-centos)" },
];

const recentSessions = [
  { id: "1", server: "Actify-Prod", user: "Alexander M.", duration: "44s", status: "completed", time: "10 mins ago" },
  { id: "2", server: "DB-Primary", user: "Edward K.", duration: "1h 12m", status: "active", time: "Active Now" },
  { id: "3", server: "Cache-Node", user: "System Admin", duration: "2m 15s", status: "completed", time: "2 hours ago" },
  { id: "4", server: "Jenkins-CI", user: "Jamison W.", duration: "45m", status: "completed", time: "5 hours ago" },
];

// --- Shadcn Chart Config ---
const chartConfig = {
  sessions: { label: "Sessions", theme: { light: "var(--primary)", dark: "var(--primary)" } },
  recordings: { label: "Recordings", theme: { light: "var(--secondary)", dark: "var(--secondary)" } },
  ubuntu: { label: "Ubuntu", theme: { light: "var(--chart-1)", dark: "var(--chart-1)" } },
  debian: { label: "Debian", theme: { light: "var(--chart-2)", dark: "var(--chart-2)" } },
  centos: { label: "CentOS", theme: { light: "var(--chart-3)", dark: "var(--chart-3)" } },
};

export default function DashboardPage() {
  return (
    <div className="p-8 w-full bg-background min-h-screen text-foreground space-y-8">
      
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back. Here is what's happening across your infrastructure today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-background shadow-sm">
            View Audit Logs
          </Button>
          <Button className="shadow-sm">
            <Terminal className="w-4 h-4 mr-2" />
            Quick Connect
          </Button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Servers</CardTitle>
            <Server className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-emerald-500 flex items-center mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" /> 21 Online
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Sessions</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground mt-1">Across 2 servers right now</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Team Members</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">35</div>
            <p className="text-xs text-muted-foreground mt-1">4 pending invites</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Storage Used</CardTitle>
            <HardDrive className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14.2 GB</div>
            <p className="text-xs text-muted-foreground mt-1">Local Provider • 1,204 Recordings</p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        
        {/* Activity Area Chart (Spans 4 cols) */}
        <Card className="lg:col-span-4 shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle className="text-base font-semibold">SSH Activity</CardTitle>
            <CardDescription>Session and recording volume over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-[250px]">
            <ChartContainer config={chartConfig} className="w-full h-full">
              <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                <XAxis 
                  dataKey="date" 
                  tickLine={false} 
                  axisLine={false} 
                  tickMargin={8} 
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  tickMargin={8} 
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="recordings"
                  stroke="var(--color-recordings)"
                  fill="url(#fillRecordings)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="sessions"
                  stroke="var(--color-sessions)"
                  fill="url(#fillSessions)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* OS Distribution Donut Chart (Spans 3 cols) */}
        <Card className="lg:col-span-3 shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle className="text-base font-semibold">OS Distribution</CardTitle>
            <CardDescription>Operating systems across your fleet</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-[250px] flex items-center justify-center">
            <ChartContainer config={chartConfig} className="w-full h-full max-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <ChartTooltip cursor={true}  content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={osDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    stroke="var(--background)"
                    strokeWidth={4}
                  >
                    {osDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* 4. Bottom Row: Quick Links & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Module Navigation Cards */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Quick Navigation</h3>
          
          <a href="/servers" className="group flex items-center justify-between p-4 bg-card border rounded-xl hover:border-primary/50 hover:bg-muted/30 transition-all shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-sm">Server Fleet</p>
                <p className="text-xs text-muted-foreground">Manage IPs & Auth</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </a>

          <a href="/groups" className="group flex items-center justify-between p-4 bg-card border rounded-xl hover:border-primary/50 hover:bg-muted/30 transition-all shadow-sm">
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
          </a>

          <a href="/users" className="group flex items-center justify-between p-4 bg-card border rounded-xl hover:border-primary/50 hover:bg-muted/30 transition-all shadow-sm">
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
          </a>
        </div>

        {/* Recent Sessions Table */}
        <Card className="lg:col-span-2 shadow-sm flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-semibold">Recent Sessions</CardTitle>
              <CardDescription>Latest SSH activity across your infrastructure</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-xs">
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
                {recentSessions.map((session) => (
                  <TableRow key={session.id} className="hover:bg-muted/40">
                    <TableCell className="pl-6">
                      <div className="font-medium text-sm">{session.server}</div>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                        <Clock className="w-3 h-3" /> {session.time}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                            {session.user.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{session.user}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-mono text-muted-foreground">{session.duration}</span>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      {session.status === "active" ? (
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium text-emerald-500 bg-emerald-500/10 border border-emerald-500/20">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          Live
                        </div>
                      ) : (
                        <Button variant="secondary" size="sm" className="h-7 text-xs bg-muted/50 hover:bg-muted">
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