# USER_INTERVIEWS.md

## Context
User interviews were conducted in the final 48 hours of the build week after the live URL was available on Vercel. Outreach was targeted at professionals in the QA, Data Analytics, and Software Engineering sectors to validate SpendSight's logic and UX.

## Interview 1
**Name:** Anushka Chamoli  
**Role:** Associate Quality Analyst, Oracle  
**Tech Stack:** Codex, ChatGPT  

**Direct Quotes:**
* "As a QA, I’m constantly looking for tools to automate test scripts. I use ChatGPT and Codex, but I never actually looked at the combined cost. Seeing the 'Annual Savings' projection made me realize how much we leak on redundant personal subs."
* "The interface feels clean, but I was worried about my data. Seeing the 'Privacy First' note in the footer helped."

**Most Surprising Finding:**
Anushka noted that QA teams often expense tools individually rather than through a central department, leading to massive "shadow spend." The tool’s ability to aggregate these individual costs was more valuable than the AI summary itself.

**Design Change:**
Added a "Privacy Note" explaining that audit data is stored securely in Supabase and only accessible via a unique URL to build trust with corporate users.

## Interview 2
**Name:** Tanishq Bansal  
**Role:** Decision Analytics Associate, ZS  
**Tech Stack:** Claude, Cursor  

**Direct Quotes:**
* "We use Claude for heavy data analysis and Cursor for the scripts. I didn't realize that switching to the 'Team' tier for Claude actually required a 2-seat minimum. Your tool flagged that immediately."
* "I need a way to compare this against 'Free' alternatives. Can you show if there is a $0 option for these?"

**Most Surprising Finding:**
For an Analytics professional, the "logic" of the recommendation was more important than the UI. He scrutinized the math behind the savings more than the visuals.

**Design Change:**
Refactored the `Recommendation` cards to explicitly show the calculation (e.g., "$20/mo x 12 months") so users can verify the math instantly.

## Interview 3
**Name:** Sujal Chhabra  
**Role:** SDE, Finmo (Startup)  
**Tech Stack:** Cursor, Anti-gravity, Claude, GitCopilot  

**Direct Quotes:**
* "We are a startup, so every dollar counts. We were running Cursor and Copilot side-by-side. Seeing the 'Switch Tool' recommendation made me realize we are paying for two things that do the same job."
* "I'd want to see this as a PDF. I need to show my CTO why we should cut the Copilot sub."

**Most Surprising Finding:**
The emotional response to "overlapping features." Sujal felt frustrated that they hadn't consolidated tools earlier. The tool acts as a "guilt-free" way to start that conversation with management.

**Design Change:**
Added the "Print to PDF" workaround in the footer and moved the "Total Annual Savings" hero section to the very top to make it "screenshot-ready" for Slack.

## Summary of Key Findings

| Finding | Impact on Product |
| :--- | :--- |
| **Shadow Spend is real** | Aggregated reporting is now a core marketing angle. |
| **Math Transparency > Visuals** | Added explicit cost breakdowns to recommendation cards. |
| **Startup Overlap** | Enhanced 'Switch Tool' logic to flag feature redundancy. |
| **PDF/Sharing Need** | Prioritized 'Shareable URL' and Print CSS for Week 2. |
