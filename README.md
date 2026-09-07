# Recall: Your Memory Agent

Build a production-quality AI agent web application called:

“Recall — Memory Agent”

PURPOSE

Recall is an AI agent that can remember useful information from conversations, retrieve relevant memories later, update existing memories, and explain what information it used to answer a question.

This application is primarily a portfolio showcase demonstrating:

- AI agents

- persistent memory

- tool calling

- semantic retrieval

- structured agent workflows

- secure AI architecture

- human-controlled memory

- modern product UX

Do NOT build this as a simple chatbot wrapper.

--------------------------------------------------

1. EXPERIENCE

--------------------------------------------------

Create a premium, minimal AI interface.

Main screen:

Left sidebar:

- New conversation

- Conversation history

- Memories

- Agent Activity

- About the Agent

Center:

- Conversational interface

- User messages

- AI responses

- Suggested starter prompts

Right-side collapsible Agent Activity panel showing events such as:

✓ Received user request

✓ Searched memory

✓ Found 3 relevant memories

✓ Retrieved user preference

✓ Called tool: memory_search

✓ Generated response

IMPORTANT:

Never display hidden chain-of-thought or private model reasoning.

Only show observable agent actions, tool calls, retrieval events and short status descriptions.

Example starter prompts:

“Remember that I prefer concise product summaries.”

“What do you remember about my preferences?”

“Update my preferred meeting time to 10 AM.”

“Forget my preference about meeting times.”

“What information did you use to answer this?”

--------------------------------------------------

2. AGENT ARCHITECTURE

--------------------------------------------------

Use a proper server-side agent architecture:

User

↓

Lovable frontend

↓

Secure server-side API / Edge Function

↓

Agent controller

↓

LLM

↓

Tools

    memory_search

    memory_create

    memory_update

    memory_delete

    memory_list

↓

Memory database

Do not place agent logic, model API keys or database privileged credentials in client-side JavaScript.

Use Lovable Cloud/Supabase capabilities where appropriate.

--------------------------------------------------

3. MEMORY SYSTEM

--------------------------------------------------

Create a memory database.

Suggested memory table:

memories

id

user_id

content

summary

category

importance

embedding

created_at

updated_at

last_accessed_at

source_conversation_id

is_active

Memory categories:

Preference

Personal Context

Work

Project

Instruction

Other

The agent should NOT automatically save every message.

Create a memory decision step.

The agent should save information only when it appears useful across future conversations.

Examples:

SAVE:

“My preferred response style is concise.”

“I am building an AI product portfolio.”

“My current project is Recall.”

DON'T SAVE:

“What's 10 × 12?”

“Tell me the weather today.”

“Rewrite this sentence.”

Before creating a duplicate memory, search existing memories.

If an existing memory represents the same concept:

update it rather than creating another record.

--------------------------------------------------

4. SEMANTIC MEMORY RETRIEVAL

--------------------------------------------------

Implement semantic retrieval.

When a user asks a question:

1. Analyze the request.

2. Determine whether memory could help.

3. Search relevant memories.

4. Rank memories by relevance.

5. Send only the relevant memories to the model.

6. Generate the answer.

7. Record which memories were used.

Avoid sending the entire memory database into every prompt.

Show retrieved memories in the Agent Activity panel:

“Memory search → 3 candidate memories → 2 used”

--------------------------------------------------

5. MEMORY MANAGEMENT UI

--------------------------------------------------

Create a dedicated “Memories” page.

Display memories as clean cards.

Each card should show:

Memory

Category

Date saved

Last updated

Actions:

Edit

Delete

Deactivate

Provide search and category filtering.

Also create:

“Delete all memories”

with a confirmation dialog.

Users must have complete visibility and control over stored memories.

--------------------------------------------------

6. SECURITY

--------------------------------------------------

This is important.

Implement:

Authentication

Per-user memory isolation

Database Row Level Security

Server-side API calls

Secure environment variables / secrets

Input validation

Rate limiting where practical

Error handling

Never expose:

LLM API keys

service-role database keys

database credentials

system prompts

internal privileged endpoints

Do not store secrets in frontend code.

Each authenticated user must ONLY be able to retrieve, update or delete their own memories.

Use Row Level Security policies based on authenticated user ID.

--------------------------------------------------

7. PUBLIC PORTFOLIO DEMO

--------------------------------------------------

The application should be safe to showcase publicly.

Provide two modes:

GUEST DEMO

Allows visitors to test the agent immediately.

