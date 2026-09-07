import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Recall" },
      {
        name: "description",
        content:
          "Create a Recall account to keep the agent's memory between sessions, or keep exploring as a guest.",
      },
      { property: "og:title", content: "Sign in — Recall" },
      { property: "og:description", content: "Persistent, private memory across sessions." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/", replace: true });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          setSent(true);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/" });
  }

  return (
    <div className="grain flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/25">
            <Sparkles className="size-4" />
          </span>
          <span className="text-[15px] font-semibold">Recall</span>
        </Link>

        {sent ? (
          <div className="panel p-6">
            <h1 className="text-lg font-semibold">Check your email</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              We sent a confirmation link to {email}. Once you confirm, sign in and your memories
              will persist across sessions.
            </p>
          </div>
        ) : (
          <div className="panel p-6">
            <h1 className="text-xl font-semibold">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="mt-1.5 text-[13px] text-muted-foreground">
              Signed-in memory is private to you and persists between sessions.
            </p>

            <button
              onClick={google}
              className="mt-6 w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm transition hover:bg-secondary"
            >
              Continue with Google
            </button>

            <div className="my-5 flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={submit} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary/50"
              />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary/50"
              />
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                {mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>

            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="mt-4 w-full text-center text-[13px] text-muted-foreground transition hover:text-foreground"
            >
              {mode === "signin" ? "No account? Create one" : "Already have an account? Sign in"}
            </button>
          </div>
        )}

        <Link
          to="/"
          className="mt-4 block text-center text-[13px] text-muted-foreground transition hover:text-foreground"
        >
          Continue as guest instead
        </Link>
      </div>
    </div>
  );
}
