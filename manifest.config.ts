import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json' with { type: 'json' }

// Brand name lives here (+ i18n dictionaries) — nothing in the logic layer hardcodes it.
const NAME = 'SiftGet'

const icons = {
  16: 'src/shared/assets/icons/icon-16.png',
  32: 'src/shared/assets/icons/icon-32.png',
  48: 'src/shared/assets/icons/icon-48.png',
  128: 'src/shared/assets/icons/icon-128.png',
}

export default defineManifest({
  manifest_version: 3,
  name: NAME,
  version: pkg.version,
  description:
    "Open a random video you haven't watched yet from the YouTube channel you're currently on.",

  icons,
  action: {
    default_popup: 'src/app/popup/index.html',
    default_title: NAME,
    default_icon: icons,
  },
  options_ui: {
    page: 'src/app/options/index.html',
    open_in_tab: true,
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['https://www.youtube.com/*', 'https://m.youtube.com/*'],
      js: ['src/content/detect-channel.ts', 'src/content/scan-watched.ts'],
      run_at: 'document_idle',
      all_frames: false,
    },
    {
      matches: ['https://www.youtube.com/*', 'https://m.youtube.com/*'],
      js: ['src/content/read-ytdata.ts'],
      run_at: 'document_idle',
      world: 'MAIN',
      all_frames: false,
    },
  ],

  permissions: ['storage', 'activeTab'],
  optional_permissions: ['history'],
  host_permissions: ['https://www.googleapis.com/*'],
})
