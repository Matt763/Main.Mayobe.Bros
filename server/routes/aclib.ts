import { Router } from 'express';

const router = Router();

const ACLIB_UPSTREAM = 'https://adbpage.com/adblock?v=3&format=js&lnxv=2';

router.get('/', async (_req, res) => {
  try {
    const upstream = await fetch(ACLIB_UPSTREAM, {
      headers: { 'User-Agent': 'mayobebros-aclib-proxy/1.0' },
    });

    if (!upstream.ok) {
      res.status(502).type('application/javascript').send('/* aclib upstream error */');
      return;
    }

    const body = await upstream.text();
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    res.send(body);
  } catch {
    res.status(502).type('application/javascript').send('/* aclib fetch failed */');
  }
});

export default router;
