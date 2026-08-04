import { useState, useEffect } from "react";
import { Search, Plus, Eye, Edit2, Trash2, Activity, Server as ServerIcon, SquareTerminal } from "lucide-react";
import { Controller, useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createServerSchema, updateServerSchema, type CreateServerSchema, type UpdateServerSchema } from "@bastion/schemas";

import { useServers, useAddServer, useUpdateServer, useTestServerConnection } from "./hooks/use-servers";

import ubuntuLogo from "@/assets/os-icons/ubuntu.svg";
import debianLogo from "@/assets/os-icons/debian.svg";
import centosLogo from "@/assets/os-icons/cent-os.svg";
import { useNavigate } from "react-router";

// --- Types ---

export interface Server {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  authMethod: "password" | "private_key";
  operatingSystem: string | null;
  lastConnectedAt: string | null;
  hostname: string | null;
  architecture: string | null;
  kernelVersion: string | null;
  cpuCoreCount: number | null;
}

type ServerFormValues = {
  name: string;
  host: string;
  port: number;
  username: string;
  authMethod: "password" | "private_key";
  password?: string;
  privateKey?: string;
  passphrase?: string;
};

// --- Subcomponents ---

const OSIcon = ({ os }: { os: string | null }) => {
  if (!os) return <ServerIcon className="w-4 h-4 text-muted-foreground" />;
  const lower = os.toLowerCase();
  if (lower.includes("ubuntu")) return <img src={ubuntuLogo} alt="Ubuntu" className="w-4 h-4 object-contain" />;
  if (lower.includes("debian")) return <img src={debianLogo} alt="Debian" className="w-4 h-4 object-contain" />;
  if (lower.includes("centos")) return <img src={centosLogo} alt="CentOS" className="w-4 h-4 object-contain" />;
  return <ServerIcon className="w-4 h-4 text-muted-foreground" />;
};

function ServerFormFields({ form }: { form: UseFormReturn<any> }) {
  const { register, control, watch, formState: { errors } } = form;
  const watchAuthMethod = watch("authMethod");

  return (
    <>
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
            <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-6">
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
    </>
  );
}

