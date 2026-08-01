# mynode

**Launch a website chatbot and manage customer messages in one inbox.** mynode
supports self-service web-chat setup and WhatsApp messaging today. Instagram
inbound webhook support is implemented; customer OAuth and outbound replies
activate after the Meta app is approved. AI reply drafting remains a beta phase.

## Quick start

```bash
npm install
npm run dev          # → http://localhost:3000  (demo mode, no keys needed)
```

## Make it yours

Open this folder in **Claude Code** and say **"set up this project"** (or run
**`/setup`**). It asks for your brand, colors, and your **Twilio**,
**Anthropic** and **Supabase** keys, then wires them in. By hand? See
[`SETUP.md`](./SETUP.md).

## What it needs (all optional — demo mode works with none)

| Integration | Powers |
|---|---|
| **Anthropic** (`ANTHROPIC_API_KEY`) | Drafts knowledge-grounded replies in your brand voice |
| **Twilio** (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`) | Connects your WhatsApp Business number |
| **Supabase** | Stores conversations, knowledge base & automations |

## Pages

`Overview` (dashboard/KPIs) · `Conversations` (unified inbox) ·
`Automations` (rules) · `Knowledge` (bilgi tabanı) · `Settings`.

## Current status

This is currently a UI-only demo — see [`IMPLEMENTATION_STATUS.md`](./IMPLEMENTATION_STATUS.md)
for exactly which features are real vs. demo data.

Built on the GoatStarter template — Next.js 16 · React 19 · Tailwind v4.
