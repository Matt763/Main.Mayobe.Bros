import { Router } from 'express';
import { isGitHubConfigured } from '../utils/githubSync.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/status', requireAuth, (req, res) => {
  res.json({
    configured: isGitHubConfigured(),
    repo: process.env.GITHUB_REPO ?? null,
    branch: process.env.GITHUB_BRANCH ?? 'main',
  });
});

export default router;
