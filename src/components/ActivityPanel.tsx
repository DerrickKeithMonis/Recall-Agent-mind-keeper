import { Activity, ChevronRight, Check, Search, Database, Wrench, AlertTriangle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type AgentEvent = {
  id: string;
  event_type: string;
  label: string;
  detail: Record<string, unknown> | null;
  created_at: string;
};

const iconFor = (type: string) => {
  if (type.startsWith("memory_search")) return Search;
  if (type.startsWith("memory_")) return Database;
  if (type === "tool_called") return Wrench;
  if (type === "error") return AlertTriangle;
  if (type === "response_generated") return Sparkles;
  return Check;
};

export function ActivityPanel({
  events,
  open,
  onToggle,
  running,
}: {
  events: AgentEvent[];
  open: boolean;
  onToggle: () => void;
  running: boolean;
}) {
  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-l border-border bg-surface/60 transition-all duration-300",
        open ? "w-full md:w-[330px]" : "w-[52px]",
      )}
    >
      <div className="flex items-center gap-2 border-b border-border px-3 py-3.5">
        <button
          onClick={onToggle}
          aria-label={open ? "Collapse agent activity" : "Expand agent activity"}
          className="rounded-md p-1.5 text-muted-foreground transition hover:text-foreground"
        >
          {open ? <ChevronRight className="size-4" /> : <Activity className="size-4" />}
        </button>
        {open ? (
          <div className="flex min-w-0 flex-1 items-center justify-between">
            <span className="text-[13px] font-medium">Agent activity</span>
            {running ? (
              <span className="flex items-center gap-1 text-[11px] text-primary">
                <span className="typing-dot size-1.5 rounded-full bg-primary" />
                running
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {open ? (
        <div className="flex-1 space-y-1 overflow-y-auto p-3">
          {events.length === 0 ? (
            <p className="px-1 py-2 text-xs leading-relaxed text-muted-foreground">
              Observable agent steps — retrieval, tool calls and results — appear here as you chat.
              Private model reasoning is never shown or stored.
            </p>
          ) : (
            events.map((e) => {
              const Icon = iconFor(e.event_type);
              const matches = (e.detail?.["matches"] ?? []) as { summary: string; score: number }[];
              return (
                <div key={e.id} className="animate-rise rounded-xl border border-border/60 bg-card/60 p-2.5">
                  <div className="flex items-start gap-2">
                    <Icon
                      className={cn(
                        "mt-0.5 size-3.5 shrink-0",
                        e.event_type === "error" ? "text-destructive" : "text-primary",
                      )}
                    />
                    <div className="min-w-0">
                      <p className="text-[12.5px] leading-snug">{e.label}</p>
                      <p className="mt-0.5 font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
                        {e.event_type}
                      </p>
                      {matches.length ? (
                        <ul className="mt-1.5 space-y-1">
                          {matches.map((m, i) => (
                            <li key={i} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              <span className="truncate">{m.summary}</span>
                              <span className="ml-auto font-mono text-primary">{m.score.toFixed(2)}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : null}
    </aside>
  );
}
