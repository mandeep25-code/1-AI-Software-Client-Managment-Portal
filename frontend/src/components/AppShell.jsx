import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AvatarBubble } from "@/components/common";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Users,
  Building2,
  ReceiptText,
  LogOut,
  Sparkles,
} from "lucide-react";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "team", "client"] },
  { to: "/projects", label: "Projects", icon: FolderKanban, roles: ["admin", "team", "client"] },
  { to: "/tasks", label: "Tasks", icon: ListTodo, roles: ["admin", "team"] },
  { to: "/clients", label: "Clients", icon: Building2, roles: ["admin", "team"] },
  { to: "/team", label: "Team", icon: Users, roles: ["admin"] },
  { to: "/invoices", label: "Invoices", icon: ReceiptText, roles: ["admin", "team", "client"] },
];

const ROLE_LABEL = { admin: "Administrator", team: "Team Member", client: "Client" };

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = NAV.filter((n) => n.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-[#020202] text-white flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-[#080808] border-r border-white/10 flex flex-col fixed h-screen">
        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-white/10">
          <div className="h-7 w-7 rounded-sm bg-white flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-black" />
          </div>
          <span className="font-display font-semibold tracking-tight text-[15px]">Meridian</span>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1" data-testid="sidebar-nav">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              data-testid={`nav-${item.label.toLowerCase()}`}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-colors duration-200",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-zinc-500 hover:text-white hover:bg-white/5"
                )
              }
            >
              <item.icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 py-2">
            <AvatarBubble name={user.name} src={user.avatar} size="h-9 w-9" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-[11px] text-zinc-500 tracking-wide uppercase">
                {ROLE_LABEL[user.role]}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            data-testid="logout-btn"
            className="mt-1 w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-zinc-500 hover:text-white hover:bg-white/5 transition-colors duration-200"
          >
            <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-64 min-h-screen">
        <div className="max-w-[1400px] px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
