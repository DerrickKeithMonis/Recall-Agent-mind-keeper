import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ChatView } from "@/components/ChatView";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Recall — An AI agent that remembers what matters" },
      {
        name: "description",
        content:
          "Recall is an AI agent with controlled persistent memory: it saves useful context, retrieves only what's relevant, and gives you full control over what it knows.",
      },
      { property: "og:title", content: "Recall — An AI agent that remembers what matters" },
      {
        property: "og:description",
        content: "AI conversations shouldn't start from zero. Try the memory agent demo.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <AppShell>
      <ChatView conversationId={null} />
    </AppShell>
  );
}
