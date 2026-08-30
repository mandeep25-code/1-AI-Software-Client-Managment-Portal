import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, apiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  PageLoader,
  Progress,
  Badge,
  PROJECT_STATUS,
  PRIORITY,
  INVOICE_STATUS,
  AvatarBubble,
  money,
  EmptyState,
} from "@/components/common";
import KanbanBoard from "@/components/KanbanBoard";
import AITextModal from "@/components/AITextModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Sparkles,
  Send,
  Upload,
  Download,
  Trash2,
  FileText,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = user.role === "admin" || user.role === "team";
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [aiOpen, setAiOpen] = useState(false);

  const loadTasks = () => api.get(`/tasks?projectId=${id}`).then((r) => setTasks(r.data));
  useEffect(() => {
    api
      .get(`/projects/${id}`)
      .then((r) => setProject(r.data))
      .catch((e) => {
        toast.error(apiError(e));
        navigate("/projects");
      });
    loadTasks();
    if (canEdit) api.get("/team").then((r) => setMembers(r.data));
  }, [id]);

  if (!project) return <PageLoader />;

  const done = tasks.filter((t) => t.status === "done").length;

  return (
    <div className="space-y-6 animate-fade-up" data-testid="project-detail-page">
      <button
        onClick={() => navigate("/projects")}
        className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors"
        data-testid="back-btn"
      >
        <ArrowLeft className="h-4 w-4" /> Projects
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Badge map={PROJECT_STATUS} value={project.status} />
            <Badge map={PRIORITY} value={project.priority} />
          </div>
          <h1 className="mt-3 font-display text-4xl font-light tracking-tighter">{project.name}</h1>
          <p className="mt-2 text-zinc-500 max-w-2xl">{project.description}</p>
        </div>
        <Button
          onClick={() => setAiOpen(true)}
          data-testid="ai-summary-btn"
          className="bg-[#0055FF] hover:bg-[#0044CC] text-white rounded-sm shadow-[0_0_18px_rgba(0,85,255,0.3)]"
        >
          <Sparkles className="h-4 w-4 mr-2" /> AI Status Report
        </Button>
      </div>

      {/* Meta cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetaCard label="Client" value={project.clientId?.name || "Internal"} />
        <MetaCard label="Budget" value={money(project.budget)} />
        <MetaCard
          label="Deadline"
          value={project.deadline ? format(new Date(project.deadline), "MMM d, yyyy") : "—"}
        />
        <div className="bg-[#0E0E0E] border border-white/10 rounded-sm p-5">
          <p className="text-xs tracking-[0.15em] uppercase text-zinc-500 font-semibold">Progress</p>
          <div className="mt-3 flex items-center gap-3">
            <Progress value={project.progress} />
            <span className="font-mono-data text-sm text-white">{project.progress}%</span>
          </div>
          <p className="mt-2 text-xs text-zinc-600">{done}/{tasks.length} tasks done</p>
        </div>
      </div>

      <Tabs defaultValue="tasks">
        <TabsList className="bg-[#0A0A0A] border border-white/10 rounded-sm p-1">
          <TabsTrigger value="tasks" data-testid="tab-tasks" className="rounded-sm data-[state=active]:bg-white data-[state=active]:text-black">Tasks</TabsTrigger>
          <TabsTrigger value="messages" data-testid="tab-messages" className="rounded-sm data-[state=active]:bg-white data-[state=active]:text-black">Messages</TabsTrigger>
          <TabsTrigger value="files" data-testid="tab-files" className="rounded-sm data-[state=active]:bg-white data-[state=active]:text-black">Files</TabsTrigger>
          <TabsTrigger value="invoices" data-testid="tab-invoices" className="rounded-sm data-[state=active]:bg-white data-[state=active]:text-black">Invoices</TabsTrigger>
          <TabsTrigger value="team" data-testid="tab-team" className="rounded-sm data-[state=active]:bg-white data-[state=active]:text-black">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-6">
          <KanbanBoard
            tasks={tasks}
            reload={loadTasks}
            members={members}
            fixedProjectId={id}
            canEdit={canEdit}
          />
        </TabsContent>

        <TabsContent value="messages" className="mt-6">
          <Messages projectId={id} user={user} />
        </TabsContent>

        <TabsContent value="files" className="mt-6">
          <Files projectId={id} canManage={canEdit} />
        </TabsContent>

        <TabsContent value="invoices" className="mt-6">
          <ProjectInvoices projectId={id} />
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(project.team || []).map((m) => (
              <div key={m._id} className="flex items-center gap-3 bg-[#0E0E0E] border border-white/10 rounded-sm p-4">
                <AvatarBubble name={m.name} src={m.avatar} size="h-10 w-10" />
                <div>
                  <p className="font-medium">{m.name}</p>
                  <p className="text-xs text-zinc-500">{m.title || "Team Member"}</p>
                </div>
              </div>
            ))}
            {(!project.team || project.team.length === 0) && (
              <p className="text-sm text-zinc-500">No team members assigned.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <AITextModal
        open={aiOpen}
        onOpenChange={setAiOpen}
        title="AI Status Report"
        description="Gemini summarizes progress, recent work and next steps for this project."
        endpoint="/ai/summarize"
        body={{ projectId: id }}
      />
    </div>
  );
}

function MetaCard({ label, value }) {
  return (
    <div className="bg-[#0E0E0E] border border-white/10 rounded-sm p-5">
      <p className="text-xs tracking-[0.15em] uppercase text-zinc-500 font-semibold">{label}</p>
      <p className="mt-3 text-lg font-display font-medium truncate">{value}</p>
    </div>
  );
}

function Messages({ projectId, user }) {
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const load = () => api.get(`/messages?projectId=${projectId}`).then((r) => setMessages(r.data));
  useEffect(() => {
    load();
  }, [projectId]);

  const send = async () => {
    if (!body.trim()) return;
    setSending(true);
    try {
      await api.post("/messages", { projectId, body });
      setBody("");
      load();
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-[#0A0A0A] border border-white/10 rounded-sm flex flex-col h-[500px]">
      <div className="flex-1 overflow-y-auto p-5 space-y-4" data-testid="messages-list">
        {messages.length === 0 && (
          <EmptyState icon={MessageSquare} title="No messages yet" description="Start the conversation." />
        )}
        {messages.map((m) => {
          const mine = m.senderName === user.name;
          return (
            <div key={m._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-zinc-400">{m.senderName}</span>
                  <span className="text-[10px] uppercase tracking-wide text-zinc-600">{m.senderRole}</span>
                </div>
                <div
                  className={`px-4 py-2.5 rounded-sm text-sm ${
                    mine ? "bg-white text-black" : "bg-[#141414] text-zinc-200 border border-white/10"
                  }`}
                >
                  {m.body}
                </div>
                <span className="text-[10px] text-zinc-600 mt-1">
                  {format(new Date(m.createdAt), "MMM d, HH:mm")}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-white/10 p-3 flex gap-2">
        <Input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Write a message…"
          data-testid="message-input"
          className="bg-[#050505] border-white/10 rounded-sm"
        />
        <Button onClick={send} disabled={sending} data-testid="send-message-btn" className="bg-white text-black hover:bg-zinc-200 rounded-sm">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function Files({ projectId, canManage }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef();
  const load = () => api.get(`/files?projectId=${projectId}`).then((r) => setFiles(r.data));
  useEffect(() => {
    load();
  }, [projectId]);

  const upload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("projectId", projectId);
    try {
      await api.post("/files/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("File uploaded");
      load();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const download = (f) => {
    const token = localStorage.getItem("token");
    window.open(`${api.defaults.baseURL}/files/${f._id}/download?auth=${token}`, "_blank");
  };

  const remove = async (f) => {
    try {
      await api.delete(`/files/${f._id}`);
      load();
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <input ref={inputRef} type="file" hidden onChange={upload} data-testid="file-input" />
        <Button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          data-testid="upload-file-btn"
          className="bg-white text-black hover:bg-zinc-200 rounded-sm"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
          Upload File
        </Button>
      </div>
      {files.length === 0 ? (
        <EmptyState icon={FileText} title="No files" description="Upload project files to share with the team and client." />
      ) : (
        <div className="border border-white/10 rounded-sm overflow-hidden">
          {files.map((f) => (
            <div
              key={f._id}
              data-testid={`file-row-${f._id}`}
              className="flex items-center gap-4 px-5 py-3.5 border-b border-white/10 last:border-0 hover:bg-white/[0.02] transition-colors"
            >
              <FileText className="h-5 w-5 text-zinc-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{f.originalName}</p>
                <p className="text-xs text-zinc-600">
                  {(f.size / 1024).toFixed(0)} KB · {f.uploaderName}
                </p>
              </div>
              <button onClick={() => download(f)} className="text-zinc-400 hover:text-white transition-colors" data-testid={`download-${f._id}`}>
                <Download className="h-4 w-4" />
              </button>
              {canManage && (
                <button onClick={() => remove(f)} className="text-zinc-600 hover:text-[#EF4444] transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectInvoices({ projectId }) {
  const [invoices, setInvoices] = useState([]);
  useEffect(() => {
    api.get("/invoices").then((r) => setInvoices(r.data.filter((i) => i.projectId?._id === projectId || i.projectId === projectId)));
  }, [projectId]);

  if (invoices.length === 0)
    return <EmptyState icon={FileText} title="No invoices" description="No invoices for this project." />;

  return (
    <div className="border border-white/10 rounded-sm overflow-hidden">
      {invoices.map((inv) => (
        <div key={inv._id} className="flex items-center gap-4 px-5 py-4 border-b border-white/10 last:border-0">
          <span className="font-mono-data text-sm text-zinc-400 w-20">{inv.number}</span>
          <span className="flex-1 font-display font-medium">{money(inv.total)}</span>
          <Badge map={INVOICE_STATUS} value={inv.status} />
        </div>
      ))}
    </div>
  );
}
