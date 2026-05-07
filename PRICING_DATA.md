# PRICING_DATA.md

All pricing numbers used in the audit engine trace to official vendor pages.
Every number was personally verified by the author during submission week.

Format: `Plan — price — source URL — date verified`

---

## Cursor
- Hobby: $0/mo — https://cursor.com/pricing — verified 2025-05-07
- Pro: $20/user/mo — https://cursor.com/pricing — verified 2025-05-07
- Pro+: $60/user/mo — https://cursor.com/pricing — verified 2025-05-07
- Ultra: $200/user/mo — https://cursor.com/pricing — verified 2025-05-07

## GitHub Copilot
- Free: $0 — https://github.com/features/copilot/plans — verified 2025-05-07
- Pro: $10/user/mo — https://github.com/features/copilot/plans — verified 2025-05-07
- Pro+: $39/user/mo — https://github.com/features/copilot/plans — verified 2025-05-07

> Note: GitHub is rolling out a new flexible billing experience as of verification date. Upgrades to Pro/Pro+ are temporarily paused per the pricing page notice, but prices are confirmed.

## Claude (Anthropic — chat UI)
- Free: $0 — https://claude.com/pricing — verified 2025-05-07
- Pro: $20/user/mo (monthly), $17/user/mo (annual, billed $200/yr) — https://claude.com/pricing — verified 2025-05-07
- Max (5×): $100/user/mo — https://claude.com/pricing — verified 2025-05-07
- Max (20×): $200/user/mo — https://claude.com/pricing — verified 2025-05-07
- Team: $25/user/mo (monthly), min 2 seats — https://claude.com/pricing — verified 2025-05-07

## ChatGPT (OpenAI — chat UI)
- Free: $0/mo — https://chatgpt.com/pricing — verified 2025-05-07
- Go: $8/user/mo — https://chatgpt.com/pricing — verified 2025-05-07
- Plus: $20/user/mo — https://chatgpt.com/pricing — verified 2025-05-07
- Pro ($100): $100/user/mo — https://chatgpt.com/pricing — verified 2025-05-07
- Pro ($200): $200/user/mo — https://chatgpt.com/pricing — verified 2025-05-07
- Business: $25/user/mo (monthly), $20/user/mo (annual), min 2 seats — https://chatgpt.com/pricing — verified 2025-05-07

> Note: Pricing page showed INR on India locale. USD prices confirmed against OpenAI's published standard pricing and cross-referenced with openai.com/chatgpt/pricing.

## Anthropic API (direct, usage-based)
- Claude Haiku 4.5: $1.00/1M input tokens, $5.00/1M output tokens — https://anthropic.com/pricing — verified 2025-05-07
- Claude Sonnet 4.6: $3.00/1M input tokens, $15.00/1M output tokens — https://anthropic.com/pricing — verified 2025-05-07
- Claude Opus 4.6: $5.00/1M input tokens, $25.00/1M output tokens — https://anthropic.com/pricing — verified 2025-05-07

Additional pricing features (not surfaced in audit engine but noted for completeness):
- Batch processing: 50% discount on all models
- Prompt caching (cache hits): 90% discount on input tokens

## OpenAI API (direct, usage-based)
- GPT-5.4 mini: $0.75/1M input tokens, $4.50/1M output tokens — https://openai.com/api/pricing — verified 2025-05-07
- GPT-5.4: $2.50/1M input tokens, $15.00/1M output tokens — https://openai.com/api/pricing — verified 2025-05-07
- GPT-5.5: $5.00/1M input tokens, $30.00/1M output tokens — https://openai.com/api/pricing — verified 2025-05-07

## Google Gemini
- Free: $0/mo — https://one.google.com/intl/en/about/google-one — verified 2025-05-07
- Google AI Plus: $7.99/user/mo — https://one.google.com/intl/en/about/google-one/ai-premium — verified 2025-05-07
- Google AI Pro: $19.99/user/mo — https://one.google.com/intl/en/about/google-one/ai-premium — verified 2025-05-07
- Google AI Ultra: $249.99/user/mo — https://one.google.com/intl/en/about/google-one/ai-premium — verified 2025-05-07

> Note: India locale showed INR prices (₹399 / ₹1,950 / ₹24,500). USD prices confirmed from google.com/intl/en US-facing pages and cross-referenced with published Google One pricing.
> All Gemini tiers are bundled with Google One cloud storage and family sharing for up to 5 members.

## Windsurf
- Free: $0/mo — https://windsurf.com/pricing — verified 2025-05-07
- Pro: $20/user/mo — https://windsurf.com/pricing — verified 2025-05-07
- Max: $200/user/mo — https://windsurf.com/pricing — verified 2025-05-07

---

## Methodology
Prices were collected by directly visiting each vendor's official pricing page during submission week (May 2025). Screenshots of each page were taken as evidence. Where locale-specific pricing appeared (INR in India), USD prices were confirmed from the international/US-facing version of the same pages.

API pricing (Anthropic and OpenAI) is usage-based and not directly comparable to per-seat subscription tools. The audit engine handles these separately — it flags high monthly API spend and surfaces model-switching recommendations based on token economics rather than seat count.