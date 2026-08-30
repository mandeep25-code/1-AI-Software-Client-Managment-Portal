import { useEffect, useState } from "react";
import { api, apiError } from "@/lib/api";
import { PageLoader, EmptyState, Badge, AvatarBubble } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Building2, Phone, Mail } from "lucide-react";
import { toast } from "sonner";

const EMPTY = { name: "", contactName: "", email: "", phone: "", company: "", notes: "" };

export default function Clients() {
  const [clients, setClients] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const load = () => api.get("/clients").then((r) => setClients(r.data));
  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!form.name) return toast.error("Client name required");
    try {
      await api.post("/clients", { ...form, company: form.company || form.name });
      toast.success("Client added");
      setOpen(false);
      setForm(EMPTY);
      load();
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  if (!clients) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-up" data-testid="clients-page">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-zinc-500 font-semibold">Relationships</p>
          <h1 className="mt-2 font-display text-4xl font-light tracking-tighter">Clients</h1>
        </div>
        <Button onClick={() => setOpen(true)} data-testid="new-client-btn" className="bg-white text-black hover:bg-zinc-200 rounded-sm">
          <Plus className="h-4 w-4 mr-2" /> New Client
        </Button>
      </div>

      {clients.length === 0 ? (
        <EmptyState icon={Building2} title="No clients yet" description="Add your first client to link projects and invoices." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((c) => (
            <div key={c._id} data-testid={`client-card-${c._id}`} className="bg-[#0E0E0E] border border-white/10 rounded-sm p-6 hover:border-white/25 transition-colors">
              <div className="flex items-center gap-3">
                <AvatarBubble name={c.name} src={c.logo} size="h-11 w-11" />
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-medium truncate">{c.name}</h3>
                  <p className="text-xs text-zinc-500">{c.projectCount} projects</p>
                </div>
                <div className="ml-auto">
                  <Badge map={{ active: { label: "Active", cls: "text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/20" }, inactive: { label: "Inactive", cls: "text-zinc-400 bg-white/5 border-white/10" } }} value={c.status} />
                </div>
              </div>
              <div className="mt-5 space-y-2 text-sm text-zinc-400">
                {c.contactName && <p className="text-zinc-300">{c.contactName}</p>}
                {c.email && (
                  <p className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-zinc-600" /> {c.email}
                  </p>
                )}
                {c.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-zinc-600" /> {c.phone}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#0A0A0A] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="font-display font-medium">New Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {[
              ["name", "Company / Client Name"],
              ["contactName", "Contact Person"],
              ["email", "Email"],
              ["phone", "Phone"],
            ].map(([key, label]) => (
              <div key={key}>
                <Label className="text-zinc-400 text-xs uppercase tracking-wide mb-1.5 block">{label}</Label>
                <Input
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  data-testid={`client-${key}-input`}
                  className="bg-[#050505] border-white/10 rounded-sm"
                />
              </div>
            ))}
            <div>
              <Label className="text-zinc-400 text-xs uppercase tracking-wide mb-1.5 block">Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="bg-[#050505] border-white/10 rounded-sm resize-none"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={save} data-testid="save-client-btn" className="bg-white text-black hover:bg-zinc-200 rounded-sm">
              Add Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
