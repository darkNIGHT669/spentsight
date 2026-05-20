/**
 * app/api/detect-changes/route.ts
 *
 * Round 2 core feature: scans all stored audits, detects stale ones
 * (where pricing has changed since the audit was created), and sends
 * one consolidated re-audit email per affected user.
 *
 * Trigger: POST /api/detect-changes
 * Protected by CRON_SECRET so only authorised callers can run it.
 *
 * Also accepts a manual price override for testing:
 * POST /api/detect-changes { "simulate": { "toolId": "cursor", "planId": "pro", "newPrice": 25 } }
 */

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase/server";
import { detectPricingChanges, getChangesAffectingAudit } from "@/lib/pricing-snapshot";
import type { PricingSnapshot } from "@/lib/pricing-snapshot";
import type { ToolId } from "@/lib/pricing-registry";

const resend = new Resend(process.env.RESEND_API_KEY!);

interface StoredAudit {
  id: string;
  input: {
    tools: { toolId: ToolId; planId: string; seats: number; monthlySpend: number }[];
    teamSize: number;
    primaryUseCase: string;
  };
  pricing_snapshot: PricingSnapshot;
  pricing_version: string;
  total_monthly_savings: number;
  created_at: string;
}

interface Lead {
  email: string;
  audit_id: string;
}

