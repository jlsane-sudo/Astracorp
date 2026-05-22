import * as esbuild from 'esbuild';
import path from 'node:path';

const result = await esbuild.build({
  entryPoints: [path.resolve('scripts/ad-system-simulation-entry.js')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
  logLevel: 'silent',
});

const url = `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`;
await import(url);
