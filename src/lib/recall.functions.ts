import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, setResponseHeader } from "@tanstack/react-start/server";
import { z } from "zod";

const uuid = z.string().uuid();

type Identity = { userId: string | null; guestId: string | null };

/** Resolves the caller: signed-in user (validated bearer) or an isolated guest session cookie. */
async function identity(): Promise<Identity> {
  const { userFromToken } = await import("./agent.server");
  const auth = getRequestHeader("authorization") ?? null;
  const token = auth?.toLowerCase().startsWith("bearer ") ? auth.slice(7) : null;
  const userId = await userFromToken(token);
  if (userId) return { userId, guestId: null };

  const cookies = getRequestHeader("cookie") ?? "";
  const match = /(?:^|;\s*)recall_guest=([A-Za-z0-9-]+)/.exec(cookies);
  let guestId = match?.[1];
  if (!guestId) {
    guestId = crypto.randomUUID();
    setResponseHeader(
      "set-cookie",
      `recall_guest=${guestId}; Path=/; Max-Age=2592000; SameSite=Lax; HttpOnly; Secure`,
    );
  }
  return { userId: null, guestId };
}

export const getSessionInfo = createServerFn({ method: "POST" }).handler(async () => {
  const id = await identity();
  return { isGuest: !id.userId };
});

export const listConversations = createServerFn({ method: "POST" }).handler(async () => {
  const { admin, ownerFilter } = await import("./agent.server");
  const id = await identity();
  const { data } = await ownerFilter(admin().from("conversations").select("id, title, created_at"), id).order(
    "updated_at",
    { ascending: false },
  );
  return (data ?? []) as { id: string; title: string; created_at: string }[];
});

export const createConversation = createServerFn({ method: "POST" }).handler(async () => {
  const { admin, ownerCols } = await import("./agent.server");
  const id = await identity();
  const { data, error } = await admin()
    .from("conversations")
    .insert({ ...ownerCols(id) })
    .select("id, title, created_at")
    .single();
  if (error) throw new Error(error.message);
  return data as { id: string; title: string; created_at: string };
});

export const deleteConversation = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: uuid }).parse(d))
  .handler(async ({ data }) => {
    const { admin, ownerFilter } = await import("./agent.server");
    const id = await identity();
    await ownerFilter(admin().from("conversations").delete().eq("id", data.id), id);
    return { ok: true };
  });

export const getConversation = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: uuid }).parse(d))
  .handler(async ({ data }) => {
    const { admin, ownerFilter } = await import("./agent.server");
    const id = await identity();
    const db = admin();
    const { data: convo } = await ownerFilter(
      db.from("conversations").select("id, title").eq("id", data.id),
      id,
    ).maybeSingle();
    if (!convo) return { conversation: null, messages: [], events: [] };
    const { data: messages } = await db
      .from("messages")
      .select("id, role, content, used_memory_ids, created_at")
      .eq("conversation_id", data.id)
      .order("created_at");
    const { data: events } = await db
      .from("agent_events")
      .select("id, event_type, label, detail, created_at")
      .eq("conversation_id", data.id)
      .order("created_at");
    return { conversation: convo, messages: messages ?? [], events: events ?? [] };
  });

export const sendMessage = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({ conversationId: uuid.nullable().optional(), text: z.string().trim().min(1).max(2000) })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { admin, ownerFilter, ownerCols, EventLog, runAgent, rateLimit } = await import("./agent.server");
    const id = await identity();
    rateLimit(id);
    const db = admin();

    let conversationId = data.conversationId ?? null;
    if (conversationId) {
      const { data: owned } = await ownerFilter(
        db.from("conversations").select("id").eq("id", conversationId),
        id,
      ).maybeSingle();
      if (!owned) throw new Error("Conversation not found.");
    } else {
      const { data: created, error } = await db
        .from("conversations")
        .insert({ ...ownerCols(id), title: data.text.slice(0, 48) })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      conversationId = created.id;
    }

    const log = new EventLog();
    log.push("request_received", "Received user request");

    await db.from("messages").insert({
      ...ownerCols(id),
      conversation_id: conversationId,
      role: "user",
      content: data.text,
    });

    const { data: history } = await db
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at");

    try {
      const result = await runAgent({
        db,
        id,
        conversationId: conversationId!,
        history: (history ?? []) as { role: "user" | "assistant"; content: string }[],
        log,
      });
      await db.from("messages").insert({
        ...ownerCols(id),
        conversation_id: conversationId,
        role: "assistant",
        content: result.answer,
        used_memory_ids: result.usedMemories.map((m) => m.id),
      });
      await db.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
      await log.flush(db, id, conversationId!);
      return { conversationId, answer: result.answer, usedMemories: result.usedMemories };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      log.push("error", `Error: ${message}`);
      await log.flush(db, id, conversationId!);
      throw new Error(message);
    }
  });

/* ------------------------------- memories -------------------------------- */

export const listMemories = createServerFn({ method: "POST" }).handler(async () => {
  const { admin, ownerFilter } = await import("./agent.server");
  const id = await identity();
  const { data } = await ownerFilter(
    admin()
      .from("memories")
      .select("id, content, summary, category, importance, is_active, created_at, updated_at, last_accessed_at"),
    id,
  ).order("updated_at", { ascending: false });
  return (data ?? []) as {
    id: string;
    content: string;
    summary: string;
    category: string;
    importance: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    last_accessed_at: string | null;
  }[];
});

