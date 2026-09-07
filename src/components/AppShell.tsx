import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, type ReactNode } from "react";
import {
  Brain,
  FlaskConical,
  Loader2,
  LogOut,
  MessagesSquare,
  PanelLeft,
  Plus,
  ScrollText,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { createConversation, deleteConversation, listConversations } from "@/lib/recall.functions";
import { cn } from "@/lib/utils";

export function useSession() {
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email ?? null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  return { email, ready, isGuest: !email };
}

const navItems = [
  { to: "/memories", label: "Memories", icon: Brain },
  { to: "/evaluation", label: "Agent evaluation", icon: FlaskConical },
  { to: "/about", label: "About the agent", icon: ScrollText },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { email } = useSession();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const listFn = useServerFn(listConversations);
  const createFn = useServerFn(createConversation);
  const deleteFn = useServerFn(deleteConversation);

  const conversations = useQuery({
    queryKey: ["conversations", email],
    queryFn: () => listFn(),
  });

  const create = useMutation({
    mutationFn: () => createFn(),
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      setOpen(false);
      navigate({ to: "/c/$conversationId", params: { conversationId: c.id } });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      navigate({ to: "/" });
    },
  });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="grain flex min-h-screen bg-background">
      {open ? (
        <button
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[268px] flex-col border-r border-border bg-sidebar transition-transform duration-300 md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="px-5 pt-6 pb-4">
          <Link to="/" className="group flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/25">
              <Sparkles className="size-4" />
            </span>
            <span>
              <span className="block text-[15px] font-semibold tracking-tight">Recall</span>
              <span className="block text-[11px] text-muted-foreground">
                An AI agent that remembers what matters.
              </span>
            </span>
          </Link>
        </div>

        <div className="px-3">
          <button
            onClick={() => create.mutate()}
            disabled={create.isPending}
            className="flex w-full items-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {create.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            New conversation
          </button>
        </div>

        <nav className="mt-5 px-3">
          <p className="px-2 pb-2 text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
            Conversations
          </p>
          <div className="max-h-[38vh] space-y-0.5 overflow-y-auto pr-1">
            {conversations.isLoading ? (
              <p className="px-2 py-1.5 text-xs text-muted-foreground">Loading…</p>
            ) : conversations.data?.length ? (
              conversations.data.map((c) => (
                <div
                  key={c.id}
                  className={cn(
                    "group flex items-center gap-1 rounded-lg pr-1 transition",
                    pathname === `/c/${c.id}` ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/60",
                  )}
                >
                  <Link
                    to="/c/$conversationId"
                    params={{ conversationId: c.id }}
                    onClick={() => setOpen(false)}
                    className="flex min-w-0 flex-1 items-center gap-2 px-2 py-2 text-[13px]"
                  >
                    <MessagesSquare className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{c.title}</span>
                  </Link>
                  <button
                    aria-label="Delete conversation"
                    onClick={() => remove.mutate(c.id)}
                    className="rounded-md p-1.5 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <p className="px-2 py-1.5 text-xs text-muted-foreground">No conversations yet.</p>
            )}
          </div>

          <div className="mt-5 space-y-0.5">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] transition",
                  pathname === item.to
                    ? "bg-sidebar-accent text-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="mt-auto border-t border-sidebar-border p-3">
          {email ? (
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs">
                <UserRound className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px]">{email}</span>
                <span className="block text-[11px] text-muted-foreground">Persistent memory</span>
              </span>
              <button
                onClick={signOut}
                aria-label="Sign out"
                className="rounded-md p-2 text-muted-foreground transition hover:text-foreground"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Guest demo. Memories are temporary and tied to this browser session — don't enter
                sensitive information.
              </p>
              <Link
                to="/auth"
                className="block rounded-lg border border-border px-3 py-2 text-center text-[13px] transition hover:bg-sidebar-accent"
              >
                Sign in for persistent memory
              </Link>
            </div>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3 md:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-md p-2">
            <PanelLeft className="size-4" />
          </button>
          <span className="text-sm font-medium">Recall</span>
        </div>
        {children}
      </div>
    </div>
  );
}
