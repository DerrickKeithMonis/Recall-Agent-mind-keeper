import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Brain, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { getConversation, sendMessage } from "@/lib/recall.functions";
import { ActivityPanel, type AgentEvent } from "@/components/ActivityPanel";
import { useSession } from "@/components/AppShell";
import { cn } from "@/lib/utils";

const STARTERS = [
  "Remember that I prefer concise product summaries.",
  "What do you remember about my preferences?",
  "Update my preferred meeting time to 10 AM.",
  "Forget my preference about meeting times.",
  "What information did you use to answer this?",
];

type ChatMessage = {
  id: string;
  role: string;
  content: string;
  used_memory_ids: string[];
  created_at: string;
};

export function ChatView({ conversationId }: { conversationId: string | null }) {
  const [input, setInput] = useState("");
  const [panelOpen, setPanelOpen] = useState(true);
  const [optimistic, setOptimistic] = useState<ChatMessage[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { isGuest } = useSession();

  const getFn = useServerFn(getConversation);
  const sendFn = useServerFn(sendMessage);

  const convo = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => getFn({ data: { id: conversationId! } }),
    enabled: !!conversationId,
  });

  const send = useMutation({
    mutationFn: (text: string) => sendFn({ data: { conversationId, text } }),
    onSuccess: (res) => {
      setOptimistic([]);
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["memories"] });
      if (!conversationId) {
        navigate({ to: "/c/$conversationId", params: { conversationId: res.conversationId! } });
      } else {
        qc.invalidateQueries({ queryKey: ["conversation", conversationId] });
      }
    },
    onError: (err: Error) => {
      setOptimistic([]);
      toast.error(err.message || "The agent could not complete that request.");
    },
  });

  useEffect(() => {
    textareaRef.current?.focus();
  }, [conversationId, send.isPending]);

  const messages: ChatMessage[] = [
    ...(((convo.data?.messages ?? []) as ChatMessage[]) ?? []),
    ...optimistic,
  ];
  const events = (convo.data?.events ?? []) as AgentEvent[];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, send.isPending]);

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || send.isPending) return;
    setInput("");
    setOptimistic([
      {
        id: `local-${Date.now()}`,
        role: "user",
        content: trimmed,
        used_memory_ids: [],
        created_at: new Date().toISOString(),
      },
    ]);
    send.mutate(trimmed);
  }

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-2xl px-5 py-10">
            {messages.length === 0 && !send.isPending ? (
              <div className="animate-rise pt-6">
                <h1 className="text-3xl leading-tight font-semibold sm:text-4xl">
                  AI conversations shouldn't start from zero.
                </h1>
                <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                  Recall selectively remembers useful context, retrieves it when relevant, and gives
                  you complete control over what it knows.
                </p>
                {isGuest ? (
                  <p className="mt-4 rounded-xl border border-border bg-card/60 px-3.5 py-2.5 text-[12.5px] text-muted-foreground">
                    You're in the guest demo. Demo memories are temporary and should not contain
                    sensitive information.
                  </p>
                ) : null}
                <div className="mt-7 grid gap-2 sm:grid-cols-2">
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      onClick={() => submit(s)}
                      className="rounded-xl border border-border bg-card/50 px-3.5 py-3 text-left text-[13px] leading-snug text-muted-foreground transition hover:border-primary/40 hover:bg-card hover:text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((m) => (
                  <Bubble key={m.id} message={m} />
                ))}
                {send.isPending ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="size-4 text-primary" />
                    <span className="flex gap-1">
                      <span className="typing-dot size-1.5 rounded-full bg-primary" />
                      <span
                        className="typing-dot size-1.5 rounded-full bg-primary"
                        style={{ animationDelay: "0.15s" }}
                      />
                      <span
                        className="typing-dot size-1.5 rounded-full bg-primary"
                        style={{ animationDelay: "0.3s" }}
                      />
                    </span>
                    <span className="text-xs">working through memory…</span>
                  </div>
                ) : null}
                <div ref={bottomRef} />
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border bg-background/80 px-5 py-4 backdrop-blur">
          <div className="mx-auto flex w-full max-w-2xl items-end gap-2 rounded-2xl border border-border bg-card px-3 py-2.5 focus-within:border-primary/50">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              maxLength={2000}
              placeholder="Tell Recall something worth remembering, or ask what it knows…"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit(input);
                }
              }}
              className="max-h-40 min-h-[24px] flex-1 resize-none bg-transparent text-[14.5px] outline-none placeholder:text-muted-foreground"
            />
            <button
              onClick={() => submit(input)}
              disabled={send.isPending || !input.trim()}
              aria-label="Send message"
              className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground transition disabled:opacity-40"
            >
              {send.isPending ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
            </button>
          </div>
        </div>
      </div>

      <ActivityPanel
        events={events}
        open={panelOpen}
        onToggle={() => setPanelOpen((v) => !v)}
        running={send.isPending}
      />
    </div>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("animate-rise flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-[14.5px] leading-relaxed whitespace-pre-wrap",
          isUser
            ? "bg-primary text-primary-foreground"
            : "border border-border bg-card text-card-foreground",
        )}
      >
        {message.content}
        {!isUser && message.used_memory_ids?.length ? (
          <p className="mt-2.5 flex items-center gap-1.5 border-t border-border pt-2 text-[11px] text-muted-foreground">
            <Brain className="size-3" />
            {message.used_memory_ids.length} memor
            {message.used_memory_ids.length === 1 ? "y" : "ies"} used in this answer
          </p>
        ) : null}
      </div>
    </div>
  );
}
