import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PageLoader, EmptyState } from "@/components/common";
import KanbanBoard from "@/components/KanbanBoard";
import { ListTodo } from "lucide-react";

export default function Tasks() {
  const { user } = useAuth();
  const canEdit = user.role === "admin" || user.role === "team";
  const [tasks, setTasks] = useState(null);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);

  const load = () => api.get("/tasks").then((r) => setTasks(r.data));
  useEffect(() => {
    load();
    api.get("/projects").then((r) => setProjects(r.data));
    if (canEdit) api.get("/team").then((r) => setMembers(r.data));
  }, []);

  if (!tasks) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-up" data-testid="tasks-page">
      <div>
        <p className="text-xs tracking-[0.2em] uppercase text-zinc-500 font-semibold">Board</p>
        <h1 className="mt-2 font-display text-4xl font-light tracking-tighter">All Tasks</h1>
      </div>
      {projects.length === 0 ? (
        <EmptyState icon={ListTodo} title="No projects" description="Create a project first to add tasks." />
      ) : (
        <KanbanBoard
          tasks={tasks}
          reload={load}
          members={members}
          projects={projects}
          canEdit={canEdit}
        />
      )}
    </div>
  );
}
