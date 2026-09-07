import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CircleCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ArchitectureDiagram } from "@/components/ArchitectureDiagram";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About the agent — Recall case study" },
      {
        name: "description",
        content:
          "How Recall works: intent analysis, memory decisions, semantic retrieval, tool calling and a secure server-side agent controller.",
      },
      { property: "og:title", content: "About the agent — Recall case study" },
      {
        property: "og:description",
        content: "An AI product case study on controlled persistent memory for agents.",
      },
    ],
  }),
  component: About,
});

const PIPELINE = [
  ["User request", "The message arrives at a server function — never straight to the model."],
  ["Intent analysis", "The controller decides whether stored context could change the answer."],
  ["Memory decision", "Durable facts get saved; one-off questions never do."],
  ["Semantic retrieval", "The request is embedded and ranked against the user's memories."],
  ["Tool selection", "The model calls memory_search, create, update, delete or list."],
  ["Context augmentation", "Only memories above the relevance threshold enter the prompt."],
  ["LLM response", "The answer is generated with that narrow, relevant context."],
  ["Optional memory update", "New durable information is merged into existing memories."],
];

const CAPABILITIES = [
  "Agent orchestration",
  "Tool calling",
  "Persistent memory",
  "Semantic retrieval",
  "Context management",
  "User-controlled memory",
  "Secure multi-user architecture",
];

const TECH = [
  ["Frontend", "React 19, TanStack Start & Router, TanStack Query, Tailwind CSS v4"],
  ["Agent runtime", "Server functions on the app's server runtime — no agent logic in the browser"],
  ["Models", "Lovable AI Gateway — Gemini 3.7 Flash for reasoning + tool calling, Gemini embeddings for retrieval"],
  ["Retrieval", "Embedding cosine similarity ranking with a 0.55 relevance threshold and a 0.90 duplicate-merge threshold"],
  ["Database", "Postgres (Lovable Cloud) with row-level security scoped to the authenticated user"],
  ["Auth", "Email/password and Google sign-in; isolated HTTP-only cookie sessions for guests"],
  ["Observability", "Structured agent_events rows — observable actions only, never model reasoning"],
];

export const Route_ = null;

function About() {
  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-6 py-12">
          <p className="font-mono text-[11px] tracking-widest text-primary uppercase">Case study</p>
          <h1 className="mt-3 text-3xl leading-tight font-semibold sm:text-4xl">
            An AI agent that remembers what matters.
          </h1>

          <section className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="panel p-5">
              <h2 className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">
                The problem
              </h2>
              <p className="mt-3 text-[14.5px] leading-relaxed">
                Most AI chat systems treat conversations independently and repeatedly require users
                to provide the same context.
              </p>
            </div>
            <div className="panel p-5">
              <h2 className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">
                The solution
              </h2>
              <p className="mt-3 text-[14.5px] leading-relaxed">
                Recall introduces controlled persistent memory that retrieves only context relevant
                to the current request — and hands the user full control over it.
              </p>
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-lg font-semibold">How the agent works</h2>
            <ol className="mt-5 space-y-2.5">
              {PIPELINE.map(([title, body], i) => (
                <li key={title} className="panel flex gap-4 p-4">
                  <span className="font-mono text-xs text-primary">{String(i + 1).padStart(2, "0")}</span>
                  <span>
                    <span className="block text-[14px] font-medium">{title}</span>
                    <span className="mt-0.5 block text-[13px] text-muted-foreground">{body}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-12">
            <h2 className="text-lg font-semibold">Architecture</h2>
            <div className="mt-5">
              <ArchitectureDiagram />
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-lg font-semibold">Core AI capabilities</h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {CAPABILITIES.map((c) => (
                <li key={c} className="flex items-center gap-2 text-[14px]">
                  <CircleCheck className="size-4 text-primary" />
                  {c}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-12">
            <h2 className="text-lg font-semibold">Try the demo scenario</h2>
            <div className="panel mt-4 space-y-4 p-5 text-[14px] leading-relaxed">
              <Step n={1} title="Teach it something durable">
                Send: <em>"Remember that I prefer product recommendations under ₹10,000."</em> The
                activity panel shows the memory decision → SAVE and the{" "}
                <code className="font-mono text-primary">memory_create</code> tool call.
              </Step>
              <Step n={2} title="Start a fresh conversation">
                Click <strong>New conversation</strong> — nothing from the first chat is in context.
              </Step>
              <Step n={3} title="Ask something related">
                Send: <em>"Recommend a good keyboard for me."</em> Activity shows{" "}
                <code className="font-mono text-primary">memory_search</code> → 1 relevant memory
                found → memory used, and the answer respects the budget.
              </Step>
              <Step n={4} title="Audit and control it">
                Open <strong>Memories</strong> to edit, deactivate or delete anything the agent kept.
              </Step>
            </div>
            <Link
              to="/"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
            >
              Run the scenario <ArrowRight className="size-4" />
            </Link>
          </section>

          <section className="mt-12 pb-6">
            <h2 className="text-lg font-semibold">Technology actually used</h2>
            <dl className="mt-4 divide-y divide-border overflow-hidden rounded-2xl border border-border">
              {TECH.map(([k, v]) => (
                <div key={k} className="grid gap-1 p-4 sm:grid-cols-[160px_1fr] sm:gap-4">
                  <dt className="text-[13px] font-medium text-primary">{k}</dt>
                  <dd className="text-[13.5px] text-muted-foreground">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 font-mono text-[11px] text-primary">
        {n}
      </span>
      <span>
        <span className="block font-medium">{title}</span>
        <span className="block text-muted-foreground">{children}</span>
      </span>
    </div>
  );
}
