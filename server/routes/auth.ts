import { Router } from 'express';
import { getSupabaseClient } from '../utils/supabase.js';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    req.session.userId = data.user.id;
    req.session.email = data.user.email;

    res.json({
      user: {
        id: data.user.id,
        email: data.user.email || '',
        role: (data.user.user_metadata?.role as string) || 'admin',
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

router.get('/session', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ user: null });
  }

  res.json({
    user: {
      id: req.session.userId,
      email: req.session.email || '',
      role: 'admin',
    }
  });
});

export default router;
