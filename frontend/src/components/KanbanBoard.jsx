import { useState } from "react";
import { api, apiError } from "@/lib/api";
import { Badge, PRIORITY, AvatarBubble } from "@/components/common";
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
import { Plus, Sparkles, Trash2, Loader2, GripVertical } from "lucide-react";
import { toast } from "sonner";

const COLUMNS = [
  { key: "todo", label: "To Do", color: "#71717a" },
  { key: "in_progress", label: "In Progress", color: "#F59E0B" },
  { key: "done", label: "Done", color: "#22C55E" },
];

export default function KanbanBoard({
  tasks,
  reload,
  members = [],
  projects = [],
  fixedProjectId,
  canEdit,
}) {
  const [open, setOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiBrief, setAiBrief] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    priority: "medium",
    assigneeId: "",
    projectId: fixedProjectId || "",
  });
  const [dragId, setDragId] = useState(null);

  const move = async (taskId, status) => {
    try {
      await api.put(`/tasks/${taskId}`, { status });
      reload();
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  const create = async () => {
    if (!form.title) return toast.error("Title required");
    if (!form.projectId) return toast.error("Select a project");
    try {
      await api.post("/tasks", {
        title: form.title,
        priority: form.priority,
        assigneeId: form.assigneeId || null,
        projectId: form.projectId,
      });
      toast.success("Task added");
      setOpen(false);
      setForm({ title: "", priority: "medium", assigneeId: "", projectId: fixedProjectId || "" });
      reload();
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/tasks/${id}`);
      reload();
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  const generateAI = async () => {
    setAiLoading(true);
    try {
      const { data } = await api.post("/ai/generate-tasks", {
        projectId: fixedProjectId,
        brief: aiBrief,
        persist: true,
      });
      toast.success(`Gemini created ${data.created.length} tasks`);
      setAiOpen(false);
      setAiBrief("");
      reload();
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div data-testid="kanban-board">
      {canEdit && (
        <div className="flex gap-2 mb-5">
          <Button
            onClick={() => setOpen(true)}
            data-testid="new-task-btn"
            className="bg-white text-black hover:bg-zinc-200 rounded-sm"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Task
          </Button>
          {fixedProjectId && (
            <Button
              onClick={() => setAiOpen(true)}
              data-testid="ai-generate-tasks-btn"
              className="bg-[#0055FF] hover:bg-[#0044CC] text-white rounded-sm shadow-[0_0_18px_rgba(0,85,255,0.3)]"
            >
              <Sparkles className="h-4 w-4 mr-2" /> Generate Tasks (AI)
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key);
          return (
            <div
              key={col.key}
              onDragOver={(e) => canEdit && e.preventDefault()}
              onDrop={() => {
                if (canEdit && dragId) move(dragId, col.key);
                setDragId(null);
              }}
              className="bg-[#080808] border border-white/10 rounded-sm p-3 min-h-[300px]"
              data-testid={`kanban-col-${col.key}`}
            >
              <div className="flex items-center justify-between px-2 py-1.5 mb-2">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <span className="h-2 w-2 rounded-full" style={{ background: col.color }} />
                  {col.label}
                </span>
                <span className="text-xs font-mono-data text-zinc-500">{colTasks.length}</span>
              </div>
              <div className="space-y-2">
                {colTasks.map((t) => (
                  <div
                    key={t._id}
                    draggable={canEdit}
                    onDragStart={() => setDragId(t._id)}
                    data-testid={`kanban-card-${t._id}`}
                    className="group bg-[#111111] border border-white/10 rounded-sm p-3 hover:border-white/25 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      {canEdit && (
                        <GripVertical className="h-4 w-4 text-zinc-700 mt-0.5 shrink-0 cursor-grab" />
                      )}
                      <p className="text-sm text-zinc-100 flex-1">{t.title}</p>
                      {canEdit && (
                        <button
                          onClick={() => remove(t._id)}
                          className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-[#EF4444] transition-opacity"
                          data-testid={`delete-task-${t._id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <Badge map={PRIORITY} value={t.priority} />
                      {t.projectId?.name && !fixedProjectId && (
                        <span className="text-[10px] text-zinc-600 truncate max-w-[90px]">
                          {t.projectId.name}
                        </span>
                      )}
                      {t.assigneeId && <AvatarBubble name={t.assigneeId.name} src={t.assigneeId.avatar} size="h-6 w-6" />}
                    </div>
                  </div>
                ))}
                {colTasks.length === 0 && (
                  <p className="text-xs text-zinc-700 text-center py-6">Empty</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create task */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#0A0A0A] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="font-display font-medium">Add Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-zinc-400 text-xs uppercase tracking-wide mb-1.5 block">Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                data-testid="task-title-input"
                className="bg-[#050505] border-white/10 rounded-sm"
              />
            </div>
            {!fixedProjectId && (
              <div>
                <Label className="text-zinc-400 text-xs uppercase tracking-wide mb-1.5 block">Project</Label>
                <Select value={form.projectId} onValueChange={(v) => setForm({ ...form, projectId: v })}>
                  <SelectTrigger className="bg-[#050505] border-white/10 rounded-sm">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0A0A] border-white/10 text-white">
                    {projects.map((p) => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-400 text-xs uppercase tracking-wide mb-1.5 block">Priority</Label>
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
              </div>
              <div>
                <Label className="text-zinc-400 text-xs uppercase tracking-wide mb-1.5 block">Assignee</Label>
                <Select value={form.assigneeId} onValueChange={(v) => setForm({ ...form, assigneeId: v })}>
                  <SelectTrigger className="bg-[#050505] border-white/10 rounded-sm">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0A0A] border-white/10 text-white">
                    {members.map((m) => (
                      <SelectItem key={m._id} value={m._id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={create} data-testid="save-task-btn" className="bg-white text-black hover:bg-zinc-200 rounded-sm">
              Add Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI generate */}
      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent className="bg-[#0A0A0A] border-white/10 text-white">
          <div className="absolute top-0 left-0 right-0 h-0.5 ai-tracing" aria-hidden="true" />
          <DialogHeader>
            <DialogTitle className="font-display font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#0055FF]" /> Generate Tasks with Gemini
            </DialogTitle>
            <p className="text-sm text-zinc-500">
              Describe the work and Gemini will break it into tasks and add them to this board.
            </p>
          </DialogHeader>
          <div className="py-2">
            <Input
              value={aiBrief}
              onChange={(e) => setAiBrief(e.target.value)}
              placeholder="e.g. Build a REST API with auth, CRUD and tests"
              data-testid="ai-brief-input"
              className="bg-[#050505] border-white/10 rounded-sm"
            />
          </div>
          <DialogFooter>
            <Button
              onClick={generateAI}
              disabled={aiLoading}
              data-testid="run-generate-tasks-btn"
              className="bg-[#0055FF] hover:bg-[#0044CC] text-white rounded-sm"
            >
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 mr-2" /> Generate</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
