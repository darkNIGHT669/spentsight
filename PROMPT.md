# PROMPT.md: SpendSight AI Orchestration

## 1. Initial Scaffolding & Architecture
**Prompt used to generate the project structure:**
"Act as a Senior Full Stack Engineer. I am building SpendSight, a tool that audits SaaS AI spend for startups. Initialize a Next.js 16 project using the App Router, TypeScript, and Tailwind CSS. Design a Supabase schema for an 'audits' table that stores a JSONB 'input' field (toolId, planId, seats, monthlySpend) and a 'recommendations' array. Generate a core 'AuditEngine' class in TypeScript that takes this input and returns an 'AuditResult' based on deterministic pricing logic from a registry."

## 2. UI/UX Design System
**Prompt used for Step1ToolSelect.tsx:**
"Create a React component for 'Step 1' of a 3-step audit form. It should be a grid of dark-themed cards representing AI tools like Cursor, Claude, and ChatGPT. Use Framer Motion for subtle hover effects. When a tool is selected, highlight it with an amber border (amber-500). The state must be managed via a Zustand store called 'useAuditStore'. Each card needs an icon, a name, and a tagline."

## 3. The "Brain" (Audit Engine Logic)
**Prompt used to build the recommendation logic:**
"I have a pricing registry for AI tools (Cursor: $20/seat Pro, $40/seat Ultra; Claude: $20 Pro, $30/seat Team with 2-seat min). Write a TypeScript function within my AuditEngine that compares the user's current spend against these tiers. Logic requirements:
1. If user has 1 seat on Claude Team, recommend downgrading to Pro to save the 2nd seat cost.
2. If user is on Cursor Ultra, recommend Pro unless they explicitly need high-priority 'Ultra' features.
3. Calculate both Monthly and Annual savings."

## 4. AI-Enhanced Summaries
**Prompt used for the Gemini API Integration:**
"You are a SaaS Cost Optimization expert. I am passing you a JSON object containing an audit result of a startup's AI tool spend. Write a 3-sentence punchy summary for a CTO. Focus on the 'Quick Wins' (e.g., 'You are overpaying for Claude seats'). Keep the tone professional, urgent, and data-driven. Do not hallucinate numbers—only use the savings figures provided in the JSON."

## 5. Complex Debugging (The "Whack-a-Mole" Session)
**Prompt used during the final 3 hours to fix build errors:**
"I am getting a TypeScript error: 'Module "@/lib/audit-types" has no exported member named ToolRecommendation'. I recently refactored this to 'Recommendation'. Find all occurrences in my project where ToolRecommendation is imported and suggest the fix for AuditResultsClient.tsx and the [auditId] page. Also, provide a 'git mv' command to ensure Git tracks the file case-sensitivity correctly for a Vercel deployment."

## 6. Closing the Loop (Reflection & Interview Prep)
**Prompt used to synthesize user feedback:**
"I interviewed three users: a QA at Oracle, an Analyst at ZS, and an SDE at a startup. They liked the clarity but wanted PDF exports and more math transparency. Summarize these findings into a USER_INTERVIEWS.md file, including 'Most Surprising Thing' and 'What it changed about the design' sections for each interview."