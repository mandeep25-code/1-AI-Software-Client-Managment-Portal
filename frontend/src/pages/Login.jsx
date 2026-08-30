import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth, apiError } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  const quick = (em, pw) => {
    setEmail(em);
    setPassword(pw);
  };

  return (
    <div className="min-h-screen bg-[#020202] text-white flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex w-1/2 relative border-r border-white/10 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1526289034009-0240ddb68ce3?crop=entropy&cs=srgb&fm=jpg&w=1400&q=80"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-20"
          aria-hidden="true"
        />
        <div className="absolute inset-0 grain opacity-[0.15]" aria-hidden="true" />
        <div className="relative z-10 flex flex-col justify-between p-12">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-sm bg-white flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-black" />
            </div>
            <span className="font-display font-semibold text-lg tracking-tight">Meridian</span>
          </div>
          <div>
            <h1 className="font-display text-5xl font-light tracking-tighter leading-[1.05]">
              The operating system for
              <br />
              <span className="text-zinc-500">software agencies.</span>
            </h1>
            <p className="mt-6 text-zinc-400 max-w-md leading-relaxed">
              Manage projects, teams, clients and invoices in one premium workspace — with Gemini AI
              writing your status reports, tasks and client emails.
            </p>
          </div>
          <p className="text-xs text-zinc-600 tracking-wide">Powered by Google Gemini</p>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm animate-fade-up">
          <h2 className="font-display text-3xl font-light tracking-tight">Welcome back</h2>
          <p className="mt-2 text-sm text-zinc-500">Sign in to your workspace.</p>

          <form onSubmit={submit} className="mt-8 space-y-4" data-testid="login-form">
            <div>
              <Label className="text-zinc-400 text-xs uppercase tracking-wide">Email</Label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="login-email"
                className="mt-1.5 bg-[#0A0A0A] border-white/10 focus:border-white/30 rounded-sm h-11"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <Label className="text-zinc-400 text-xs uppercase tracking-wide">Password</Label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="login-password"
                className="mt-1.5 bg-[#0A0A0A] border-white/10 focus:border-white/30 rounded-sm h-11"
                placeholder="••••••••"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              data-testid="login-submit"
              className="w-full h-11 bg-white text-black hover:bg-zinc-200 rounded-sm font-medium"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Sign in <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-sm text-zinc-500">
            No account?{" "}
            <Link to="/register" className="text-white hover:underline" data-testid="to-register">
              Create one
            </Link>
          </p>

          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-[11px] uppercase tracking-[0.15em] text-zinc-600 mb-3">
              Demo accounts
            </p>
            <div className="space-y-2 text-xs">
              <button
                onClick={() => quick("mandeeps0564@gmail.com", "Admin@123")}
                className="w-full text-left px-3 py-2 bg-[#0A0A0A] border border-white/10 rounded-sm hover:border-white/25 transition-colors"
                data-testid="demo-admin"
              >
                <span className="text-white">Admin</span>{" "}
                <span className="text-zinc-500">mandeeps0564@gmail.com</span>
              </button>
              <button
                onClick={() => quick("sarah@agency.com", "Team@123")}
                className="w-full text-left px-3 py-2 bg-[#0A0A0A] border border-white/10 rounded-sm hover:border-white/25 transition-colors"
                data-testid="demo-team"
              >
                <span className="text-white">Team</span>{" "}
                <span className="text-zinc-500">sarah@agency.com</span>
              </button>
              <button
                onClick={() => quick("client@acme.com", "Client@123")}
                className="w-full text-left px-3 py-2 bg-[#0A0A0A] border border-white/10 rounded-sm hover:border-white/25 transition-colors"
                data-testid="demo-client"
              >
                <span className="text-white">Client</span>{" "}
                <span className="text-zinc-500">client@acme.com</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
