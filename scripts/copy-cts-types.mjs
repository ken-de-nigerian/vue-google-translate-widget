// The package is "type": "module", so dist/*.d.ts are read as ESM types.
// CommonJS consumers resolve through the "require" condition and need .d.cts
// files, otherwise TypeScript reports the types as masquerading as ESM.
import { copyFileSync } from 'node:fs'

for (const entry of ['index', 'server', 'testing']) {
  copyFileSync(`dist/${entry}.d.ts`, `dist/${entry}.d.cts`)
}
