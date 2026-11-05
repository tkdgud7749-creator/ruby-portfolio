// 인스타 장기 토큰(60일)을 매주 갱신해 GitHub Secrets 에 다시 저장한다.
// 필요: 환경변수 GH_TOKEN (repo 권한의 개인 토큰), 각 IG_TOKEN_*
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(await fs.readFile(path.join(ROOT, 'config.json'), 'utf8'));
let failed = false;

for (const acc of cfg.instagram || []) {
  const token = process.env[acc.tokenEnv];
  if (!token) continue;
  const r = await fetch(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`);
  const body = await r.json().catch(() => ({}));
  if (!r.ok || !body.access_token) { console.error(`${acc.tokenEnv} 갱신 실패:`, body?.error?.message || r.status); failed = true; continue; }
  console.log(`::add-mask::${body.access_token}`);
  execFileSync('gh', ['secret', 'set', acc.tokenEnv], { input: body.access_token, stdio: ['pipe', 'inherit', 'inherit'] });
  console.log(`${acc.tokenEnv} 갱신 완료 (만료까지 ${Math.round(body.expires_in / 86400)}일)`);
}
if (failed) process.exit(1);
