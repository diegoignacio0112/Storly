import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendWelcomeEmail(nombre: string, email: string) {
  await resend.emails.send({
    from: 'Storly <onboarding@resend.dev>',
    to: email,
    subject: '¡Bienvenido a Storly!',
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
            © 2025 Storly — Almacenamiento colaborativo en Chile
          </p>
        </div>
      </body>
      </html>
    `
  })
}
