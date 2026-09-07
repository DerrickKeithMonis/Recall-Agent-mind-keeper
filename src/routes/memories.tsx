import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Brain, Check, Loader2, Pencil, Power, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell, useSession } from "@/components/AppShell";
import {
  deleteAllMemories,
  deleteMemory,
  listMemories,
  updateMemory,
} from "@/lib/recall.functions";
import { cn } from "@/lib/utils";

const CATEGORIES = ["Preference", "Personal Context", "Work", "Project", "Instruction", "Other"];

export const Route = createFileRoute("/memories")({
  head: () => ({
    meta: [
      { title: "Memories — Recall" },
      {
        name: "description",
        content:
          "Every memory Recall has stored for you: search, filter by category, edit, deactivate or delete anything at any time.",
      },
      { property: "og:title", content: "Memories — Recall" },
      {
        property: "og:description",
        content: "Complete visibility and control over what the agent remembers about you.",
      },
    ],
  }),
  component: MemoriesPage,
});

function MemoriesPage() {
  const qc = useQueryClient();
  const { isGuest } = useSession();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [confirmWipe, setConfirmWipe] = useState(false);

  const listFn = useServerFn(listMemories);
  const updateFn = useServerFn(updateMemory);
  const deleteFn = useServerFn(deleteMemory);
  const wipeFn = useServerFn(deleteAllMemories);

  const memories = useQuery({ queryKey: ["memories"], queryFn: () => listFn() });
  const refresh = () => qc.invalidateQueries({ queryKey: ["memories"] });

  const update = useMutation({
    mutationFn: (v: { id: string; content?: string; is_active?: boolean }) => updateFn({ data: v }),
    onSuccess: () => {
      setEditing(null);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Memory deleted");
      refresh();
    },
  });
  const wipe = useMutation({
    mutationFn: () => wipeFn(),
    onSuccess: () => {
      setConfirmWipe(false);
      toast.success("All memories deleted");
      refresh();
    },
  });

  const filtered = useMemo(() => {
    const rows = memories.data ?? [];
    return rows.filter(
      (m) =>
        (category === "All" || m.category === category) &&
        (!query || m.content.toLowerCase().includes(query.toLowerCase())),
    );
  }, [memories.data, query, category]);

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-4xl px-6 py-10">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-semibold">
                <Brain className="size-5 text-primary" />
                Memories
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {isGuest
                  ? "Guest demo memories — temporary and tied to this browser session."
                  : "Everything the agent has chosen to remember about you."}
              </p>
            </div>
            <button
              onClick={() => setConfirmWipe(true)}
              disabled={!memories.data?.length}
              className="rounded-xl border border-destructive/40 px-3.5 py-2 text-[13px] text-destructive transition hover:bg-destructive/10 disabled:opacity-40"
            >
              Delete all memories
            </button>
          </header>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
              <Search className="size-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search memories"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["All", ...CATEGORIES].map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[12px] transition",
                    category === c
                      ? "border-primary/50 bg-primary/15 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {memories.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading memories…</p>
            ) : filtered.length === 0 ? (
              <div className="panel px-5 py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  No memories yet. Tell the agent something worth remembering — it saves only what
                  will still be useful in future conversations.
                </p>
              </div>
            ) : (
              filtered.map((m) => (
                <article
                  key={m.id}
                  className={cn(
                    "panel animate-rise p-4 transition",
                    !m.is_active && "opacity-55",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {editing === m.id ? (
                        <div className="flex items-start gap-2">
                          <textarea
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            rows={2}
                            className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
                          />
                          <button
                            onClick={() => update.mutate({ id: m.id, content: draft })}
                            className="rounded-md p-2 text-primary"
                            aria-label="Save memory"
                          >
                            {update.isPending ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Check className="size-4" />
                            )}
                          </button>
                          <button
                            onClick={() => setEditing(null)}
                            className="rounded-md p-2 text-muted-foreground"
                            aria-label="Cancel"
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-[14.5px] leading-relaxed">{m.content}</p>
                      )}
                      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-primary">
                          {m.category}
                        </span>
                        <span>Saved {new Date(m.created_at).toLocaleDateString()}</span>
                        <span>· Updated {new Date(m.updated_at).toLocaleDateString()}</span>
                        {m.last_accessed_at ? (
                          <span>· Last used {new Date(m.last_accessed_at).toLocaleDateString()}</span>
                        ) : null}
                        {!m.is_active ? <span>· Inactive</span> : null}
                      </div>
                    </div>
                    {editing === m.id ? null : (
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          onClick={() => {
                            setEditing(m.id);
                            setDraft(m.content);
                          }}
                          aria-label="Edit memory"
                          className="rounded-md p-2 text-muted-foreground transition hover:text-foreground"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => update.mutate({ id: m.id, is_active: !m.is_active })}
                          aria-label={m.is_active ? "Deactivate memory" : "Reactivate memory"}
                          className={cn(
                            "rounded-md p-2 transition hover:text-foreground",
                            m.is_active ? "text-muted-foreground" : "text-primary",
                          )}
                        >
                          <Power className="size-4" />
                        </button>
                        <button
                          onClick={() => remove.mutate(m.id)}
                          aria-label="Delete memory"
                          className="rounded-md p-2 text-muted-foreground transition hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>

      {confirmWipe ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="panel animate-rise w-full max-w-md p-6">
            <h2 className="text-lg font-semibold">Delete all memories?</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              This permanently removes every memory the agent has stored for you. Conversations stay,
              but the agent will start from zero context.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setConfirmWipe(false)}
                className="rounded-xl border border-border px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => wipe.mutate()}
                disabled={wipe.isPending}
                className="flex items-center gap-2 rounded-xl bg-destructive px-4 py-2 text-sm text-destructive-foreground disabled:opacity-60"
              >
                {wipe.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Delete everything
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
