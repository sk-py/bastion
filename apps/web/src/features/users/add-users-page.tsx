import { useState } from "react";
import { 
  Search, 
  Settings, 
  Plus, 
  Download, 
  Users, 
  UserCheck, 
  MailOpen, 
  SlidersHorizontal, 
  Calendar, 
  MoreVertical 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// --- Mock Data matching the image ---
const mockUsers = [
  { id: 1, name: "Alexander Montgomery", email: "alexander@gmail.com", role: "Editor", group: "Marketing", status: "Active", joined: "01 Jan, 2026", initials: "AM" },
  { id: 2, name: "Nathaniel Richardson", email: "nathaniel@gmail.com", role: "Owner", group: "Engineering", status: "Active", joined: "01 Dec, 2025", initials: "NR" },
  { id: 3, name: "Theodore Whitmore", email: "theodore@gmail.com", role: "Editor", group: "Design", status: "Pending", joined: "30 Nov, 2025", initials: "TW" },
  { id: 4, name: "Edward Kensington", email: "edward@gmail.com", role: "Admin", group: "Marketing", status: "Active", joined: "01 Oct, 2025", initials: "EK" },
  { id: 5, name: "Benjamin Calloway", email: "benjamin@gmail.com", role: "DevOps", group: "Engineering", status: "Offline", joined: "25 May, 2025", initials: "BC" },
  { id: 6, name: "Oliver Remington", email: "oliver@gmail.com", role: "User", group: "Marketing", status: "Active", joined: "20 May, 2025", initials: "OR" },
  { id: 7, name: "Dominic Harrington", email: "dominic@gmail.com", role: "User", group: "Design", status: "Pending", joined: "01 May, 2025", initials: "DH" },
  { id: 8, name: "William Prescott", email: "william@gmail.com", role: "Editor", group: "Engineering", status: "Active", joined: "01 Apr, 2025", initials: "WP" },
  { id: 9, name: "Jamison Wellington", email: "jamison@gmail.com", role: "Admin", group: "Marketing", status: "Active", joined: "30 Jun, 2025", initials: "JW" },
  { id: 10, name: "Sebastian Vanderbilt", email: "sebastian@gmail.com", role: "User", group: "Engineering", status: "Offline", joined: "02 Jun, 2025", initials: "SV" },
];

export default function UsersPage() {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "Active":
        return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      case "Pending":
        return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      case "Offline":
        return "text-zinc-500 bg-zinc-500/10 border-zinc-500/20";
      default:
        return "text-muted-foreground bg-muted border-border";
    }
  };

  return (
    <div className="p-8 w-full bg-background min-h-screen text-foreground space-y-8">
      
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Team Members</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage who has access to your workspace.</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" className="bg-background">
              <Settings className="w-4 h-4 mr-2" />
              Team Settings
            </Button>
            <Button onClick={() => setIsInviteOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Invite Member
            </Button>
          </div>
          <Button variant="outline" size="sm" className="bg-background text-xs h-8">
            <Download className="w-3 h-3 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* 2. Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-card border rounded-xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Members</p>
            <p className="text-2xl font-bold mt-1">35</p>
          </div>
        </div>
        <div className="p-6 bg-card border rounded-xl flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Active Now</p>
            <p className="text-2xl font-bold mt-1">15</p>
          </div>
        </div>
        <div className="p-6 bg-card border rounded-xl flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-lg">
            <MailOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Pending Invites</p>
            <p className="text-2xl font-bold mt-1">8</p>
          </div>
        </div>
      </div>

      {/* 3. Filters Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex flex-1 items-center gap-3 w-full">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              className="pl-9 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select>
            <SelectTrigger className="w-[140px] bg-background">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-[140px] bg-background">
              <SelectValue placeholder="All Groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              <SelectItem value="engineering">Engineering</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="design">Design</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-[140px] bg-background">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" className="bg-background">
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* 4. Data Table */}
      <div className="border rounded-xl bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-muted/30">
              <TableHead className="w-12 pl-6"><Checkbox /></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined Date</TableHead>
              <TableHead className="text-right pr-6">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockUsers.map((user) => (
              <TableRow key={user.id} className="hover:bg-muted/50">
                <TableCell className="pl-6"><Checkbox /></TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      {/* <AvatarImage src={user.avatar} /> */}
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">{user.initials}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{user.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{user.group}</TableCell>
                <TableCell>
                  <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusStyles(user.status)}`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-current" />
                    {user.status}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 opacity-50" />
                    {user.joined}
                  </div>
                </TableCell>
                <TableCell className="text-right pr-6">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" className="h-8 px-3 text-xs">Edit</Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 5. Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>Showing 1–10 of 35 members</div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="w-8 h-8 rounded-md bg-background">{"<"}</Button>
          <Button variant="default" size="icon" className="w-8 h-8 rounded-md">1</Button>
          <Button variant="outline" size="icon" className="w-8 h-8 rounded-md bg-background">2</Button>
          <Button variant="outline" size="icon" className="w-8 h-8 rounded-md bg-background">3</Button>
          <Button variant="outline" size="icon" className="w-8 h-8 rounded-md bg-background">4</Button>
          <Button variant="outline" size="icon" className="w-8 h-8 rounded-md bg-background">{">"}</Button>
        </div>
      </div>

      {/* 6. Invite Team Member Modal */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="sm:max-w-[425px] bg-background border-border shadow-lg">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-xl">Invite Team Member</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              They'll receive an email with instructions to join.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
              <Input 
                id="email" 
                placeholder="Enter email address" 
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground">Add multiple emails by pressing Enter after each one.</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-medium">Role</Label>
              <Select>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="devops">DevOps</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="group" className="text-sm font-medium">Group</Label>
              <Select>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="engineering">Engineering</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setIsInviteOpen(false)} className="bg-background">
              Cancel
            </Button>
            <Button type="submit">
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}