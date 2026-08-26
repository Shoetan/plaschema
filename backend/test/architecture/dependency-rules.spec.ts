import { execFileSync } from 'node:child_process';
import path from 'node:path';

describe('Clean Architecture dependency rules', () => {
  it('passes dependency-cruiser boundary checks', () => {
    execFileSync(
      process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
      ['exec', 'depcruise', 'src', '--config', 'dependency-cruiser.cjs'],
      {
        cwd: path.resolve(__dirname, '../..'),
        stdio: 'pipe',
        encoding: 'utf8',
      },
    );
  });
});
