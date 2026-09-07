import { createFileRoute, useParams } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ChatView } from "@/components/ChatView";

export const Route = createFileRoute("/c/$conversationId")({
  head: () => ({
    meta: [
      { title: "Conversation — Recall memory agent" },
      {
        name: "description",
        content: "A Recall conversation with live agent activity: memory search, tool calls and retrieved context.",
      },
      { property: "og:title", content: "Conversation — Recall memory agent" },
      {
        property: "og:description",
        content: "Watch the agent search memory, call tools and answer with retrieved context.",
      },
    ],
  }),
  component: Thread,
});

function Thread() {
  const { conversationId } = useParams({ from: "/c/$conversationId" });
  return (
    <AppShell>
      <ChatView key={conversationId} conversationId={conversationId} />
    </AppShell>
  );
}
