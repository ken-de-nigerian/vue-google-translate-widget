// The package is "type": "module", so dist/index.d.ts is read as ESM types.
// CommonJS consumers resolve through the "require" condition and need a .d.cts
// file, otherwise TypeScript reports the types as masquerading as ESM.
import { copyFileSync } from 'node:fs'

copyFileSync('dist/index.d.ts', 'dist/index.d.cts')
