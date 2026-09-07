
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  guest_id text,
  title text NOT NULL DEFAULT 'New conversation',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT conversations_owner_chk CHECK (num_nonnulls(user_id, guest_id) = 1)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own conversations" ON public.conversations FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  guest_id text,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL,
  used_memory_ids uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own messages" ON public.messages FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  guest_id text,
  content text NOT NULL,
  summary text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Other' CHECK (category IN ('Preference','Personal Context','Work','Project','Instruction','Other')),
  importance int NOT NULL DEFAULT 3 CHECK (importance BETWEEN 1 AND 5),
  embedding double precision[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  source_conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_accessed_at timestamptz,
  CONSTRAINT memories_owner_chk CHECK (num_nonnulls(user_id, guest_id) = 1)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.memories TO authenticated;
GRANT ALL ON public.memories TO service_role;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own memories" ON public.memories FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.agent_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  guest_id text,
  event_type text NOT NULL,
  label text NOT NULL,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_events TO authenticated;
GRANT ALL ON public.agent_events TO service_role;
ALTER TABLE public.agent_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own events" ON public.agent_events FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX memories_user_idx ON public.memories(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX memories_guest_idx ON public.memories(guest_id) WHERE guest_id IS NOT NULL;
CREATE INDEX messages_conv_idx ON public.messages(conversation_id, created_at);
CREATE INDEX events_conv_idx ON public.agent_events(conversation_id, created_at);

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER memories_touch BEFORE UPDATE ON public.memories
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER conversations_touch BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