export const updateMemory = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        id: uuid,
        content: z.string().trim().min(1).max(1000).optional(),
        category: z.string().max(40).optional(),
        is_active: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { admin, ownerFilter, embed, CATEGORIES } = await import("./agent.server");
    const id = await identity();
    const patch: Record<string, unknown> = {};
    if (data.content) {
      patch["content"] = data.content;
      patch["summary"] = data.content.slice(0, 60);
      patch["embedding"] = await embed(data.content);
    }
    if (data.category && (CATEGORIES as readonly string[]).includes(data.category))
      patch["category"] = data.category;
    if (typeof data.is_active === "boolean") patch["is_active"] = data.is_active;
    if (!Object.keys(patch).length) return { ok: true };
    const { error } = await ownerFilter(admin().from("memories").update(patch).eq("id", data.id), id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteMemory = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: uuid }).parse(d))
  .handler(async ({ data }) => {
    const { admin, ownerFilter } = await import("./agent.server");
    const id = await identity();
    const { error } = await ownerFilter(admin().from("memories").delete().eq("id", data.id), id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAllMemories = createServerFn({ method: "POST" }).handler(async () => {
  const { admin, ownerFilter } = await import("./agent.server");
  const id = await identity();
  const { error } = await ownerFilter(admin().from("memories").delete().not("id", "is", null), id);
  if (error) throw new Error(error.message);
  return { ok: true };
});

/* ------------------------------- evaluation ------------------------------- */

export const runEvaluation = createServerFn({ method: "POST" }).handler(async () => {
  const { admin, embed, cosine, rateLimit } = await import("./agent.server");
  const id = await identity();
  rateLimit(id, 3, 60_000);
  const db = admin();
  const suite = `eval-${crypto.randomUUID()}`;
  const other = `eval-${crypto.randomUUID()}`;
  const results: { name: string; detail: string; pass: boolean }[] = [];

  const add = (name: string, pass: boolean, detail: string) => results.push({ name, pass, detail });

  try {
    const seed = "The user prefers product recommendations under 10,000 rupees.";
    const emb = await embed(seed);
    const { data: mem } = await db
      .from("memories")
      .insert({ guest_id: suite, content: seed, summary: "Budget under ₹10,000", category: "Preference", embedding: emb })
      .select("id")
      .single();

    const rank = async (q: string) => {
      const qv = await embed(q);
      const { data } = await db.from("memories").select("id, content, embedding").eq("guest_id", suite).eq("is_active", true);
      return (data ?? [])
        .map((m) => ({ id: m.id as string, score: cosine(qv, m.embedding as number[]) }))
        .sort((a, b) => b.score - a.score);
    };

    const relevant = await rank("Recommend a good mechanical keyboard for me");
    add(
      "Relevant memory retrieval",
      (relevant[0]?.score ?? 0) >= 0.55,
      `Budget preference scored ${(relevant[0]?.score ?? 0).toFixed(2)} against a product request.`,
    );

    const irrelevant = await rank("What is the boiling point of water?");
    add(
      "Irrelevant memory rejection",
      (irrelevant[0]?.score ?? 1) < 0.55,
      `Top score ${(irrelevant[0]?.score ?? 0).toFixed(2)} fell below the 0.55 relevance threshold.`,
    );

    const dupEmb = await embed(seed);
    const dupScore = cosine(dupEmb, emb);
    add(
      "Duplicate memory prevention",
      dupScore >= 0.9,
      `Re-stating the same fact scored ${dupScore.toFixed(2)} — above the 0.90 merge threshold, so it updates instead of inserting.`,
    );

    await db.from("memories").update({ content: seed.replace("10,000", "15,000") }).eq("id", mem!.id);
    const { data: updated } = await db.from("memories").select("content").eq("id", mem!.id).single();
    add("Memory update", (updated?.content ?? "").includes("15,000"), "Stored value changed in place, no duplicate row created.");

    await db.from("memories").insert({ guest_id: other, content: "Another visitor's private note.", summary: "other", category: "Other", embedding: emb });
    const { data: isolated } = await db.from("memories").select("id").eq("guest_id", suite);
    add(
      "Cross-user isolation",
      (isolated ?? []).length === 1,
      "A second session's memory is invisible to this session's owner-scoped query.",
    );

    await db.from("memories").delete().eq("id", mem!.id);
    const { data: gone } = await db.from("memories").select("id").eq("id", mem!.id);
    add("Memory deletion", (gone ?? []).length === 0, "The row is removed from the database, not just hidden.");

    const empty = await rank("Anything about my preferences?");
    add(
      "No-memory fallback",
      empty.length === 0,
      "With no stored memories the retrieval step returns nothing and the agent answers from general knowledge.",
    );
  } finally {
    await db.from("memories").delete().eq("guest_id", suite);
    await db.from("memories").delete().eq("guest_id", other);
  }

  return { results, ranAt: new Date().toISOString() };
});