Guest memory should be isolated to the visitor/session.

Clearly state:

“Demo memories are temporary and should not contain sensitive information.”

SIGNED-IN MODE

Provides persistent memory between sessions.

Visitors can create an account to demonstrate persistent memory.

Never mix guest/user memory.

--------------------------------------------------

8. PORTFOLIO / ABOUT PAGE

--------------------------------------------------

Create an “About this Agent” page.

Present it like an AI product case study.

Sections:

THE PROBLEM

Most AI chat systems treat conversations independently and repeatedly require users to provide the same context.

THE SOLUTION

Recall introduces controlled persistent memory that retrieves only context relevant to the current request.

HOW THE AGENT WORKS

User request

→ Intent analysis

→ Memory decision

→ Semantic retrieval

→ Tool selection

→ Context augmentation

→ LLM response

→ Optional memory update

CORE AI CAPABILITIES

• Agent orchestration

• Tool calling

• Persistent memory

• Semantic retrieval

• Context management

• User-controlled memory

• Secure multi-user architecture

TECHNOLOGY

Show the actual technologies used after implementation.

Do not claim technologies that are not actually being used.

--------------------------------------------------

9. ARCHITECTURE VISUALIZATION

--------------------------------------------------

Create an attractive architecture diagram directly in the UI showing:

User

↓

Recall Agent

↓

Agent Controller

branching to:

LLM

Memory Retrieval

Tool Layer

Memory Retrieval

↓

Vector Search

↓

Memory Database

Make it visually polished enough for a Product Manager / AI portfolio.

--------------------------------------------------

10. AGENT OBSERVABILITY

--------------------------------------------------

Store structured agent events.

Examples:

request_received

memory_search_started

memory_search_completed

memory_created

memory_updated

tool_called

response_generated

error

Use these to populate the Agent Activity panel.

Never store or expose private chain-of-thought.

--------------------------------------------------

11. DESIGN

--------------------------------------------------

Make the design premium and professional.

Direction:

Dark/neutral modern AI interface

Generous whitespace

Rounded containers

Subtle animations

Excellent typography

Minimal visual noise

Avoid making it look like a generic SaaS dashboard.

Brand:

Recall

Subtitle:

“An AI agent that remembers what matters.”

Hero statement:

“AI conversations shouldn't start from zero.”

Secondary statement:

“Recall selectively remembers useful context, retrieves it when relevant, and gives users complete control over what it knows.”

--------------------------------------------------

12. DEMO SCENARIO

--------------------------------------------------

Include an interactive demo tutorial.

Step 1:

User enters:

“Remember that I prefer product recommendations under ₹10,000.”

Step 2:

Agent confirms the memory.

Activity panel shows:

Memory decision

→ SAVE

Tool:

memory_create

Step 3:

User starts a new conversation.

User asks:

“Recommend a good keyboard for me.”

Step 4:

Agent retrieves:

“Prefers product recommendations under ₹10,000.”

Activity:

memory_search

→ 1 relevant memory found

→ memory used

This should visually demonstrate why agent memory matters.

--------------------------------------------------

13. EVALUATION PAGE

--------------------------------------------------

Create a small “Agent Evaluation” section.

Track example test scenarios:

Relevant memory retrieval

Irrelevant memory rejection

Duplicate memory prevention

Memory update

Memory deletion

Cross-user isolation

No-memory fallback

Show Pass / Fail results.

This section is important because this is an AI engineering portfolio project, not merely a chatbot demo.

--------------------------------------------------

14. OPTIONAL MCP / AGENT INTEGRATION

--------------------------------------------------

After the primary web application is working correctly, prepare the application so its useful actions can optionally be exposed through Lovable Agent Integrations / MCP.

Potential MCP actions:

search_memories

list_memories

create_memory

update_memory

delete_memory

Do NOT expose unrestricted database access.

Require authentication for private user memories.

--------------------------------------------------

15. FINAL QUALITY CHECK

--------------------------------------------------

Before considering the application complete:

Test authentication.

Test that User A cannot access User B's memories.

Verify no API keys appear in browser source/network responses.

Verify guest memories cannot leak across sessions.

Verify memory deletion actually removes/deactivates the memory.

Verify semantic search works.

Verify the agent works when no relevant memory exists.

Verify the UI works on desktop and mobile.

Do not use placeholder buttons.

Do not leave fake functionality.

Do not claim capabilities that haven't been implemented.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9f8474d1-9096-4353-9dd2-4895772526ee).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
