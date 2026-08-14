import { useState } from "react";
import { 
  Search, 
  Plus, 
  Users, 
  Server, 
  Trash2, 
  Shield, 
  FolderKey,
  MoreVertical,
  Monitor
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// --- Mock Data ---
const mockGroups = [
  { id: 1, name: "Engineering", description: "Backend, Frontend, and DevOps engineers.", userCount: 12, serverCount: 8 },
  { id: 2, name: "Marketing", description: "Marketing and content team.", userCount: 5, serverCount: 2 },
  { id: 3, name: "Design", description: "UI/UX designers and researchers.", userCount: 4, serverCount: 1 },
  { id: 4, name: "Contractors", description: "External contractors with limited access.", userCount: 15, serverCount: 3 },
];

const mockGroupUsers = [
  { id: 1, name: "Alexander Montgomery", email: "alexander@gmail.com", role: "Editor", initials: "AM" },
  { id: 2, name: "Nathaniel Richardson", email: "nathaniel@gmail.com", role: "Owner", initials: "NR" },
  { id: 4, name: "Edward Kensington", email: "edward@gmail.com", role: "Admin", initials: "EK" },
];

const mockGroupServers = [
  { id: 1, name: "Actify-Prod", host: "10.0.0.4", os: "Ubuntu 22.04", status: "Online" },
  { id: 2, name: "DB-Primary", host: "10.0.0.8", os: "Debian 11", status: "Online" },
  { id: 3, name: "Cache-Node-01", host: "10.0.1.15", os: "Ubuntu 20.04", status: "Offline" },
];

export default function GroupsPage() {
  const [activeGroup, setActiveGroup] = useState(mockGroups[0]);
  const [activeTab, setActiveTab] = useState<"users" | "servers">("users");
  
  // Modal States
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isAssignServerOpen, setIsAssignServerOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="p-8 w-full bg-background min-h-screen text-foreground space-y-6">
      
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Access Groups</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage role-based groups, assign users, and map server access.</p>
        </div>
        <Button onClick={() => setIsCreateGroupOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Group
        </Button>
      </div>

      {/* 2. Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] min-h-[600px]">
        
        {/* LEFT COLUMN: Groups List */}
        <div className="lg:col-span-4 xl:col-span-3 border rounded-xl bg-card flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search groups..."
                className="pl-9 bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {mockGroups.map((group) => (
              <button
                key={group.id}
                onClick={() => setActiveGroup(group)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  activeGroup.id === group.id
                    ? "bg-primary/5 border-primary/20 ring-1 ring-primary/20"
                    : "bg-transparent border-transparent hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <FolderKey className={`w-4 h-4 ${activeGroup.id === group.id ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`font-medium text-sm ${activeGroup.id === group.id ? "text-foreground" : "text-muted-foreground"}`}>
                      {group.name}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {group.userCount}</span>
                  <span className="flex items-center gap-1"><Server className="w-3 h-3" /> {group.serverCount}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: Group Details & Tabs */}
        <div className="lg:col-span-8 xl:col-span-9 border rounded-xl bg-card flex flex-col overflow-hidden">
          {/* Group Header Info */}
          <div className="p-6 border-b border-border flex justify-between items-start bg-muted/10">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                {activeGroup.name}
                <Shield className="w-4 h-4 text-primary" />
              </h2>
              <p className="text-sm text-muted-foreground mt-1">{activeGroup.description}</p>
            </div>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>

          {/* Custom Tabs Navigation (matches shadcn aesthetics without extra dependencies) */}
          <div className="px-6 pt-4 border-b border-border">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setActiveTab("users")}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "users" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Members ({activeGroup.userCount})
              </button>
              <button
                onClick={() => setActiveTab("servers")}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "servers" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Assigned Servers ({activeGroup.serverCount})
              </button>
            </div>
          </div>

          {/* Tab Content: Users */}
          {activeTab === "users" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 flex justify-between items-center bg-muted/10 border-b border-border">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search members..." className="pl-9 h-9 bg-background" />
                </div>
                <Button size="sm" onClick={() => setIsAddUserOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Add Member
                </Button>
              </div>
              <div className="flex-1 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent bg-muted/30">
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>System Role</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockGroupUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">{user.initials}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm">{user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{user.email}</TableCell>
                        <TableCell className="text-sm">{user.role}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-4 h-4 mr-2" /> Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Tab Content: Servers */}
          {activeTab === "servers" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 flex justify-between items-center bg-muted/10 border-b border-border">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search servers..." className="pl-9 h-9 bg-background" />
                </div>
                <Button size="sm" onClick={() => setIsAssignServerOpen(true)}>
                  <Server className="w-4 h-4 mr-2" /> Assign Server
                </Button>
              </div>
              <div className="flex-1 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent bg-muted/30">
                      <TableHead>Server Name</TableHead>
                      <TableHead>Host IP</TableHead>
                      <TableHead>OS</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockGroupServers.map((server) => (
                      <TableRow key={server.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium flex items-center gap-2 text-sm">
                          <Monitor className="w-4 h-4 text-muted-foreground" /> {server.name}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{server.host}</TableCell>
                        <TableCell className="text-sm">{server.os}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${
                            server.status === "Online" ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" : "text-zinc-500 bg-zinc-500/10 border-zinc-500/20"
                          }`}>
                            <div className="w-1.5 h-1.5 rounded-full bg-current" />
                            {server.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-4 h-4 mr-2" /> Revoke
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Create Group */}
      <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
        <DialogContent className="sm:max-w-[425px] bg-background border-border shadow-lg">
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>Create a new access group to manage permissions collectively.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Group Name</Label>
              <Input id="name" placeholder="e.g. Database Admins" className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Brief description of this group's purpose" className="bg-background resize-none h-20" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateGroupOpen(false)}>Cancel</Button>
            <Button type="submit">Create Group</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: Add Users to Group */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="sm:max-w-[500px] bg-background border-border shadow-lg">
          <DialogHeader>
            <DialogTitle>Add Members to {activeGroup.name}</DialogTitle>
            <DialogDescription>Select users to add to this group.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search users..." className="pl-9 bg-background" />
            </div>
            <div className="border border-border rounded-lg max-h-[300px] overflow-y-auto">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-3 p-3 hover:bg-muted/50 border-b border-border last:border-0">
                  <Checkbox id={`user-${i}`} />
                  <Label htmlFor={`user-${i}`} className="flex items-center gap-3 cursor-pointer w-full font-normal">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">U{i}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Available User {i}</span>
                      <span className="text-xs text-muted-foreground">user{i}@example.com</span>
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>Cancel</Button>
            <Button type="submit">Add Selected</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: Assign Servers to Group */}
      <Dialog open={isAssignServerOpen} onOpenChange={setIsAssignServerOpen}>
        <DialogContent className="sm:max-w-[600px] bg-background border-border shadow-lg">
          <DialogHeader>
            <DialogTitle>Assign Servers to {activeGroup.name}</DialogTitle>
            <DialogDescription>Grant this group access to specific servers.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search servers by name or IP..." className="pl-9 bg-background" />
            </div>
            <div className="border border-border rounded-lg max-h-[300px] overflow-y-auto">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-3 p-3 hover:bg-muted/50 border-b border-border last:border-0">
                  <Checkbox id={`server-${i}`} />
                  <Label htmlFor={`server-${i}`} className="flex items-center justify-between cursor-pointer w-full font-normal">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Production Server {i}</span>
                      <span className="font-mono text-xs text-muted-foreground">10.0.{i}.100</span>
                    </div>
                    <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">Ubuntu 22.04</span>
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignServerOpen(false)}>Cancel</Button>
            <Button type="submit">Assign Selected</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}