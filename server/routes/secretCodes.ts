import { Router } from 'express';
import { getSupabaseClient } from '../utils/supabase.js';

const router = Router();

function generateStaffCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `S-${code}`;
}

function generateMemberCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `MB-${code}`;
}

router.post('/generate', async (req, res) => {
  try {
    const { userId, userType } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const supabase = getSupabaseClient();

    if (userType === 'admin') {
      const { data: existing } = await supabase
        .from('admin_users')
        .select('secret_code')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing?.secret_code) {
        return res.json({ secretCode: existing.secret_code });
      }

      const code = generateStaffCode();
      await supabase
        .from('admin_users')
        .update({ secret_code: code })
        .eq('user_id', userId);

      return res.json({ secretCode: code });
    }

    const { data: existing } = await supabase
      .from('registered_users')
      .select('secret_code')
      .eq('id', userId)
      .maybeSingle();

    if (existing?.secret_code) {
      return res.json({ secretCode: existing.secret_code });
    }

    const code = generateMemberCode();
    await supabase
      .from('registered_users')
      .update({ secret_code: code })
      .eq('id', userId);

    return res.json({ secretCode: code });
  } catch (error) {
    console.error('Secret code generation error:', error);
    res.status(500).json({ error: 'Failed to generate secret code' });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { secretCode } = req.body;
    if (!secretCode) return res.status(400).json({ error: 'secretCode required' });

    const supabase = getSupabaseClient();

    if (secretCode.startsWith('S-')) {
      const { data } = await supabase
        .from('admin_users')
        .select('user_id, email')
        .eq('secret_code', secretCode)
        .maybeSingle();

      if (!data) return res.status(404).json({ error: 'Invalid secret code' });
      return res.json({ userId: data.user_id, email: data.email, type: 'admin' });
    }

    if (secretCode.startsWith('MB-')) {
      const { data } = await supabase
        .from('registered_users')
        .select('id, email')
        .eq('secret_code', secretCode)
        .maybeSingle();

      if (!data) return res.status(404).json({ error: 'Invalid secret code' });
      return res.json({ userId: data.id, email: data.email, type: 'member' });
    }

    return res.status(400).json({ error: 'Invalid code format' });
  } catch (error) {
    console.error('Secret code verify error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { secretCode, newPassword } = req.body;
    if (!secretCode || !newPassword) {
      return res.status(400).json({ error: 'Secret code and new password required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const supabase = getSupabaseClient();
    let userId: string | null = null;

    if (secretCode.startsWith('S-')) {
      const { data } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('secret_code', secretCode)
        .maybeSingle();
      userId = data?.user_id || null;
    } else if (secretCode.startsWith('MB-')) {
      const { data } = await supabase
        .from('registered_users')
        .select('id')
        .eq('secret_code', secretCode)
        .maybeSingle();
      userId = data?.id || null;
    }

    if (!userId) {
      return res.status(404).json({ error: 'Invalid secret code' });
    }

    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      return res.status(500).json({ error: 'Failed to reset password' });
    }

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const supabase = getSupabaseClient();

    const { data: admin } = await supabase
      .from('admin_users')
      .select('secret_code')
      .eq('user_id', userId)
      .maybeSingle();

    if (admin?.secret_code) {
      return res.json({ secretCode: admin.secret_code });
    }

    const { data: member } = await supabase
      .from('registered_users')
      .select('secret_code')
      .eq('id', userId)
      .maybeSingle();

    return res.json({ secretCode: member?.secret_code || null });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch secret code' });
  }
});

export default router;
