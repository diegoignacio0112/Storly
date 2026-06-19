import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Resend free tier only allows sending to the account owner's email.
// Set RESEND_OWNER_EMAIL to redirect all outgoing mail to that address.
const OWNER_EMAIL = process.env.RESEND_OWNER_EMAIL

export async function sendWelcomeEmail(nombre: string, email: string) {
  const freeTierRedirect = !!OWNER_EMAIL && email !== OWNER_EMAIL
  const to = freeTierRedirect ? OWNER_EMAIL! : email

  console.log('[email] sendWelcomeEmail called', {
    intendedRecipient: email,
    actualRecipient: to,
    freeTierRedirect,
    hasApiKey: !!process.env.RESEND_API_KEY,
    apiKeyPrefix: process.env.RESEND_API_KEY?.slice(0, 8),
    ownerEmail: OWNER_EMAIL ?? '(not set)',
  })

  try {
    const result = await resend.emails.send({
      from: 'Storly <onboarding@resend.dev>',
      to,
      subject: freeTierRedirect
        ? `[TEST – intended for ${email}] ¡Bienvenido a Storly!`
        : '¡Bienvenido a Storly!',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#0a0a0f;font-family:Arial,sans-serif;">
          <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:32px;">
              <div style="width:36px;height:36px;background:#C9A84C;border-radius:8px;display:flex;align-items:center;justify-content:center;">
                <span style="color:#0a0a0f;font-weight:900;font-size:18px;">S</span>
              </div>
              <span style="color:white;font-size:20px;font-weight:700;">Storly</span>
            </div>
            ${freeTierRedirect ? `
            <div style="background:#7c2d12;border:1px solid #c2410c;border-radius:8px;padding:12px 16px;margin-bottom:16px;">
              <p style="color:#fed7aa;font-size:12px;margin:0;">
                <strong>DEV NOTE:</strong> Intended for <strong>${email}</strong> — redirected to owner (free-tier limit).
              </p>
            </div>` : ''}
            <div style="background:#0f1a14;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px;">
              <h1 style="color:white;font-size:28px;margin:0 0 8px;">¡Hola, ${nombre}! 👋</h1>
              <p style="color:#C9A84C;font-size:14px;margin:0 0 24px;">Tu bodega inteligente en Chile</p>
              <p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6;margin:0 0 24px;">
                Bienvenido a Storly. Ya eres parte de la plataforma de almacenamiento colaborativo más confiable de Chile.
              </p>
              <div style="background:#2D4A3E;border-radius:12px;padding:20px;margin:0 0 24px;">
                <p style="color:#C8D9B0;font-size:13px;margin:0 0 8px;font-weight:700;">¿Qué puedes hacer ahora?</p>
                <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:0;">✓ Publicar tu espacio y generar ingresos</p>
                <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:4px 0 0;">✓ Buscar bodegas cercanas con seguro incluido</p>
                <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:4px 0 0;">✓ Conectarte con emprendedores de tu comuna</p>
              </div>
              <a href="https://storly-two.vercel.app" style="display:inline-block;background:#C9A84C;color:#0a0a0f;font-weight:700;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;">
                Ir a Storly →
              </a>
            </div>
            <p style="color:rgba(255,255,255,0.2);font-size:11px;text-align:center;margin-top:24px;">
              © 2026 Storly — Almacenamiento colaborativo en Chile
            </p>
          </div>
        </body>
        </html>
      `,
    })

    console.log('[email] Resend response:', JSON.stringify(result, null, 2))
    return result
  } catch (err) {
    console.error('[email] Resend threw an exception:')
    console.error('[email] name:', (err as Error)?.name)
    console.error('[email] message:', (err as Error)?.message)
    console.error('[email] stack:', (err as Error)?.stack)
    console.error('[email] full error:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2))
    throw err
  }
}
