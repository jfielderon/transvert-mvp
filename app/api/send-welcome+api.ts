import { buildWelcomeEmail } from '@/services/email/welcomeTemplate';

type RequestBody = {
  email?: string;
  firstName?: string;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return json({ ok: false, error: 'RESEND_API_KEY is not configured.' }, 500);

  let body: RequestBody = {};
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid request body.' }, 400);
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !/\S+@\S+\.\S+/.test(email)) return json({ ok: false, error: 'Valid email required.' }, 400);

  const dashboardUrl = new URL(request.url).origin;
  const template = buildWelcomeEmail({ firstName: body.firstName, dashboardUrl, unsubscribeUrl: `${dashboardUrl}/privacy` });

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Transvert by Optima <enquires@optimacommercial.co.uk>',
      reply_to: 'enquires@optimacommercial.co.uk',
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) return json({ ok: false, error: payload?.message ?? 'Resend failed.', details: payload }, 502);

  return json({ ok: true, id: payload?.id });
}
