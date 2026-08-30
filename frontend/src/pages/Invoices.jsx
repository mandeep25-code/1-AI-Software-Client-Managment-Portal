import { useEffect, useState } from "react";
import { api, apiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PageLoader, EmptyState, Badge, INVOICE_STATUS, money } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, ReceiptText, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Invoices() {
  const { user } = useAuth();
  const canManage = user.role === "admin" || user.role === "team";
  const [invoices, setInvoices] = useState(null);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    clientId: "",
    projectId: "",
    items: [{ description: "", quantity: 1, rate: 0 }],
    taxRate: 0,
    status: "draft",
  });

  const load = () => api.get("/invoices").then((r) => setInvoices(r.data));
  useEffect(() => {
    load();
    if (canManage) {
      api.get("/clients").then((r) => setClients(r.data));
      api.get("/projects").then((r) => setProjects(r.data));
    }
  }, []);

  const subtotal = form.items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.rate) || 0), 0);
  const total = subtotal + (subtotal * (Number(form.taxRate) || 0)) / 100;

  const updateItem = (idx, key, val) =>
    setForm((f) => ({
      ...f,
      items: f.items.map((it, i) => (i === idx ? { ...it, [key]: val } : it)),
    }));

  const save = async () => {
    if (!form.clientId) return toast.error("Select a client");
    try {
      await api.post("/invoices", { ...form, projectId: form.projectId || null });
      toast.success("Invoice created");
      setOpen(false);
      setForm({ clientId: "", projectId: "", items: [{ description: "", quantity: 1, rate: 0 }], taxRate: 0, status: "draft" });
      load();
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  const setStatus = async (inv, status) => {
    try {
      await api.put(`/invoices/${inv._id}/status`, { status });
      load();
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/invoices/${id}`);
      load();
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  if (!invoices) return <PageLoader />;

  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.total, 0);
  const totalOutstanding = invoices.filter((i) => i.status === "sent").reduce((s, i) => s + i.total, 0);

  return (
    <div className="space-y-6 animate-fade-up" data-testid="invoices-page">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-zinc-500 font-semibold">Billing</p>
          <h1 className="mt-2 font-display text-4xl font-light tracking-tighter">Invoices</h1>
        </div>
        {canManage && (
          <Button onClick={() => setOpen(true)} data-testid="new-invoice-btn" className="bg-white text-black hover:bg-zinc-200 rounded-sm">
            <Plus className="h-4 w-4 mr-2" /> New Invoice
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-md">
        <div className="bg-[#0E0E0E] border border-white/10 rounded-sm p-5">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Paid</p>
          <p className="mt-2 text-2xl font-display font-light text-[#22C55E]">{money(totalPaid)}</p>
        </div>
        <div className="bg-[#0E0E0E] border border-white/10 rounded-sm p-5">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Outstanding</p>
          <p className="mt-2 text-2xl font-display font-light text-[#F59E0B]">{money(totalOutstanding)}</p>
        </div>
      </div>

      {invoices.length === 0 ? (
        <EmptyState icon={ReceiptText} title="No invoices" description={canManage ? "Create your first invoice." : "You have no invoices yet."} />
      ) : (
        <div className="border border-white/10 rounded-sm overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/10 text-[11px] uppercase tracking-wide text-zinc-600">
            <span className="col-span-2">Number</span>
            <span className="col-span-3">Client</span>
            <span className="col-span-3">Project</span>
            <span className="col-span-2 text-right">Amount</span>
            <span className="col-span-2 text-right">Status</span>
          </div>
          {invoices.map((inv) => (
            <div
              key={inv._id}
              data-testid={`invoice-row-${inv._id}`}
              className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-white/10 last:border-0 items-center hover:bg-white/[0.02] transition-colors"
            >
              <span className="col-span-2 font-mono-data text-sm text-zinc-300">{inv.number}</span>
              <span className="col-span-3 text-sm truncate">{inv.clientId?.name || "—"}</span>
              <span className="col-span-3 text-sm text-zinc-500 truncate">{inv.projectId?.name || "—"}</span>
              <span className="col-span-2 text-right font-display font-medium">{money(inv.total)}</span>
              <div className="col-span-2 flex items-center justify-end gap-2">
                <Badge map={INVOICE_STATUS} value={inv.status} />
                {canManage ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger data-testid={`invoice-menu-${inv._id}`} className="text-zinc-600 hover:text-white px-1">⋯</DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#0A0A0A] border-white/10 text-white">
                      <DropdownMenuItem onClick={() => setStatus(inv, "draft")}>Mark Draft</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatus(inv, "sent")}>Mark Sent</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatus(inv, "paid")}>Mark Paid</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => remove(inv._id)} className="text-[#EF4444]">
                        <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  inv.status === "sent" && (
                    <button
                      onClick={() => setStatus(inv, "paid")}
                      data-testid={`mark-paid-${inv._id}`}
                      className="text-xs text-[#22C55E] hover:underline flex items-center gap-1"
                    >
                      <Check className="h-3 w-3" /> Paid
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create invoice */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#0A0A0A] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display font-medium">New Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-400 text-xs uppercase tracking-wide mb-1.5 block">Client</Label>
                <Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v })}>
                  <SelectTrigger className="bg-[#050505] border-white/10 rounded-sm" data-testid="invoice-client-select">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0A0A] border-white/10 text-white">
                    {clients.map((c) => (
                      <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-zinc-400 text-xs uppercase tracking-wide mb-1.5 block">Project (optional)</Label>
                <Select value={form.projectId} onValueChange={(v) => setForm({ ...form, projectId: v })}>
                  <SelectTrigger className="bg-[#050505] border-white/10 rounded-sm">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0A0A] border-white/10 text-white">
                    {projects.filter((p) => !form.clientId || p.clientId?._id === form.clientId).map((p) => (
                      <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-zinc-400 text-xs uppercase tracking-wide mb-1.5 block">Line Items</Label>
              <div className="space-y-2">
                {form.items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2">
                    <Input
                      placeholder="Description"
                      value={it.description}
                      onChange={(e) => updateItem(idx, "description", e.target.value)}
                      data-testid={`item-desc-${idx}`}
                      className="col-span-7 bg-[#050505] border-white/10 rounded-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={it.quantity}
                      onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                      className="col-span-2 bg-[#050505] border-white/10 rounded-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Rate"
                      value={it.rate}
                      onChange={(e) => updateItem(idx, "rate", Number(e.target.value))}
                      className="col-span-3 bg-[#050505] border-white/10 rounded-sm"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={() => setForm((f) => ({ ...f, items: [...f.items, { description: "", quantity: 1, rate: 0 }] }))}
                data-testid="add-item-btn"
                className="mt-2 text-xs text-zinc-400 hover:text-white flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> Add line item
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-400 text-xs uppercase tracking-wide mb-1.5 block">Tax Rate (%)</Label>
                <Input
                  type="number"
                  value={form.taxRate}
                  onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) })}
                  className="bg-[#050505] border-white/10 rounded-sm"
                />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs uppercase tracking-wide mb-1.5 block">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="bg-[#050505] border-white/10 rounded-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0A0A] border-white/10 text-white">
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-6 pt-2 border-t border-white/10 text-sm">
              <span className="text-zinc-500">Subtotal: <span className="text-white font-mono-data">{money(subtotal)}</span></span>
              <span className="text-zinc-300">Total: <span className="text-white font-display font-medium">{money(total)}</span></span>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={save} data-testid="save-invoice-btn" className="bg-white text-black hover:bg-zinc-200 rounded-sm">
              Create Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
