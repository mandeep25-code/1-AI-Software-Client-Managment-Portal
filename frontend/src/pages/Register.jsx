import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth, apiError } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success("Account created");
      navigate("/");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020202] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="h-8 w-8 rounded-sm bg-white flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-black" />
          </div>
          <span className="font-display font-semibold text-lg tracking-tight">Meridian</span>
        </div>
        <h2 className="font-display text-3xl font-light tracking-tight">Create your account</h2>
        <p className="mt-2 text-sm text-zinc-500">Sign up as a client to access your portal.</p>

        <form onSubmit={submit} className="mt-8 space-y-4" data-testid="register-form">
          <div>
            <Label className="text-zinc-400 text-xs uppercase tracking-wide">Full name</Label>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              data-testid="register-name"
              className="mt-1.5 bg-[#0A0A0A] border-white/10 focus:border-white/30 rounded-sm h-11"
            />
          </div>
          <div>
            <Label className="text-zinc-400 text-xs uppercase tracking-wide">Email</Label>
            <Input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              data-testid="register-email"
              className="mt-1.5 bg-[#0A0A0A] border-white/10 focus:border-white/30 rounded-sm h-11"
            />
          </div>
          <div>
            <Label className="text-zinc-400 text-xs uppercase tracking-wide">Password</Label>
            <Input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              data-testid="register-password"
              className="mt-1.5 bg-[#0A0A0A] border-white/10 focus:border-white/30 rounded-sm h-11"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            data-testid="register-submit"
            className="w-full h-11 bg-white text-black hover:bg-zinc-200 rounded-sm font-medium"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Create account <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </form>

        <p className="mt-6 text-sm text-zinc-500">
          Already have an account?{" "}
          <Link to="/login" className="text-white hover:underline" data-testid="to-login">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
