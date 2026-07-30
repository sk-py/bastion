import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Eye, Edit2, Trash2, Activity, Server, CheckCircle2, XCircle } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { toast } from "sonner"; // Assuming sonner is used for shadcn toasts

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/api/axios";
import { createServerSchema, updateServerSchema, type CreateServerSchema, type UpdateServerSchema } from "@bastion/schemas";
import { Label } from "@/components/ui/label";

const OSIcon = ({ os }: { os: string | null }) => {
  if (!os) return <Server className="w-4 h-4 text-muted-foreground" />;
  const lower = os.toLowerCase();
  if (lower.includes("ubuntu")) {
    return <img src="/ubuntu.svg" alt="Ubuntu" className="w-4 h-4 object-contain" />;
  }
  if (lower.includes("debian")) {
    return <img src="/debian.svg" alt="Debian" className="w-4 h-4 object-contain" />;
  }
  if (lower.includes("centos")) {
    return <img src="/cent-os.svg" alt="CentOS" className="w-4 h-4 object-contain" />;
  }
  return <Server className="w-4 h-4 text-muted-foreground" />;
};

export default function ServersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedServer, setSelectedServer] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: serversData, isLoading } = useQuery({
    queryKey: ["servers"],
    queryFn: async () => {
      const res = await api.get("/server/all");
      return res.data.data;
    },
  });

  const addMutation = useMutation({
    mutationFn: (data: CreateServerSchema) => api.post("/server/add", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servers"] });
      setIsAddOpen(false);
      toast.success("Server added successfully");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to add server")
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateServerSchema }) =>
      api.patch(`/server/update/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servers"] });
      setIsEditOpen(false);
      toast.success("Server updated successfully");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to update server")
  });

  const testConnectionMutation = useMutation({
    mutationFn: (id: string) => api.post(`/server/${id}/test`),
    onSuccess: (res) => toast.success(res.data?.message || "Connection successful"),
    onError: (err: any) => toast.error(err.response?.data?.message || "Connection failed"),
  });

  const filteredServers = serversData?.filter((s: any) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.host.includes(search)
  );

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Servers</h1>
          <p className="text-sm text-muted-foreground">Manage your servers and their connections</p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4 gap-4">
        <div className="relative w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search servers..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Server
        </Button>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Name</TableHead>
              <TableHead>Host</TableHead>
              <TableHead>User</TableHead>
              <TableHead>OS</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Connected</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filteredServers?.map((server: any) => (
              <TableRow key={server.id} className="hover:bg-muted/50">
                <TableCell className="font-medium flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${server.lastConnectedAt ? 'bg-green-500' : 'bg-red-500'}`} />
                  {server.name}
                </TableCell>
                <TableCell>{server.host}</TableCell>
                <TableCell>{server.username}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <OSIcon os={server.operatingSystem} />
                    {server.operatingSystem || "Unknown"}
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`text-xs ${server.lastConnectedAt ? 'text-green-500' : 'text-red-500'}`}>
                    {server.lastConnectedAt ? 'Connected' : 'Not Connected'}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {server.lastConnectedAt ? format(new Date(server.lastConnectedAt), "dd MMM yyyy, hh:mm a") : "—"}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => { setSelectedServer(server); setIsDetailsOpen(true); }}>
                      <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { setSelectedServer(server); setIsEditOpen(true); }}>
                      <Edit2 className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:text-destructive">
                      <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ServerFormModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={(data: CreateServerSchema) => addMutation.mutate(data)}
        title="Add New Server"
      />

      {selectedServer && (
        <ServerFormModal
          isOpen={isEditOpen}
          onClose={() => { setIsEditOpen(false); setSelectedServer(null); }}
          onSubmit={(data: UpdateServerSchema) => updateMutation.mutate({ id: selectedServer.id, data })}
          title="Edit Server"
          defaultValues={selectedServer}
          isEdit={true}
        />
      )}

      {selectedServer && (
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                {selectedServer.name}
                <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded border border-green-500/20">Connected</span>
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-6 mt-4">
              <div className="space-y-4 bg-muted/30 p-4 rounded-lg border">
                <h3 className="font-semibold mb-2">Basic Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <span className="text-muted-foreground">Name</span><span>{selectedServer.name}</span>
                  <span className="text-muted-foreground">Host</span><span>{selectedServer.host}</span>
                  <span className="text-muted-foreground">Port</span><span>{selectedServer.port}</span>
                  <span className="text-muted-foreground">Username</span><span>{selectedServer.username}</span>
                  <span className="text-muted-foreground">Authentication</span>
                  <span className="text-primary bg-primary/10 px-2 rounded w-fit capitalize">{selectedServer.authMethod.replace('_', ' ')}</span>
                </div>
              </div>
              <div className="space-y-4 bg-muted/30 p-4 rounded-lg border">
                <h3 className="font-semibold mb-2">Discovered Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <span className="text-muted-foreground">Hostname</span><span>{selectedServer.hostname || "—"}</span>
                  <span className="text-muted-foreground">OS</span><span className="flex items-center gap-1"><OSIcon os={selectedServer.operatingSystem} /> {selectedServer.operatingSystem || "—"}</span>
                  <span className="text-muted-foreground">Architecture</span><span>{selectedServer.architecture || "—"}</span>
                  <span className="text-muted-foreground">Kernel</span><span>{selectedServer.kernelVersion || "—"}</span>
                  <span className="text-muted-foreground">CPU Cores</span><span>{selectedServer.cpuCoreCount || "—"}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={() => testConnectionMutation.mutate(selectedServer.id)}
                disabled={testConnectionMutation.isPending}
              >
                <Activity className="w-4 h-4 mr-2" />
                {testConnectionMutation.isPending ? "Testing..." : "Test Connection"}
              </Button>
              <div className="flex gap-2">
                <Button variant="outline">Rediscover</Button>
                <Button variant="outline" onClick={() => { setIsDetailsOpen(false); setIsEditOpen(true); }}>Edit</Button>
                <Button variant="destructive">Delete</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export function ServerFormModal({ isOpen, onClose, onSubmit, title, defaultValues, isEdit = false }: any) {
  const { register, handleSubmit, watch, control, formState: { errors } } = useForm({
    resolver: zodResolver(isEdit ? updateServerSchema : createServerSchema),
    defaultValues: defaultValues || {
      name: "",
      host: "",
      port: 22,
      username: "",
      authMethod: "password",
      password: "",
      privateKey: "",
      passphrase: "",
      description: ""
    }
  });

  const watchAuthMethod = watch("authMethod");

  const submitHandler = (data: any) => {
    const payload = { ...data };
    if (payload.authMethod === "password") delete payload.privateKey;
    if (payload.authMethod === "private_key") delete payload.password;
    onSubmit(payload);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submitHandler)} className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" placeholder="e.g. Production Server" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message as string}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="host">Host *</Label>
              <Input id="host" placeholder="e.g. 192.168.1.10" {...register("host")} />
              {errors.host && <p className="text-sm text-destructive">{errors.host.message as string}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">Port *</Label>
              <Input id="port" type="number" {...register("port", { valueAsNumber: true })} />
              {errors.port && <p className="text-sm text-destructive">{errors.port.message as string}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input id="username" placeholder="e.g. ubuntu" {...register("username")} />
              {errors.username && <p className="text-sm text-destructive">{errors.username.message as string}</p>}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Authentication Method</Label>
            <Controller
              control={control}
              name="authMethod"
              render={({ field }) => (
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-6">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="password" id="password" />
                    <Label htmlFor="password" className="font-normal cursor-pointer">Password</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="private_key" id="private_key" />
                    <Label htmlFor="private_key" className="font-normal cursor-pointer">Private Key</Label>
                  </div>
                </RadioGroup>
              )}
            />
          </div>

          {watchAuthMethod === "password" ? (
            <div className="space-y-2">
              <Label htmlFor="passwordInput">Password *</Label>
              <Input id="passwordInput" type="password" {...register("password")} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message as string}</p>}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="privateKey">Private Key *</Label>
              <Textarea id="privateKey" className="font-mono h-32" placeholder="-----BEGIN RSA PRIVATE KEY-----" {...register("privateKey")} />
              {errors.privateKey && <p className="text-sm text-destructive">{errors.privateKey.message as string}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="passphrase">Passphrase (Optional)</Label>
            <Input id="passphrase" type="password" placeholder="If your key has a passphrase" {...register("passphrase")} />
            {errors.passphrase && <p className="text-sm text-destructive">{errors.passphrase.message as string}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="Optional description for this server" {...register("description")} />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message as string}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{isEdit ? "Save Changes" : "Add Server"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}