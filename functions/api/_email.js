// functions/api/_email.js

export async function sendEmail({ to, subject, html }, env) {
  const apiKey = env.SENDGRID_API_KEY;
  const fromEmail = env.FROM_EMAIL;

  if (!apiKey || !fromEmail || apiKey === 'PLACEHOLDER' || fromEmail === 'PLACEHOLDER') {
    console.warn('[Email Warning] SendGrid API credentials are not configured. Skipping sending email.');
    return false;
  }

  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: fromEmail, name: 'FlixoraPlay' },
        subject: subject,
        content: [{ type: 'text/html', value: html }]
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[Email Error] SendGrid returned status ${res.status}: ${errText}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Email Error] Failed to fetch SendGrid API:', err);
    return false;
  }
}

export function welcomeEmail(username) {
  return `
    <div style="font-family: sans-serif; background: #060914; color: #f1efff; padding: 40px; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.08);">
      <h1 style="color: #8b5cf6; font-size: 24px; margin-bottom: 20px; letter-spacing: -0.03em;">Welcome to FlixoraPlay, ${username}!</h1>
      <p style="font-size: 16px; line-height: 1.6; color: #b8b0d4;">Thank you for joining the ultimate AI Film Festival marketplace. You can now host competitions, submit AI-generated video entries, and vote for your favorite creators.</p>
      <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.08); margin: 30px 0;" />
      <p style="font-size: 12px; color: #7c6fa0;">You are receiving this because you registered at FlixoraPlay. If you didn't, please disregard this email.</p>
    </div>
  `;
}

export function resultsAnnouncedEmail(competitionTitle, rank) {
  const medalText = rank === 1 ? '🏆 1st Place' : rank === 2 ? '🥈 2nd Place' : rank === 3 ? '🥉 3rd Place' : 'Participant';
  return `
    <div style="font-family: sans-serif; background: #060914; color: #f1efff; padding: 40px; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.08);">
      <h1 style="color: #f59e0b; font-size: 24px; margin-bottom: 20px; letter-spacing: -0.03em;">Results Announced!</h1>
      <p style="font-size: 16px; line-height: 1.6; color: #b8b0d4;">The results for the competition <strong>"${competitionTitle}"</strong> have just been published by the host.</p>
      <div style="background: rgba(139,92,246,0.12); padding: 15px; border-radius: 8px; border: 1px solid rgba(139,92,246,0.2); margin: 20px 0; text-align: center;">
        <span style="font-size: 18px; font-weight: bold; color: #c4b5fd;">Your Status: ${medalText}</span>
      </div>
      <p style="font-size: 15px; color: #b8b0d4;">Head over to the platform to review the winners and scores!</p>
      <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.08); margin: 30px 0;" />
      <p style="font-size: 12px; color: #7c6fa0;">FlixoraPlay AI Film Festival.</p>
    </div>
  `;
}
