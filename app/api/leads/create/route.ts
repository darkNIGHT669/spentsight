/**
 * app/api/leads/create/route.ts
 *
 * Round 2 fix: corrected Resend sender address to onboarding@resend.dev
 * so email actually sends without domain verification.
 * Also links email to audit for re-audit notifications.
 */

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Honeypot
  if (body._hp) {
    return NextResponse.json({ success: true });
  }

  const { auditId, email, companyName, role, teamSize, monthlySavings } = body;

  if (!auditId || !email) {
    return NextResponse.json(
      { error: "Audit ID and email are required." },
      { status: 400 }
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  // Store lead — upsert so duplicate emails for same audit don't error
  const { error: dbError } = await supabaseAdmin
    .from("leads")
    .upsert(
      {
        audit_id: auditId,
        email,
        company_name: companyName || null,
        role: role || null,
        team_size: teamSize || null,
      },
      { onConflict: "audit_id,email" }
    );

  if (dbError) {
    console.error("Lead insert error:", dbError);
    // Don't block email send if DB write fails
  }

  const isHighSavings = monthlySavings > 300;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://spentsight.vercel.app";
  const shareUrl = `${baseUrl}/audit/${auditId}`;

  try {
    const { error: emailError } = await resend.emails.send({
      // onboarding@resend.dev works without domain verification
      from: "SpendSight <onboarding@resend.dev>",
      to: email,
      subject: `Your AI spend audit — $${Math.round(monthlySavings * 12).toLocaleString()}/yr in potential savings`,
      html: `
        <div style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:40px 24px;background:#0a0b0d;color:#f0f2f5;">
          <h1 style="font-size:22px;margin:0 0 8px;color:#f0f2f5;">Your audit is ready.</h1>
          <p style="color:#8b929e;margin:0 0 28px;">Here's what we found${companyName ? ` for ${companyName}` : ""}.</p>

          <div style="background:#111318;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:24px;margin-bottom:24px;">
            <p style="font-size:12px;color:#555d6b;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 6px;">Potential annual savings</p>
            <p style="font-size:36px;font-weight:700;color:#f0a500;margin:0 0 4px;font-family:monospace;">
              $${Math.round(monthlySavings * 12).toLocaleString()}/yr
            </p>
            <p style="font-size:13px;color:#8b929e;margin:0;">$${Math.round(monthlySavings).toLocaleString()}/month · based on verified vendor pricing</p>
          </div>

          <a href="${shareUrl}" style="display:inline-block;background:#f0a500;color:#000;font-weight:600;padding:12px 24px;border-radius:6px;text-decoration:none;margin-bottom:28px;">
            View full audit →
          </a>

          ${isHighSavings ? `
          <div style="background:rgba(240,165,0,0.08);border:1px solid rgba(240,165,0,0.2);border-radius:8px;padding:16px;margin-bottom:24px;">
            <p style="font-size:13px;color:#f0a500;font-weight:600;margin:0 0 4px;">You may qualify for additional savings via Credex</p>
            <p style="font-size:13px;color:#8b929e;margin:0 0 12px;">Credex sources discounted AI infrastructure credits from companies that overforecast. A team with your spend profile could save an additional 20–40%.</p>
            <a href="https://credex.rocks" style="font-size:13px;color:#f0a500;text-decoration:none;">Learn more at credex.rocks →</a>
          </div>
          ` : ""}

          <p style="font-size:12px;color:#555d6b;border-top:1px solid rgba(255,255,255,0.06);padding-top:20px;margin:0;">
            SpendSight by Credex · <a href="${shareUrl}" style="color:#555d6b;">View shareable audit</a>
          </p>
        </div>
      `,
    });

    if (emailError) {
      console.error("Resend error:", emailError);
    }
  } catch (emailErr) {
    console.error("Email send failed:", emailErr);
    // Never block lead capture on email failure
  }

  return NextResponse.json({ success: true }, { status: 201 });
}