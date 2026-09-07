import { Brain, Cpu, Database, Layers, Search, Server, User, Wrench } from "lucide-react";

function Node({
  icon: Icon,
  title,
  subtitle,
  accent,
}: {
  icon: typeof User;
  title: string;
  subtitle?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={
        "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 transition " +
        (accent
          ? "border-primary/40 bg-primary/10"
          : "border-border bg-card/70 hover:border-primary/30")
      }
    >
      <span
        className={
          "flex size-9 shrink-0 items-center justify-center rounded-xl " +
          (accent ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground")
        }
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-[13.5px] font-medium">{title}</span>
        {subtitle ? (
          <span className="block text-[11.5px] text-muted-foreground">{subtitle}</span>
        ) : null}
      </span>
    </div>
  );
}

function Connector({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center py-1.5">
      <span className="h-5 w-px bg-gradient-to-b from-border to-primary/50" />
      {label ? (
        <span className="my-1 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          {label}
        </span>
      ) : null}
      <span className="h-5 w-px bg-gradient-to-b from-primary/50 to-border" />
    </div>
  );
}

export function ArchitectureDiagram() {
  return (
    <div className="panel grain p-5 sm:p-7">
      <div className="mx-auto max-w-md">
        <Node icon={User} title="User" subtitle="Browser — no keys, no privileged access" />
        <Connector label="request" />
        <Node icon={Layers} title="Recall frontend" subtitle="TanStack Start · React" />
        <Connector label="server function" />
        <Node
          icon={Server}
          title="Agent controller"
          subtitle="Auth, validation, rate limiting, event log"
          accent
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className="space-y-2">
          <span className="mx-auto block h-5 w-px bg-border sm:mx-0" />
          <Node icon={Cpu} title="LLM" subtitle="Lovable AI Gateway" />
        </div>
        <div className="space-y-2">
          <span className="mx-auto block h-5 w-px bg-border sm:mx-0" />
          <Node icon={Search} title="Memory retrieval" subtitle="Intent → ranked context" accent />
        </div>
        <div className="space-y-2">
          <span className="mx-auto block h-5 w-px bg-border sm:mx-0" />
          <Node
            icon={Wrench}
            title="Tool layer"
            subtitle="search · create · update · delete · list"
          />
        </div>
      </div>

      <div className="mx-auto mt-3 max-w-md">
        <Connector label="embed + rank" />
        <Node icon={Brain} title="Vector search" subtitle="Cosine similarity over embeddings" />
        <Connector label="owner-scoped query" />
        <Node icon={Database} title="Memory database" subtitle="Postgres with row-level security" />
      </div>
    </div>
  );
}
