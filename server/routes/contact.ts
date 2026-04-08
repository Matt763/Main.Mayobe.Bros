import { Router } from 'express';
import { getSupabaseClient } from '../utils/supabase.js';
import { sendContactAdminEmail, sendContactUserEmail } from '../utils/resend.js';

const router = Router();

function getSiteUrl(): string {
  return process.env.VITE_SITE_URL || 'https://mayobebros.com';
}

router.post('/', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const body = req.body;

    const contact = {
      name: (body.name || '').trim(),
      email: (body.email || '').trim().toLowerCase(),
      subject: (body.subject || '').trim(),
      message: (body.message || '').trim(),
      type: body.type || 'general',
    };

    if (!contact.name || !contact.email || !contact.message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const { data, error } = await supabase
      .from('contact_submissions')
      .insert({
        name: contact.name,
        email: contact.email,
        subject: contact.subject,
        message: contact.message,
        type: contact.type,
      })
      .select('id')
      .single();

    if (error) throw error;

    // Respond immediately — emails sent async so the user isn't blocked
    res.status(201).json({ success: true, id: data.id });

    const siteUrl = getSiteUrl();
    const contactWithId = { ...contact, id: data.id };

    // Admin notification
    sendContactAdminEmail(contactWithId, siteUrl).catch(e =>
      console.error('[CONTACT] Admin notification email failed:', e)
    );

    // User confirmation
    sendContactUserEmail(contactWithId, siteUrl).catch(e =>
      console.error('[CONTACT] User confirmation email failed:', e)
    );
  } catch (error) {
    console.error('Error saving contact submission:', error);
    res.status(500).json({ error: 'Failed to submit contact form' });
  }
});

export default router;
