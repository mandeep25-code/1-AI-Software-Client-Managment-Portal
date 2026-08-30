import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { StatCard, PageLoader, Progress, Badge, PROJECT_STATUS, money } from "@/components/common";
import { FolderKanban, ListChecks, Building2, DollarSign, ArrowUpRight } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Cell,
  PieChart,
  Pie,
} from "recharts";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    Promise.all([api.get("/dashboard/stats"), api.get("/projects")]).then(([s, p]) => {
      setStats(s.data);
      setProjects(p.data);
    });
  }, []);

  if (!stats) return <PageLoader />;

  const taskData = [
    { name: "To Do", value: stats.tasksByStatus.todo || 0, color: "#71717a" },
    { name: "In Progress", value: stats.tasksByStatus.in_progress || 0, color: "#F59E0B" },
    { name: "Done", value: stats.tasksByStatus.done || 0, color: "#22C55E" },
  ];
  const projData = [
    { name: "Planning", value: stats.projectsByStatus.planning || 0 },
    { name: "Active", value: stats.projectsByStatus.active || 0 },
    { name: "On Hold", value: stats.projectsByStatus.on_hold || 0 },
    { name: "Done", value: stats.projectsByStatus.completed || 0 },
  ];
  const isClient = user.role === "client";

  return (
    <div className="space-y-8 animate-fade-up" data-testid="dashboard-page">
      <div>
        <p className="text-xs tracking-[0.2em] uppercase text-zinc-500 font-semibold">
          {isClient ? "Client Workspace" : "Overview"}
        </p>
        <h1 className="mt-2 font-display text-4xl font-light tracking-tighter">
          Welcome, {user.name.split(" ")[0]}.
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={isClient ? "My Projects" : "Total Projects"}
          value={stats.totalProjects}
          icon={FolderKanban}
          sub={`${stats.activeProjects} active`}
          testId="stat-projects"
        />
        <StatCard
          label="Tasks"
          value={stats.totalTasks}
          icon={ListChecks}
          sub={`${stats.tasksByStatus.done || 0} completed`}
          testId="stat-tasks"
        />
        <StatCard
          label={isClient ? "Avg Progress" : "Clients"}
          value={isClient ? `${stats.avgProgress}%` : stats.clientsCount}
          icon={Building2}
          testId="stat-clients"
        />
        <StatCard
          label={isClient ? "Outstanding" : "Revenue (Paid)"}
          value={money(isClient ? stats.revenue.outstanding : stats.revenue.paid)}
          icon={DollarSign}
          accent="text-[#22C55E]"
          sub={isClient ? undefined : `${money(stats.revenue.outstanding)} outstanding`}
          testId="stat-revenue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Task distribution */}
        <div className="bg-[#0E0E0E] border border-white/10 rounded-sm p-6">
          <h3 className="font-display font-medium text-lg">Task Distribution</h3>
          <div className="h-52 mt-4 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskData}
                  dataKey="value"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  stroke="none"
                >
                  {taskData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-2">
            {taskData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-zinc-400">
                  <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                  {d.name}
                </span>
                <span className="font-mono-data text-white">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Projects by status */}
        <div className="bg-[#0E0E0E] border border-white/10 rounded-sm p-6 lg:col-span-2">
          <h3 className="font-display font-medium text-lg">Projects by Status</h3>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projData} barCategoryGap="35%">
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#71717a", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                  {projData.map((_, i) => (
                    <Cell key={i} fill={["#52525b", "#22C55E", "#F59E0B", "#0088FF"][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-medium text-lg">Recent Projects</h3>
          <button
            onClick={() => navigate("/projects")}
            className="text-sm text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
            data-testid="view-all-projects"
          >
            View all <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
        <div className="border border-white/10 rounded-sm overflow-hidden">
          {projects.slice(0, 5).map((p) => (
            <div
              key={p._id}
              onClick={() => navigate(`/projects/${p._id}`)}
              data-testid={`dashboard-project-${p._id}`}
              className="flex items-center gap-4 px-5 py-4 border-b border-white/10 last:border-0 hover:bg-white/[0.02] cursor-pointer transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{p.name}</p>
                <p className="text-sm text-zinc-500 truncate">{p.clientId?.name || "Internal"}</p>
              </div>
              <div className="w-40 hidden md:block">
                <div className="flex items-center gap-3">
                  <Progress value={p.progress} />
                  <span className="text-xs font-mono-data text-zinc-400 w-9 text-right">
                    {p.progress}%
                  </span>
                </div>
              </div>
              <Badge map={PROJECT_STATUS} value={p.status} />
            </div>
          ))}
          {projects.length === 0 && (
            <p className="px-5 py-10 text-center text-sm text-zinc-500">No projects yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
