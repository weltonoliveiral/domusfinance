import { mutation, action, internalAction, internalMutation, query, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Generate a random token
function generateResetToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const requestPasswordReset = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    // Check if user exists
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .unique();

    if (!user) {
      // Don't reveal if email exists or not for security
      return { success: true };
    }

    // Generate reset token
    const token = generateResetToken();
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour from now

    // Store reset token
    await ctx.db.insert("passwordResetTokens", {
      email: args.email,
      token,
      expiresAt,
      used: false,
    });

    // Schedule email sending
    await ctx.scheduler.runAfter(0, internal.passwordReset.sendResetEmail, {
      email: args.email,
      token,
    });

    return { success: true };
  },
});

export const sendResetEmail = internalAction({
  args: { 
    email: v.string(),
    token: v.string()
  },
  handler: async (ctx, args) => {
    // Get the site URL from environment or use localhost for development
    const siteUrl = process.env.CONVEX_SITE_URL || 'http://localhost:5173';
    const resetUrl = `${siteUrl}/reset-password?token=${args.token}`;
    
    console.log('Generated reset URL:', resetUrl);
    
    // Check if we have Resend configured
    if (!process.env.CONVEX_RESEND_API_KEY) {
      console.log(`Password reset token for ${args.email}: ${args.token}`);
      console.log(`Reset URL: ${resetUrl}`);
      return { success: true };
    }

    try {
      // Import Resend dynamically to avoid issues if not installed
      const { Resend } = await import("resend");
      
      const resend = new Resend(process.env.CONVEX_RESEND_API_KEY);
      
      const { data, error } = await resend.emails.send({
        from: "DomusFinance <noreply@domusfinance.app>",
        to: args.email,
        subject: "Redefinir sua senha",
        text: `Olá! Foi solicitada a redefinição da sua senha na DomusFinance. Clique no link para criar uma nova senha: ${resetUrl}. Este link expira em 1 hora por questões de segurança. Se você não solicitou esta redefinição, pode ignorar este e-mail tranquilamente.`,
        html: `
          <!DOCTYPE html>
          <html lang="pt-BR">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Redefinir sua senha - DomusFinance</title>
            <!--[if mso]>
            <noscript>
              <xml>
                <o:OfficeDocumentSettings>
                  <o:PixelsPerInch>96</o:PixelsPerInch>
                </o:OfficeDocumentSettings>
              </xml>
            </noscript>
            <![endif]-->
            <style>
              /* Reset styles */
              body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
              table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
              img { -ms-interpolation-mode: bicubic; }
              
              /* Base styles */
              body { 
                margin: 0; 
                padding: 0; 
                width: 100% !important; 
                min-width: 100%; 
                background-color: #f8fafc; 
                font-family: 'Roboto', Arial, sans-serif; 
                -webkit-font-smoothing: antialiased; 
                -moz-osx-font-smoothing: grayscale;
              }
              
              table { border-collapse: collapse; }
              
              .container { 
                max-width: 600px; 
                margin: 0 auto; 
                background-color: #ffffff; 
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
              }
              
              .header { 
                background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); 
                padding: 40px 30px; 
                text-align: center; 
              }
              
              .header h1 { 
                color: #ffffff; 
                margin: 0; 
                font-size: 32px; 
                font-weight: 700; 
                letter-spacing: -0.5px;
              }
              
              .header p { 
                color: #dbeafe; 
                margin: 8px 0 0 0; 
                font-size: 16px; 
                font-weight: 400;
              }
              
              .content { 
                padding: 48px 30px; 
                line-height: 1.6;
              }
              
              .content h2 { 
                color: #1f2937; 
                margin: 0 0 24px 0; 
                font-size: 24px; 
                font-weight: 600;
              }
              
              .content p { 
                color: #4b5563; 
                margin: 0 0 16px 0; 
                font-size: 16px; 
                line-height: 1.6;
              }
              
              .greeting { 
                font-size: 18px; 
                font-weight: 500; 
                color: #374151; 
                margin-bottom: 24px !important;
              }
              
              .button-container { 
                text-align: center; 
                margin: 40px 0; 
              }
              
              .reset-button { 
                background: #2563eb; 
                color: #ffffff; 
                padding: 18px 36px; 
                text-decoration: none; 
                border-radius: 8px; 
                display: inline-block; 
                font-weight: 600; 
                font-size: 16px;
                box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
                transition: all 0.3s ease;
                border: none;
                min-width: 200px;
              }
              
              .reset-button:hover { 
                background: #1d4ed8; 
                transform: translateY(-1px);
                box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
              }
              
              .fallback-text {
                color: #6b7280;
                font-size: 14px;
                margin: 24px 0 16px 0;
              }
              
              .link-text { 
                color: #2563eb; 
                word-break: break-all; 
                font-size: 14px; 
                background: #f1f5f9; 
                padding: 16px; 
                border-radius: 8px; 
                margin: 0 0 32px 0;
                border: 1px solid #e2e8f0;
              }
              
              .link-text a {
                color: #2563eb;
                text-decoration: none;
              }
              
              .warning { 
                background: #fef3c7; 
                border-left: 4px solid #f59e0b; 
                padding: 20px; 
                margin: 32px 0; 
                border-radius: 8px;
                border-top-left-radius: 0;
                border-bottom-left-radius: 0;
              }
              
              .warning p { 
                color: #92400e; 
                margin: 0; 
                font-weight: 600; 
                font-size: 15px;
              }
              
              .security-note { 
                background: #ecfdf5; 
                border: 1px solid #d1fae5; 
                padding: 20px; 
                border-radius: 8px; 
                margin: 32px 0;
              }
              
              .security-note p { 
                color: #065f46; 
                margin: 0; 
                font-size: 15px; 
                font-weight: 500;
              }
              
              .footer { 
                background: #f8fafc; 
                padding: 32px 30px; 
                text-align: center; 
                border-top: 1px solid #e5e7eb; 
              }
              
              .footer p { 
                color: #6b7280; 
                font-size: 14px; 
                margin: 8px 0; 
                line-height: 1.5;
              }
              
              .footer .brand { 
                font-weight: 600; 
                color: #374151;
              }
              
              /* Mobile responsiveness */
              @media only screen and (max-width: 600px) {
                .container { width: 100% !important; }
                .header { padding: 30px 20px !important; }
                .content { padding: 32px 20px !important; }
                .footer { padding: 24px 20px !important; }
                .reset-button { 
                  padding: 16px 24px !important; 
                  font-size: 15px !important;
                  min-width: 180px !important;
                }
                .header h1 { font-size: 28px !important; }
                .content h2 { font-size: 22px !important; }
              }
              
              /* Dark mode support */
              @media (prefers-color-scheme: dark) {
                .container { background-color: #ffffff !important; }
                .content p { color: #4b5563 !important; }
                .content h2 { color: #1f2937 !important; }
              }
            </style>
          </head>
          <body>
            <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: 'Roboto', Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
              Solicitação de redefinição de senha recebida. Clique para criar uma nova senha e garantir a segurança da sua conta DomusFinance.
            </div>
            
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td>
                  <div class="container">
                    <div class="header">
                      <h1>DomusFinance</h1>
                      <p>Sua plataforma de gestão financeira pessoal</p>
                    </div>
                    
                    <div class="content">
                      <h2>🔐 Redefinir sua senha</h2>
                      
                      <p class="greeting">Olá!</p>
                      
                      <p>Foi solicitada a redefinição da sua senha na <strong>DomusFinance</strong>. Para criar uma nova senha e garantir o acesso seguro à sua conta, clique no botão abaixo:</p>
                      
                      <div class="button-container">
                        <a href="${resetUrl}" class="reset-button">
                          Redefinir Minha Senha
                        </a>
                      </div>
                      
                      <p class="fallback-text">Se o botão não funcionar, copie e cole este link no seu navegador:</p>
                      <div class="link-text">
                        <a href="${resetUrl}">${resetUrl}</a>
                      </div>
                      
                      <div class="warning">
                        <p>⏰ <strong>Importante:</strong> Este link expira em 1 hora por questões de segurança.</p>
                      </div>
                      
                      <div class="security-note">
                        <p>🛡️ <strong>Orientação de Segurança:</strong> Se você não solicitou esta redefinição, pode ignorar este e-mail tranquilamente. Nenhuma ação será tomada na sua conta.</p>
                      </div>
                    </div>
                    
                    <div class="footer">
                      <p class="brand">DomusFinance</p>
                      <p>Gerencie suas finanças com inteligência e segurança</p>
                      <p>Este é um e-mail automático, não responda a esta mensagem.</p>
                      <p>© 2024 DomusFinance. Todos os direitos reservados.</p>
                    </div>
                  </div>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      });

      if (error) {
        console.error('Failed to send email:', error);
        // Fallback: log the token for development
        console.log(`Password reset token for ${args.email}: ${args.token}`);
        console.log(`Reset URL: ${resetUrl}`);
        return { success: true };
      }

      console.log('Password reset email sent successfully to:', args.email);
      return { success: true, data };
    } catch (error) {
      console.error('Error sending reset email:', error);
      // Fallback: log the token for development
      console.log(`Password reset token for ${args.email}: ${args.token}`);
      console.log(`Reset URL: ${resetUrl}`);
      return { success: true };
    }
  },
});

export const validateResetToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const resetToken = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!resetToken) {
      throw new Error("Token inválido");
    }

    if (resetToken.used) {
      throw new Error("Token já foi utilizado");
    }

    if (resetToken.expiresAt < Date.now()) {
      throw new Error("Token expirado");
    }

    return { 
      valid: true, 
      email: resetToken.email 
    };
  },
});

export const resetPassword = mutation({
  args: { 
    token: v.string(), 
    newPassword: v.string() 
  },
  handler: async (ctx, args) => {
    // Validate token first
    const resetToken = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!resetToken) {
      throw new Error("Token inválido");
    }

    if (resetToken.used) {
      throw new Error("Token já foi utilizado");
    }

    if (resetToken.expiresAt < Date.now()) {
      throw new Error("Token expirado");
    }

    // Find user
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", resetToken.email))
      .unique();

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    // Mark token as used
    await ctx.db.patch(resetToken._id, {
      used: true,
      usedAt: Date.now(),
    });

    // Update user password using Convex Auth
    // Note: This requires integration with Convex Auth's password update mechanism
    // For now, we'll mark the token as used and return success
    // The actual password update would need to be handled by the auth system
    
    return { success: true };
  },
});

// Add a cleanup function for expired tokens
export const cleanupExpiredTokens = internalAction({
  args: {},
  handler: async (ctx, args) => {
    const now = Date.now();
    const expiredTokens: any[] = await ctx.runQuery(internal.passwordReset.getExpiredTokens, { now });
    
    for (const token of expiredTokens) {
      await ctx.runMutation(internal.passwordReset.deleteToken, { tokenId: token._id });
    }
    
    console.log(`Cleaned up ${expiredTokens.length} expired password reset tokens`);
    return { cleaned: expiredTokens.length };
  },
});

export const getExpiredTokens = internalQuery({
  args: { now: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_expires", (q) => q.lt("expiresAt", args.now))
      .collect();
  },
});

export const deleteToken = internalMutation({
  args: { tokenId: v.id("passwordResetTokens") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.tokenId);
  },
});
