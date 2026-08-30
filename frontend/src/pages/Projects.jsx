import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, apiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  PageLoader,
  Progress,
  Badge,
  PROJECT_STATUS,
  PRIORITY,
  EmptyState,
  AvatarBubble,
  money,
} from "@/components/common";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DatePicker from "@/components/DatePicker";
import { Plus, FolderKanban, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const EMPTY = {
  name: "",
  description: "",
  clientId: "",
  team: [],
  status: "planning",
  priority: "medium",
  progress: 0,
  deadline: null,
  budget: 0,
};

export default function Projects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canManage = user.role === "admin" || user.role === "team";
  const [projects, setProjects] = useState(null);
  const [clients, setClients] = useState([]);
  const [members, setMembers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => api.get("/projects").then((r) => setProjects(r.data));
  useEffect(() => {
    load();
    if (canManage) {
      api.get("/clients").then((r) => setClients(r.data));
      api.get("/team").then((r) => setMembers(r.data));
    }
  }, []);

  const save = async () => {
    if (!form.name) return toast.error("Project name is required");
    setSaving(true);
    try {
      const payload = { ...form, clientId: form.clientId || null };
      await api.post("/projects", payload);
      toast.success("Project created");
      setOpen(false);
      setForm(EMPTY);
      load();
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setSaving(false);
    }
  };

  const toggleMember = (id) =>
    setForm((f) => ({
      ...f,
      team: f.team.includes(id) ? f.team.filter((m) => m !== id) : [...f.team, id],
    }));

  if (!projects) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-up" data-testid="projects-page">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-zinc-500 font-semibold">Workspace</p>
          <h1 className="mt-2 font-display text-4xl font-light tracking-tighter">Projects</h1>
        </div>
        {canManage && (
          <Button
            onClick={() => setOpen(true)}
            data-testid="new-project-btn"
            className="bg-white text-black hover:bg-zinc-200 rounded-sm"
          >
            <Plus className="h-4 w-4 mr-2" /> New Project
          </Button>
        )}
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description={canManage ? "Create your first project to get started." : "You have no assigned projects."}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <div
              key={p._id}
              onClick={() => navigate(`/projects/${p._id}`)}
              data-testid={`project-card-${p._id}`}
              className="group bg-[#0E0E0E] border border-white/10 rounded-sm p-6 hover:border-white/25 cursor-pointer transition-colors duration-200"
            >
              <div className="flex items-start justify-between gap-3">
                <Badge map={PROJECT_STATUS} value={p.status} />
                <Badge map={PRIORITY} value={p.priority} />
              </div>
              <h3 className="mt-4 font-display text-xl font-medium tracking-tight group-hover:text-white">
                {p.name}
              </h3>
              <p className="mt-1 text-sm text-zinc-500 line-clamp-2 min-h-[2.5rem]">
                {p.description || "No description"}
              </p>

              <div className="mt-5">
                <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
                  <span>{p.clientId?.name || "Internal"}</span>
                  <span className="font-mono-data text-zinc-300">{p.progress}%</span>
                </div>
                <Progress value={p.progress} />
              </div>

              <div className="mt-5 flex items-center justify-between">
                <div className="flex -space-x-2">
                  {(p.team || []).slice(0, 3).map((m) => (
                    <AvatarBubble key={m._id} name={m.name} src={m.avatar} />
                  ))}
                  {(!p.team || p.team.length === 0) && (
                    <span className="text-xs text-zinc-600">Unassigned</span>
                  )}
                </div>
                {p.deadline && (
                  <span className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono-data">
                    <CalendarClock className="h-3.5 w-3.5" />
                    {format(new Date(p.deadline), "MMM d")}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#0A0A0A] border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display font-medium">New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Field label="Name">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                data-testid="project-name-input"
                className="bg-[#050505] border-white/10 rounded-sm"
              />
            </Field>
            <Field label="Description">
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                data-testid="project-desc-input"
                className="bg-[#050505] border-white/10 rounded-sm resize-none"
                rows={3}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Client">
                <Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v })}>
                  <SelectTrigger className="bg-[#050505] border-white/10 rounded-sm" data-testid="project-client-select">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0A0A] border-white/10 text-white">
                    {clients.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Priority">
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger className="bg-[#050505] border-white/10 rounded-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0A0A] border-white/10 text-white">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Status">
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="bg-[#050505] border-white/10 rounded-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0A0A] border-white/10 text-white">
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Deadline">
                <DatePicker
                  value={form.deadline}
                  onChange={(v) => setForm({ ...form, deadline: v })}
                  testId="project-deadline"
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Budget ($)">
                <Input
                  type="number"
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })}
                  className="bg-[#050505] border-white/10 rounded-sm"
                />
              </Field>
              <Field label="Progress (%)">
                <Input
                  type="number"
                  value={form.progress}
                  onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })}
                  className="bg-[#050505] border-white/10 rounded-sm"
                />
              </Field>
            </div>
            <Field label="Team">
              <div className="flex flex-wrap gap-2">
                {members.map((m) => (
                  <button
                    key={m._id}
                    type="button"
                    onClick={() => toggleMember(m._id)}
                    className={`px-3 py-1.5 rounded-sm text-xs border transition-colors ${
                      form.team.includes(m._id)
                        ? "bg-white text-black border-white"
                        : "bg-[#050505] text-zinc-400 border-white/10 hover:border-white/25"
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </Field>
          </div>
          <DialogFooter>
            <Button
              onClick={save}
              disabled={saving}
              data-testid="save-project-btn"
              className="bg-white text-black hover:bg-zinc-200 rounded-sm"
            >
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <Label className="text-zinc-400 text-xs uppercase tracking-wide mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}
