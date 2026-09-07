import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CircleCheck, CircleX, FlaskConical, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { runEvaluation } from "@/lib/recall.functions";

export const Route = createFileRoute("/evaluation")({
  head: () => ({
    meta: [
      { title: "Agent evaluation — Recall" },
      {
        name: "description",
        content:
          "Live evaluation of Recall's memory behaviour: retrieval, rejection, duplicate prevention, update, deletion, isolation and no-memory fallback.",
      },
      { property: "og:title", content: "Agent evaluation — Recall" },
      {
        property: "og:description",
        content: "Run the memory agent's test scenarios and see pass/fail results.",
      },
    ],
  }),
  component: EvaluationPage,
});

const SCENARIOS = [
  ["Relevant memory retrieval", "A stored budget preference is retrieved for a product request."],
  ["Irrelevant memory rejection", "An unrelated factual question retrieves nothing."],
  ["Duplicate memory prevention", "Re-stating a known fact merges instead of inserting."],
  ["Memory update", "Changing a value edits the existing record in place."],
  ["Memory deletion", "Deleting removes the row from the database."],
  ["Cross-user isolation", "Another session's memory is never visible."],
  ["No-memory fallback", "With nothing stored, retrieval returns empty and the agent still answers."],
];

function EvaluationPage() {
  const runFn = useServerFn(runEvaluation);
  const run = useMutation({
    mutationFn: () => runFn(),
    onError: (e: Error) => toast.error(e.message),
  });

  const results = run.data?.results ?? [];
  const passed = results.filter((r) => r.pass).length;

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-6 py-12">
          <p className="font-mono text-[11px] tracking-widest text-primary uppercase">Quality</p>
          <h1 className="mt-3 flex items-center gap-2.5 text-3xl font-semibold">
            <FlaskConical className="size-6 text-primary" />
            Agent evaluation
          </h1>
          <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed text-muted-foreground">
            These scenarios run live against the real memory pipeline — real embeddings, real
            database writes, in a throwaway isolated session that is cleaned up afterwards. Nothing
            here touches your own memories.
          </p>

          <button
            onClick={() => run.mutate()}
            disabled={run.isPending}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {run.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {run.isPending ? "Running evaluation…" : "Run evaluation"}
          </button>

          {results.length ? (
            <p className="mt-5 text-sm text-muted-foreground">
              <span className={passed === results.length ? "text-success" : "text-destructive"}>
                {passed}/{results.length} passed
              </span>{" "}
              · {new Date(run.data!.ranAt).toLocaleTimeString()}
            </p>
          ) : null}

          <div className="mt-6 space-y-2.5">
            {SCENARIOS.map(([name, description]) => {
              const result = results.find((r) => r.name === name);
              return (
                <div key={name} className="panel animate-rise flex items-start gap-3 p-4">
                  <span className="mt-0.5">
                    {!result ? (
                      <span className="block size-4 rounded-full border border-border" />
                    ) : result.pass ? (
                      <CircleCheck className="size-4 text-success" />
                    ) : (
                      <CircleX className="size-4 text-destructive" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium">{name}</p>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">
                      {result?.detail ?? description}
                    </p>
                  </div>
                  <span
                    className={
                      "ml-auto shrink-0 font-mono text-[11px] tracking-widest uppercase " +
                      (!result
                        ? "text-muted-foreground"
                        : result.pass
                          ? "text-success"
                          : "text-destructive")
                    }
                  >
                    {!result ? "not run" : result.pass ? "pass" : "fail"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
