import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, rmSync } from 'node:fs';

const api = 'app/api';
const parkRoot = '.pages-park';
const parked = `${parkRoot}/api`;

function restore() {
  if (!existsSync(parked)) return;
  if (!existsSync(api)) cpSync(parked, api, { recursive: true });
  rmSync(parkRoot, { recursive: true, force: true });
}

if (existsSync(parked) && !existsSync(api)) restore();
rmSync(parkRoot, { recursive: true, force: true });
cpSync(api, parked, { recursive: true });
rmSync(api, { recursive: true, force: true });

let status = 1;
try {
  const child = spawnSync('npx', ['next', 'build'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, GITHUB_PAGES: 'true' },
  });
  status = child.status ?? 1;
} finally {
  restore();
}

if (!existsSync(api)) {
  console.error('API routes were not restored after the Pages export.');
  process.exit(1);
}

process.exit(status);
