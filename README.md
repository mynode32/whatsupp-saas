# Inboxly

**Cold email that lands, warms and replies.** Inboxly warms your sending domains,
writes a personalized line for every lead, runs multi-step sequences and triages
every reply in one unified inbox.

## Quick start

```bash
npm install
npm run dev          # → http://localhost:3000  (demo mode, no keys needed)
```

## Make it yours

Open this folder in **Claude Code** and say **"set up this project"** (or run
**`/setup`**). It asks for your brand, colors, and your **Resend** + **Anthropic**
keys, then wires them in. By hand? See [`SETUP.md`](./SETUP.md).

## What it needs (all optional — demo mode works with none)

| Integration | Powers |
|---|---|
| **Resend** (`RESEND_API_KEY`) | Sending campaign & warmup emails |
| **Anthropic** (`ANTHROPIC_API_KEY`) | Personalized openers & follow-ups |
| **Supabase** | Stores campaigns, leads & replies |

## Pages

`Campaigns` (overview & queue) · `Leads` (pipeline by stage) · `Sequences` (step
builder) · `Inbox` (reply triage) · `Settings`.

Built on the GoatStarter template — Next.js 16 · React 19 · Tailwind v4.
