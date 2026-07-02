// Produce a Firefox-compatible build from the Chrome dist.
// Firefox MV3 differences handled here:
//   - background: event page (`scripts` + type module) instead of `service_worker`
//   - `browser_specific_settings.gecko` (required id + min version)
//   - strict_min_version 128: first Firefox with content_scripts `world: "MAIN"`
//   - `use_dynamic_url` is Chrome-only → stripped from web_accessible_resources
// Everything else (chrome.* with promises, storage, tabs, permissions) works as-is.
import { cpSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const src = resolve(root, 'dist')
const out = resolve(root, 'dist-firefox')

if (!existsSync(src)) {
  console.error('dist/ not found — run `npm run build` first')
  process.exit(1)
}

rmSync(out, { recursive: true, force: true })
cpSync(src, out, { recursive: true })

const manifestPath = resolve(out, 'manifest.json')
const m = JSON.parse(readFileSync(manifestPath, 'utf8'))

// Background: Firefox uses event pages, not service workers.
const sw = m.background?.service_worker
if (sw) {
  m.background = { scripts: [sw], type: 'module' }
}

m.browser_specific_settings = {
  gecko: {
    id: 'siftget@vedono.github.io',
    strict_min_version: '128.0',
    // AMO requirement: declare what user data the extension collects. We collect none —
    // everything stays in chrome.storage.local, requests go only to googleapis.com.
    data_collection_permissions: { required: ['none'] },
  },
}

// Chrome-only key; Firefox warns on it.
if (Array.isArray(m.web_accessible_resources)) {
  for (const war of m.web_accessible_resources) delete war.use_dynamic_url
}

writeFileSync(manifestPath, JSON.stringify(m, null, 2))
console.log('dist-firefox/ ready (gecko id, event-page background, min FF 128)')