function ServerCreateDialog({ isOpen, onClose, onSubmit }: { isOpen: boolean; onClose: () => void; onSubmit: (data: CreateServerSchema) => void }) {
  const form = useForm<ServerFormValues>({
    resolver: zodResolver(createServerSchema),
    defaultValues: { name: "", host: "", port: 22, username: "", authMethod: "password", password: "", privateKey: "", passphrase: "" }
  });

  useEffect(() => {
    if (isOpen) form.reset();
  }, [isOpen, form]);

  const submitHandler = (data: ServerFormValues) => {
    const payload = { ...data };
    if (payload.authMethod === "password") delete payload.privateKey;
    if (payload.authMethod === "private_key") delete payload.password;
    onSubmit(payload as CreateServerSchema);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Server</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(submitHandler)} className="space-y-6 py-4">
          <ServerFormFields form={form} />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Add Server</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ServerEditDialog({ isOpen, onClose, onSubmit, defaultValues }: { isOpen: boolean; onClose: () => void; onSubmit: (data: UpdateServerSchema) => void; defaultValues: Server }) {
  const form = useForm<ServerFormValues>({
    resolver: async (data, context, options) => {
      // 1. Frontend Validation Bypass
      // We must strip empty unchanged credentials here, otherwise your 
      // Zod .superRefine will block the submission entirely.
      const validationPayload: Partial<ServerFormValues> = { ...data };
      const authUnchanged = validationPayload.authMethod === defaultValues.authMethod;
      const noCredentialsEntered = !validationPayload.password && !validationPayload.privateKey;

      if (authUnchanged && noCredentialsEntered) {
        delete validationPayload.authMethod;
        delete validationPayload.password;
        delete validationPayload.privateKey;
        delete validationPayload.passphrase;
      }

      return zodResolver(updateServerSchema)(validationPayload, context, options);
    },
    defaultValues: {
      name: defaultValues.name,
      host: defaultValues.host,
      port: defaultValues.port,
      username: defaultValues.username,
      authMethod: defaultValues.authMethod,
      password: "",
      privateKey: "",
      passphrase: ""
    }
  });

  useEffect(() => {
    form.reset({
      name: defaultValues.name,
      host: defaultValues.host,
      port: defaultValues.port,
      username: defaultValues.username,
      authMethod: defaultValues.authMethod,
      password: "",
      privateKey: "",
      passphrase: ""
    });
  }, [defaultValues, form]);

  const submitHandler = (data: ServerFormValues) => {
    // 2. True PATCH payload construction
    // Diff the current form values against the initial defaultValues
    const patchPayload: Partial<ServerFormValues> = {};

    if (data.name !== defaultValues.name) patchPayload.name = data.name;
    if (data.host !== defaultValues.host) patchPayload.host = data.host;
    if (data.port !== defaultValues.port) patchPayload.port = data.port;
    if (data.username !== defaultValues.username) patchPayload.username = data.username;

    const authUnchanged = data.authMethod === defaultValues.authMethod;
    const noCredentialsEntered = !data.password && !data.privateKey;

    if (!authUnchanged || !noCredentialsEntered) {
      patchPayload.authMethod = data.authMethod;
      if (data.authMethod === "password" && data.password) patchPayload.password = data.password;
      if (data.authMethod === "private_key" && data.privateKey) patchPayload.privateKey = data.privateKey;
      if (data.passphrase) patchPayload.passphrase = data.passphrase;
    }

    // If no fields were actually changed, do not make an API request
    if (Object.keys(patchPayload).length === 0) {
      onClose();
      return;
    }

    onSubmit(patchPayload as UpdateServerSchema);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Server</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(submitHandler)} className="space-y-6 py-4">
          <ServerFormFields form={form} />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Main Page ---

export default function ServersPage() {
  const [search, setSearch] = useState("");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: serversData, isLoading } = useServers();
  const addMutation = useAddServer();
  const updateMutation = useUpdateServer();
  const testConnectionMutation = useTestServerConnection();

  const navigate = useNavigate();

  const filteredServers = serversData?.filter((s: Server) =>
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
            ) : filteredServers?.map((server: Server) => (
              <TableRow key={server.id} className="hover:bg-muted/50">
                <TableCell className="font-medium flex mt-1 items-center justify-start gap-2">
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
                  <span className={`text-xs ${server.lastConnectedAt ? 'text-green-500' : 'text-muted-foreground'}`}>
                    {server.lastConnectedAt ? 'Previously Connected' : 'Never Connected'}
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
                    <Button variant="ghost" onClick={() => navigate(`/servers/${server.id}/terminal`)} size="icon" className="hover:text-destructive">
                      <SquareTerminal className="w-4 h-4 text-muted-foreground hover:text-destructive" />
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

      <ServerCreateDialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={(data: CreateServerSchema) => {
          addMutation.mutate(data, {
            onSuccess: () => setIsAddOpen(false)
          });
        }}
      />

      {selectedServer && (
        <ServerEditDialog
          isOpen={isEditOpen}
          onClose={() => { setIsEditOpen(false); setSelectedServer(null); }}
          defaultValues={selectedServer}
          onSubmit={(data: UpdateServerSchema) => {
            updateMutation.mutate({ id: selectedServer.id, data }, {
              onSuccess: () => setIsEditOpen(false)
            });
          }}
        />
      )}

      {selectedServer && (
        <Dialog open={isDetailsOpen} onOpenChange={(open) => { if (!open) setIsDetailsOpen(false); }}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                {selectedServer.name}
                {selectedServer.lastConnectedAt && (
                  <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded border border-green-500/20">Previously Connected</span>
                )}
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