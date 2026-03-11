const GITHUB_API = 'https://api.github.com';

function getConfig() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH ?? 'main';
  return { token, repo, branch, configured: !!(token && repo) };
}

export function isGitHubConfigured(): boolean {
  return getConfig().configured;
}

async function getFileSHA(
  token: string,
  repo: string,
  branch: string,
  path: string
): Promise<string | null> {
  const url = `${GITHUB_API}/repos/${repo}/contents/${path}?ref=${branch}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub GET ${path} failed: ${res.status}`);
  const json = (await res.json()) as { sha: string };
  return json.sha;
}

export async function pushFileToGitHub(
  repoPath: string,
  content: unknown,
  commitTitle: string
): Promise<void> {
  const { token, repo, branch, configured } = getConfig();
  if (!configured) {
    console.warn('[githubSync] Skipping – GITHUB_TOKEN or GITHUB_REPO not set');
    return;
  }

  const message = `CMS Update: ${commitTitle}`;
  const encoded = Buffer.from(JSON.stringify(content, null, 2)).toString('base64');
  const sha = await getFileSHA(token!, repo!, branch, repoPath);

  const body: Record<string, unknown> = {
    message,
    content: encoded,
    branch,
  };
  if (sha) body.sha = sha;

  const url = `${GITHUB_API}/repos/${repo}/contents/${repoPath}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub PUT ${repoPath} failed (${res.status}): ${err}`);
  }

  console.log(`[githubSync] Pushed ${repoPath} — "${message}"`);
}

export async function deleteFileFromGitHub(
  repoPath: string,
  commitTitle: string
): Promise<void> {
  const { token, repo, branch, configured } = getConfig();
  if (!configured) return;

  const sha = await getFileSHA(token!, repo!, branch, repoPath);
  if (!sha) return;

  const url = `${GITHUB_API}/repos/${repo}/contents/${repoPath}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({
      message: `CMS Update: ${commitTitle}`,
      sha,
      branch,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub DELETE ${repoPath} failed (${res.status}): ${err}`);
  }

  console.log(`[githubSync] Deleted ${repoPath}`);
}
