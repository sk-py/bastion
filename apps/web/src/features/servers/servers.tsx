import { useState, useEffect, useRef } from "react";
import { Search, Plus, Eye, Edit2, Trash2, Activity, Server as ServerIcon, SquareTerminal, Timeline, Upload } from "lucide-react";
import { Controller, useForm, FormProvider, useFormContext, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createServerSchema, updateServerSchema, type CreateServerSchema, type UpdateServerSchema } from "@bastion/schemas";

import { useServers, useAddServer, useUpdateServer, useTestServerConnection, useDeleteServer } from "./hooks/use-servers";

import ubuntuLogo from "@/assets/os-icons/ubuntu.svg";
import debianLogo from "@/assets/os-icons/debian.svg";
import centosLogo from "@/assets/os-icons/cent-os.svg";
import { useNavigate } from "react-router";
import { useCurrentUser } from "../auth/hooks/use-current-user";
import { ServerRowActions } from "./components/server-row-actions";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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

function ServerFormFields() {
  const { register, control, setValue, formState: { errors } } = useFormContext<ServerFormValues>();
  const watchAuthMethod = useWatch({ control, name: "authMethod" });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Sanity check: PEM files are very small. Block massive files.
    if (file.size > 100 * 1024) {
      toast.error("File is too large. Please upload a valid SSH key file.");
      event.target.value = ""; // Reset input
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      // Inject the file contents directly into the React Hook Form state
      setValue("privateKey", text, { shouldValidate: true, shouldDirty: true });
      toast.success("Key file loaded successfully.");
    };
    reader.onerror = () => {
      toast.error("Failed to read the key file.");
    };
    reader.readAsText(file);

    // Reset input so the same file can be uploaded again if needed
    event.target.value = "";
  };

  console.log(errors)

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
            <RadioGroup
              onValueChange={field.onChange}
              value={field.value}
              className="flex gap-6"
            >
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
          <div className="flex justify-between items-center">
            <Label htmlFor="privateKey">Private Key *</Label>
            <div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
                accept=".pem,.key,.txt,application/x-pem-file"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-3 h-3 mr-2" /> Upload File
              </Button>
            </div>
          </div>
          <Textarea
            id="privateKey"
            className="font-mono h-32 text-xs"
            placeholder="-----BEGIN RSA PRIVATE KEY-----"
            {...register("privateKey")}
          />
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
    resolver: async (data, context, options) => {
      const validationPayload = { ...data };

      // Strip out fields that shouldn't be validated based on the auth method
      if (validationPayload.authMethod === "password") {
        delete validationPayload.privateKey;
        delete validationPayload.passphrase;
      } else if (validationPayload.authMethod === "private_key") {
        delete validationPayload.password;
      }

      return zodResolver(createServerSchema)(validationPayload, context, options);
    },
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
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(submitHandler)} className="space-y-6 py-4">
            <ServerFormFields />
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">Add Server</Button>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}

