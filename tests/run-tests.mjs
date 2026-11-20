import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

const rootDir = process.cwd();
const testDistDir = path.join(rootDir, '.test-dist');
const tmpDbPath = path.join(os.tmpdir(), `ielts-test-${process.pid}-${Date.now()}.db`);

// Clean previous build output
fs.rmSync(testDistDir, { recursive: true, force: true });

// Compile tests and server modules to CommonJS
const tscBin = path.join(
  rootDir,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'tsc.cmd' : 'tsc'
);
execFileSync(tscBin, ['-p', 'tsconfig.tests.json'], { stdio: 'inherit' });

// Collect compiled test files
const compiledTestsDir = path.join(testDistDir, 'tests');
const testFiles = fs
  .readdirSync(compiledTestsDir)
  .filter((f) => f.endsWith('.test.js'))
  .sort()
  .map((f) => path.join(compiledTestsDir, f));

// Preload hook that resolves "@/..." imports to ".test-dist/src/..."
const preloadPath = path.join(testDistDir, 'alias-hook.cjs');
fs.writeFileSync(
  preloadPath,
  `
const Module = require('module');
const path = require('path');
const srcDist = ${JSON.stringify(path.join(testDistDir, 'src'))};
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  if (typeof request === 'string' && request.startsWith('@/')) {
    const mapped = path.join(srcDist, request.slice(2));
    return origResolve.call(this, mapped, parent, isMain, options);
  }
  return origResolve.call(this, request, parent, isMain, options);
};
`,
  'utf8'
);

try {
  const result = spawnSync(
    process.execPath,
    ['--require', preloadPath, '--test', ...testFiles],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'test',
        TURSO_DATABASE_URL: `file:${tmpDbPath}`,
        TURSO_AUTH_TOKEN: '',
        NEXT_PUBLIC_SUPABASE_URL: '',
        SUPABASE_SERVICE_ROLE_KEY: '',
        ADMIN_SECRET: 'unit-test-hmac-secret-must-be-long-enough-1234',
      },
    }
  );
  process.exitCode = result.status ?? 1;
} finally {
  fs.rmSync(testDistDir, { recursive: true, force: true });
  fs.rmSync(tmpDbPath, { force: true });
  fs.rmSync(`${tmpDbPath}-shm`, { force: true });
  fs.rmSync(`${tmpDbPath}-wal`, { force: true });
}

