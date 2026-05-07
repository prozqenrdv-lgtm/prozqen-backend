import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'PROZQEN <onboarding@resend.dev>';
const ADMIN = process.env.ADMIN_EMAIL || 'prozqen.rdv@gmail.com';

// ==========================================
// EMAIL DE BIENVENUE
// ==========================================
export async function sendWelcomeEmail(user) {
  try {
    await resend.emails.send({
      from: FROM,
      to: user.email,
      subject: '🎉 Bienvenue sur PROZQEN !',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0f;color:#fafafa;padding:40px;border-radius:16px;">
          <h1 style="background:linear-gradient(135deg,#7B6CF6,#5B9CF6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:2rem;margin-bottom:8px;">PROZQEN</h1>
          <p style="color:#a0a0b0;margin-bottom:32px;">Agents IA pour la prospection immobilière</p>
          
          <h2 style="font-size:1.4rem;margin-bottom:16px;">Bienvenue ${user.email} ! 🚀</h2>
          <p style="color:#a0a0b0;line-height:1.6;margin-bottom:24px;">
            Votre compte <strong style="color:#7B6CF6">${user.plan}</strong> est prêt. 
            Vous pouvez maintenant lancer vos agents IA et automatiser votre prospection.
          </p>

          <div style="background:#131318;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin-bottom:24px;">
            <h3 style="margin-bottom:12px;font-size:1rem;">Vos agents disponibles:</h3>
            <p style="color:#a0a0b0;font-size:0.9rem;margin:6px 0;">🔍 Prospect Finder — identifie vos prospects idéaux</p>
            <p style="color:#a0a0b0;font-size:0.9rem;margin:6px 0;">✍️ Message Generator — crée vos messages personnalisés</p>
            <p style="color:#a0a0b0;font-size:0.9rem;margin:6px 0;">🔄 Follow-up Automation — planifie vos relances</p>
          </div>

          <a href="https://prozqen.vercel.app/dashboard.html" 
             style="display:inline-block;background:linear-gradient(135deg,#7B6CF6,#6B5CE6);color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:0.95rem;">
            Accéder au Dashboard →
          </a>

          <p style="color:#a0a0b0;font-size:0.8rem;margin-top:32px;">
            Des questions ? Répondez à cet email ou contactez-nous sur 
            <a href="mailto:support@prozqen.fr" style="color:#7B6CF6;">support@prozqen.fr</a>
          </p>
        </div>
      `
    });
    console.log('✅ Welcome email sent to:', user.email);
    return true;
  } catch (error) {
    console.error('❌ Welcome email error:', error.message);
    return false;
  }
}

// ==========================================
// EMAIL: AGENT IA TERMINÉ
// ==========================================
export async function sendAgentCompletedEmail(user, agentName, tokensUsed) {
  try {
    await resend.emails.send({
      from: FROM,
      to: user.email,
      subject: `⚡ Agent ${agentName} terminé — Résultats prêts`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0f;color:#fafafa;padding:40px;border-radius:16px;">
          <h1 style="background:linear-gradient(135deg,#7B6CF6,#5B9CF6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:1.8rem;margin-bottom:24px;">PROZQEN</h1>
          
          <h2 style="font-size:1.3rem;margin-bottom:12px;">⚡ ${agentName} a terminé!</h2>
          <p style="color:#a0a0b0;line-height:1.6;margin-bottom:24px;">
            Votre agent IA a terminé son analyse. Connectez-vous au dashboard pour voir les résultats.
          </p>

          <div style="background:#131318;border:1px solid rgba(123,108,246,0.2);border-radius:12px;padding:16px;margin-bottom:24px;">
            <p style="margin:4px 0;font-size:0.9rem;">🤖 Agent: <strong>${agentName}</strong></p>
            <p style="margin:4px 0;font-size:0.9rem;color:#a0a0b0;">⚡ Tokens utilisés: <strong style="color:#7B6CF6">${tokensUsed}</strong></p>
          </div>

          <a href="https://prozqen.vercel.app/dashboard.html" 
             style="display:inline-block;background:linear-gradient(135deg,#7B6CF6,#6B5CE6);color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;">
            Voir les résultats →
          </a>
        </div>
      `
    });
    return true;
  } catch (error) {
    console.error('❌ Agent email error:', error.message);
    return false;
  }
}

// ==========================================
// EMAIL: TOKENS FAIBLES (< 20%)
// ==========================================
export async function sendLowTokensEmail(user, tokensRemaining) {
  try {
    await resend.emails.send({
      from: FROM,
      to: user.email,
      subject: '⚠️ Vos tokens PROZQEN sont presque épuisés',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0f;color:#fafafa;padding:40px;border-radius:16px;">
          <h1 style="background:linear-gradient(135deg,#7B6CF6,#5B9CF6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:1.8rem;margin-bottom:24px;">PROZQEN</h1>
          
          <h2 style="font-size:1.3rem;margin-bottom:12px;">⚠️ Tokens presque épuisés</h2>
          <p style="color:#a0a0b0;line-height:1.6;margin-bottom:16px;">
            Il vous reste seulement <strong style="color:#FF6B6B">${tokensRemaining} tokens</strong> ce mois-ci.
          </p>
          <p style="color:#a0a0b0;margin-bottom:24px;">Upgradez votre plan pour continuer à prospecter sans interruption.</p>

          <a href="https://prozqen.vercel.app/#pricing" 
             style="display:inline-block;background:linear-gradient(135deg,#FF6B6B,#e05555);color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;">
            Upgrader mon plan →
          </a>
        </div>
      `
    });
    return true;
  } catch (error) {
    console.error('❌ Low tokens email error:', error.message);
    return false;
  }
}

// ==========================================
// EMAIL: NOUVEAU PROSPECT AJOUTÉ
// ==========================================
export async function sendNewProspectEmail(user, prospect) {
  try {
    await resend.emails.send({
      from: FROM,
      to: user.email,
      subject: `👤 Nouveau prospect ajouté: ${prospect.name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0f;color:#fafafa;padding:40px;border-radius:16px;">
          <h1 style="background:linear-gradient(135deg,#7B6CF6,#5B9CF6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:1.8rem;margin-bottom:24px;">PROZQEN</h1>
          
          <h2 style="font-size:1.3rem;margin-bottom:16px;">👤 Nouveau prospect ajouté!</h2>

          <div style="background:#131318;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin-bottom:24px;">
            <p style="margin:6px 0;">👤 <strong>${prospect.name}</strong></p>
            ${prospect.email ? `<p style="margin:6px 0;color:#a0a0b0;">📧 ${prospect.email}</p>` : ''}
            ${prospect.company ? `<p style="margin:6px 0;color:#a0a0b0;">🏢 ${prospect.company}</p>` : ''}
            ${prospect.city ? `<p style="margin:6px 0;color:#a0a0b0;">📍 ${prospect.city}</p>` : ''}
          </div>

          <a href="https://prozqen.vercel.app/dashboard.html" 
             style="display:inline-block;background:linear-gradient(135deg,#7B6CF6,#6B5CE6);color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;">
            Voir dans le Dashboard →
          </a>
        </div>
      `
    });
    return true;
  } catch (error) {
    console.error('❌ New prospect email error:', error.message);
    return false;
  }
}
