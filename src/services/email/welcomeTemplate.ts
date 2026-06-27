export type WelcomeEmailInput = {
  firstName?: string;
  dashboardUrl?: string;
  unsubscribeUrl?: string;
};

export function buildWelcomeEmail(input: WelcomeEmailInput = {}) {
  const name = input.firstName?.trim() || 'traveller';
  const dashboardUrl = input.dashboardUrl || 'https://transvert-mvp.vercel.app';
  const unsubscribeUrl = input.unsubscribeUrl || `${dashboardUrl}/privacy`;

  const subject = 'Welcome to Transvert — see and know the world your way';

  const text = `Welcome to Transvert, ${name}.

See it. Scan it. Know it.

Transvert helps you understand menus, signs, prices and ATM fees when you travel. Upload a menu, rebuild it in your language, convert prices and use “Order this” to say the dish locally.

Try it here: ${dashboardUrl}

You are receiving this because you signed up to Transvert. You can manage updates or unsubscribe here: ${unsubscribeUrl}`;

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;background:#020713;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#f8fafc;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">See it. Scan it. Know it. Welcome to Transvert.</div>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#020713;padding:28px 14px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:620px;background:linear-gradient(135deg,#07111f,#020713);border:1px solid rgba(103,232,249,.22);border-radius:28px;overflow:hidden;">
            <tr>
              <td style="padding:34px 28px 18px;">
                <div style="font-size:12px;letter-spacing:4px;text-transform:uppercase;color:#67e8f9;font-weight:900;">Transvert</div>
                <h1 style="margin:16px 0 0;font-size:42px;line-height:44px;color:#ffffff;font-weight:900;">See and know the world your way.</h1>
                <p style="margin:18px 0 0;color:#a7b0c4;font-size:17px;line-height:26px;">Welcome, ${name}. Transvert helps you read menus, signs, receipts and travel prices with confidence wherever you are.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 28px 8px;">
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid rgba(255,255,255,.08);border-radius:20px;background:rgba(255,255,255,.04);">
                  <tr><td style="padding:20px 20px 8px;color:#ffffff;font-size:20px;font-weight:900;">What you can do now</td></tr>
                  <tr><td style="padding:0 20px 18px;color:#a7b0c4;font-size:15px;line-height:24px;">
                    <strong style="color:#ffffff;">Scan a menu</strong> and rebuild it in English with GBP estimates.<br />
                    <strong style="color:#ffffff;">Tap “Order this”</strong> to hear the dish spoken locally.<br />
                    <strong style="color:#ffffff;">Check ATM fees</strong> and help improve fee intelligence for other travellers.
                  </td></tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px 12px;">
                <a href="${dashboardUrl}" style="display:inline-block;background:#67e8f9;color:#020713;text-decoration:none;font-weight:900;font-size:16px;padding:15px 24px;border-radius:999px;">Open Transvert</a>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 28px 30px;color:#6f7890;font-size:12px;line-height:19px;">
                FX and ATM information is an estimate only. Always confirm final prices, allergens and ATM fees before purchase or withdrawal.<br /><br />
                You are receiving this because you signed up to Transvert. <a href="${unsubscribeUrl}" style="color:#67e8f9;">Manage updates</a>.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
}