function ServerEditDialog({ isOpen, onClose, onSubmit, defaultValues }: { isOpen: boolean; onClose: () => void; onSubmit: (data: UpdateServerSchema) => void; defaultValues: Server }) {
  const form = useForm<ServerFormValues>({
    resolver: async (data, context, options) => {
      const validationPayload: Partial<ServerFormValues> = { ...data };

      // 1. Strip irrelevant fields based on the currently selected auth method
      if (validationPayload.authMethod === "password") {
        delete validationPayload.privateKey;
        delete validationPayload.passphrase;
      } else if (validationPayload.authMethod === "private_key") {
        delete validationPayload.password;
      }

      // 2. Frontend Validation Bypass for unchanged credentials
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
    if (isOpen) {
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
    }
  }, [isOpen, defaultValues, form]);

  const submitHandler = (data: ServerFormValues) => {
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
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(submitHandler)} className="space-y-6 py-4">
            <ServerFormFields />
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}

// --- Main Page ---

export default function ServersPage() {
  const [search, setSearch] = useState("");

  const { data: currentUser } = useCurrentUser();

  const canManageServers =
    currentUser?.role === "owner" ||
    currentUser?.role === "admin";

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const { data: serversData, isLoading } = useServers();
  const addMutation = useAddServer();
  const updateMutation = useUpdateServer();
  const testConnectionMutation = useTestServerConnection();
  const deleteMutation = useDeleteServer()

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
          <p className="text-sm text-muted-foreground">
            {canManageServers
              ? "Manage your organization's servers and access"
              : "Servers you have access to"}
          </p>
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
        {canManageServers && (
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Server
          </Button>
        )}
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
            {isLoading && filteredServers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground text-sm">
                  {canManageServers
                    ? "No servers yet. Add one to get started."
                    : "You don't have access to any servers yet. Contact an admin if you think this is wrong."}
                </TableCell>
              </TableRow>
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
                  <ServerRowActions
                    server={server}
                    canManageServers={canManageServers}
                    onView={() => { setSelectedServer(server); setIsDetailsOpen(true); }}
                    onEdit={() => { setSelectedServer(server); setIsEditOpen(true); }}
                    onDelete={() => { setSelectedServer(server); setIsDeleteOpen(true); }}
                    onOpenTerminal={() => navigate(`/servers/${server.id}/terminal`)}
                    onViewSessions={() => navigate(`/sessions?serverId=${server.id}`)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>


      <Dialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Delete {selectedServer?.name}?
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (!selectedServer) return;

                deleteMutation.mutate(selectedServer.id, {
                  onSuccess: () => {
                    setIsDeleteOpen(false);
                    setSelectedServer(null);
                  },
                });
              }}
            >
              {deleteMutation.isPending
                ? "Deleting..."
                : "Delete Server"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
          <DialogContent className="max-w-2xl!">
            <DialogHeader>
              <div className="flex items-center justify-between pr-6">
                <div>
                  <DialogTitle className="text-xl">{selectedServer.name}</DialogTitle>
                  <DialogDescription className="mt-1">
                    {selectedServer.host}:{selectedServer.port} · connected as {selectedServer.username}
                  </DialogDescription>
                </div>
                <Badge variant={selectedServer.lastConnectedAt ? "default" : "secondary"} className="shrink-0">
                  {selectedServer.lastConnectedAt ? "Previously Connected" : "Never Connected"}
                </Badge>
              </div>
            </DialogHeader>

            <div className="space-y-5 mt-2">
              <section>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Connection</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div><span className="text-muted-foreground block text-xs mb-0.5">Host</span>{selectedServer.host}</div>
                  <div><span className="text-muted-foreground block text-xs mb-0.5">Port</span>{selectedServer.port}</div>
                  <div><span className="text-muted-foreground block text-xs mb-0.5">Username</span>{selectedServer.username}</div>
                  <div>
                    <span className="text-muted-foreground block text-xs mb-0.5">Auth Method</span>
                    <Badge variant="outline" className="capitalize font-normal">{selectedServer.authMethod.replace("_", " ")}</Badge>
                  </div>
                </div>
              </section>

              <Separator />

              <section>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Discovered</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div><span className="text-muted-foreground block text-xs mb-0.5">Hostname</span>{selectedServer.hostname || "—"}</div>
                  <div>
                    <span className="text-muted-foreground block text-xs mb-0.5">OS</span>
                    <span className="flex items-center gap-1.5"><OSIcon os={selectedServer.operatingSystem} />{selectedServer.operatingSystem || "—"}</span>
                  </div>
                  <div><span className="text-muted-foreground block text-xs mb-0.5">Architecture</span>{selectedServer.architecture || "—"}</div>
                  <div><span className="text-muted-foreground block text-xs mb-0.5">Kernel</span>{selectedServer.kernelVersion || "—"}</div>
                  <div><span className="text-muted-foreground block text-xs mb-0.5">CPU Cores</span>{selectedServer.cpuCoreCount || "—"}</div>
                </div>
              </section>
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => testConnectionMutation.mutate(selectedServer.id)}
                disabled={testConnectionMutation.isPending}
              >
                <Activity className="w-4 h-4 mr-2" />
                {testConnectionMutation.isPending ? "Testing..." : "Test Connection"}
              </Button>

              {canManageServers && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setIsDetailsOpen(false); setIsEditOpen(true); }}>
                    <Edit2 className="w-4 h-4 mr-2" /> Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => { setIsDetailsOpen(false); setIsDeleteOpen(true); }}>
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}