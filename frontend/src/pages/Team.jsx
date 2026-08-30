import { useEffect, useState } from "react";
import { api, apiError } from "@/lib/api";
import { PageLoader, EmptyState, AvatarBubble } from "@/components/common";
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
import { Plus, Users, Trash2, Shield } from "lucide-react";
import { toast } from "sonner";

const EMPTY = { name: "", email: "", password: "", role: "team", title: "" };

export default function Team() {
  const [members, setMembers] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const load = () => api.get("/team").then((r) => setMembers(r.data));
  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!form.name || !form.email || !form.password)
      return toast.error("Name, email and password required");
    try {
      await api.post("/team", form);
      toast.success("Member added");
      setOpen(false);
      setForm(EMPTY);
      load();
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/team/${id}`);
      load();
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  if (!members) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-up" data-testid="team-page">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-zinc-500 font-semibold">People</p>
          <h1 className="mt-2 font-display text-4xl font-light tracking-tighter">Team</h1>
        </div>
        <Button onClick={() => setOpen(true)} data-testid="new-member-btn" className="bg-white text-black hover:bg-zinc-200 rounded-sm">
          <Plus className="h-4 w-4 mr-2" /> Add Member
        </Button>
      </div>

      {members.length === 0 ? (
        <EmptyState icon={Users} title="No team members" />
      ) : (
        <div className="border border-white/10 rounded-sm overflow-hidden">
          {members.map((m) => (
            <div
              key={m._id}
              data-testid={`member-row-${m._id}`}
              className="flex items-center gap-4 px-5 py-4 border-b border-white/10 last:border-0 hover:bg-white/[0.02] transition-colors"
            >
              <AvatarBubble name={m.name} src={m.avatar} size="h-10 w-10" />
              <div className="flex-1 min-w-0">
                <p className="font-medium flex items-center gap-2">
                  {m.name}
                  {m.role === "admin" && <Shield className="h-3.5 w-3.5 text-[#0088FF]" />}
                </p>
                <p className="text-sm text-zinc-500">{m.title || m.role}</p>
              </div>
              <span className="text-sm text-zinc-500 hidden md:block">{m.email}</span>
              <span className="text-[11px] uppercase tracking-wide px-2.5 py-1 bg-white/5 border border-white/10 rounded-sm text-zinc-400">
                {m.role}
              </span>
              {m.role !== "admin" && (
                <button onClick={() => remove(m._id)} className="text-zinc-600 hover:text-[#EF4444] transition-colors" data-testid={`delete-member-${m._id}`}>
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#0A0A0A] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="font-display font-medium">Add Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-zinc-400 text-xs uppercase tracking-wide mb-1.5 block">Full Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="member-name-input" className="bg-[#050505] border-white/10 rounded-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-400 text-xs uppercase tracking-wide mb-1.5 block">Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="member-email-input" className="bg-[#050505] border-white/10 rounded-sm" />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs uppercase tracking-wide mb-1.5 block">Password</Label>
                <Input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} data-testid="member-password-input" className="bg-[#050505] border-white/10 rounded-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-400 text-xs uppercase tracking-wide mb-1.5 block">Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-[#050505] border-white/10 rounded-sm" />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs uppercase tracking-wide mb-1.5 block">Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger className="bg-[#050505] border-white/10 rounded-sm" data-testid="member-role-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0A0A] border-white/10 text-white">
                    <SelectItem value="team">Team Member</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={save} data-testid="save-member-btn" className="bg-white text-black hover:bg-zinc-200 rounded-sm">
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