export async function POST(req: NextRequest) {
  // Auth check — must provide CRON_SECRET in header or body
  const secret =
    req.headers.get("x-cron-secret") ?? (await req.json().catch(() => ({}))).secret;

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Re-read body after auth check (already consumed above if secret was in body)
  // So we'll pass simulate via query param instead: ?simulate=cursor:pro:25
  const simulateParam = new URL(req.url).searchParams.get("simulate");
  // Format: toolId:planId:newPrice e.g. "cursor:pro:25"

  console.log("detect-changes: starting scan");

  // 1. Fetch all audits that have a pricing snapshot
  const { data: audits, error: auditsError } = await supabaseAdmin
    .from("audits")
    .select("id, input, pricing_snapshot, pricing_version, total_monthly_savings, created_at")
    .not("pricing_snapshot", "is", null);

  if (auditsError || !audits) {
    console.error("Failed to fetch audits:", auditsError);
    return NextResponse.json({ error: "Failed to fetch audits" }, { status: 500 });
  }

  if (audits.length === 0) {
    return NextResponse.json({
      message: "No audits with pricing snapshots found.",
      auditsScanned: 0,
      affectedAudits: 0,
      emailsSent: 0,
    });
  }

  // 2. Fetch all leads (email → audit_id mapping)
  const { data: leads, error: leadsError } = await supabaseAdmin
    .from("leads")
    .select("email, audit_id")
    .eq("unsubscribed", false);

  if (leadsError || !leads) {
    console.error("Failed to fetch leads:", leadsError);
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }

  // Build audit_id → email map
  const auditEmailMap = new Map<string, string>();
  for (const lead of leads as Lead[]) {
    if (!auditEmailMap.has(lead.audit_id)) {
      auditEmailMap.set(lead.audit_id, lead.email);
    }
  }

  // 3. Detect which audits are stale
  const staleAudits: {
    audit: StoredAudit;
    email: string;
    changes: ReturnType<typeof getChangesAffectingAudit>;
  }[] = [];

  for (const audit of audits as StoredAudit[]) {
    const email = auditEmailMap.get(audit.id);
    if (!email) continue; // No email captured — skip

    // Check if already notified for this audit
    const { data: existingNotif } = await supabaseAdmin
      .from("reaudit_notifications")
      .select("id")
      .eq("audit_id", audit.id)
      .single();

    if (existingNotif) continue; // Already sent notification

    // Detect changes since this audit was created
    let allChanges = detectPricingChanges(audit.pricing_snapshot);

    // If simulate param provided, inject a fake price change for testing
    if (simulateParam) {
      const [toolId, planId, newPriceStr] = simulateParam.split(":");
      const newPrice = parseFloat(newPriceStr);
      if (toolId && planId && !isNaN(newPrice)) {
        // Find old price from snapshot
        const toolSnapshot = audit.pricing_snapshot[toolId as ToolId];
        const planSnapshot = toolSnapshot?.plans.find((p) => p.planId === planId);
        if (planSnapshot && planSnapshot.monthlyPerSeat !== newPrice) {
          allChanges = [
            ...allChanges,
            {
              toolId: toolId as ToolId,
              toolName: toolSnapshot.toolName,
              planId,
              planName: planSnapshot.planName,
              oldPrice: planSnapshot.monthlyPerSeat,
              newPrice,
              delta: newPrice - planSnapshot.monthlyPerSeat,
            },
          ];
        }
      }
    }

    if (allChanges.length === 0) continue;

    // Filter to only changes affecting THIS audit's tools
    const relevantChanges = getChangesAffectingAudit(
      audit.input.tools,
      allChanges
    );

    if (relevantChanges.length === 0) continue;

    staleAudits.push({ audit, email, changes: relevantChanges });
  }

  if (staleAudits.length === 0) {
    return NextResponse.json({
      message: "All audits are up to date.",
      auditsScanned: audits.length,
      affectedAudits: 0,
      emailsSent: 0,
    });
  }

  // 4. Consolidate by email — one email per user even if multiple audits affected
  const emailGroups = new Map<
    string,
    typeof staleAudits
  >();

  for (const stale of staleAudits) {
    if (!emailGroups.has(stale.email)) {
      emailGroups.set(stale.email, []);
    }
    emailGroups.get(stale.email)!.push(stale);
  }

  // 5. Send one consolidated email per user
  let emailsSent = 0;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://spentsight.vercel.app";

  for (const [email, userAudits] of emailGroups) {
    const mostRecentAudit = userAudits.sort(
      (a, b) =>
        new Date(b.audit.created_at).getTime() -
        new Date(a.audit.created_at).getTime()
    )[0];

    const allChanges = userAudits.flatMap((a) => a.changes);
    const uniqueChanges = allChanges.filter(
      (c, i, arr) =>
        arr.findIndex((x) => x.toolId === c.toolId && x.planId === c.planId) === i
    );

    const changesHtml = uniqueChanges
      .map(
        (c) => `
        <tr>
          <td style="padding:8px 12px;color:#f0f2f5;">${c.toolName} ${c.planName}</td>
          <td style="padding:8px 12px;color:#8b929e;font-family:monospace;">$${c.oldPrice}/mo</td>
          <td style="padding:8px 12px;color:#8b929e;">→</td>
          <td style="padding:8px 12px;font-family:monospace;color:${c.delta > 0 ? "#f87171" : "#34d399"};">
            $${c.newPrice}/mo ${c.delta > 0 ? `(+$${c.delta})` : `(-$${Math.abs(c.delta)})`}
          </td>
        </tr>
      `
      )
      .join("");

    const reauditUrl = `${baseUrl}/reaudit/${mostRecentAudit.audit.id}`;

    try {
      await resend.emails.send({
        from: "SpendSight <onboarding@resend.dev>",
        to: email,
        subject: "Your AI spend audit is out of date — pricing has changed",
        html: `
          <div style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:40px 24px;background:#0a0b0d;color:#f0f2f5;">
            <h1 style="font-size:20px;margin:0 0 8px;color:#f0f2f5;">Pricing has changed since your audit.</h1>
            <p style="color:#8b929e;margin:0 0 24px;">
              ${uniqueChanges.length} tool${uniqueChanges.length > 1 ? "s" : ""} in your stack 
              ${uniqueChanges.length > 1 ? "have" : "has"} updated pricing. 
              Your previous recommendations may no longer be accurate.
            </p>

            <table style="width:100%;border-collapse:collapse;background:#111318;border-radius:8px;overflow:hidden;margin-bottom:24px;">
              <thead>
                <tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
                  <th style="padding:10px 12px;text-align:left;font-size:11px;color:#555d6b;text-transform:uppercase;letter-spacing:0.08em;">Tool</th>
                  <th style="padding:10px 12px;text-align:left;font-size:11px;color:#555d6b;text-transform:uppercase;letter-spacing:0.08em;">Was</th>
                  <th style="padding:10px 12px;"></th>
                  <th style="padding:10px 12px;text-align:left;font-size:11px;color:#555d6b;text-transform:uppercase;letter-spacing:0.08em;">Now</th>
                </tr>
              </thead>
              <tbody>${changesHtml}</tbody>
            </table>

            <a href="${reauditUrl}" style="display:inline-block;background:#f0a500;color:#000;font-weight:600;padding:12px 24px;border-radius:6px;text-decoration:none;margin-bottom:24px;">
              Re-run audit with new pricing →
            </a>

            <p style="font-size:12px;color:#555d6b;margin:0;">
              This link will show you a side-by-side comparison of your old and new recommendations.
            </p>

            <p style="font-size:11px;color:#555d6b;border-top:1px solid rgba(255,255,255,0.06);padding-top:20px;margin-top:24px;">
              SpendSight by Credex · 
              <a href="${baseUrl}/unsubscribe?email=${encodeURIComponent(email)}&auditId=${mostRecentAudit.audit.id}" style="color:#555d6b;">
                Unsubscribe from pricing alerts
              </a>
            </p>
          </div>
        `,
      });

      // Record notification so we don't send duplicates
      for (const stale of userAudits) {
        await supabaseAdmin.from("reaudit_notifications").insert({
          audit_id: stale.audit.id,
          email,
          changes_summary: stale.changes,
        });
      }

      emailsSent++;
    } catch (err) {
      console.error(`Failed to send email to ${email}:`, err);
    }
  }

  return NextResponse.json({
    message: "Detection complete.",
    auditsScanned: audits.length,
    affectedAudits: staleAudits.length,
    emailsSent,
  });
}

// GET handler for Vercel Cron (cron jobs use GET)
export async function GET(req: NextRequest) {
  // Vercel Cron passes authorization header automatically
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Reuse POST logic by constructing a fake POST request
  const fakeReq = new NextRequest(req.url, {
    method: "POST",
    headers: { "x-cron-secret": process.env.CRON_SECRET ?? "" },
  });

  return POST(fakeReq);
}