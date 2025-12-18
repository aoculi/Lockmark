import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'wxt'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  outDir: 'dist',
  modules: ['@wxt-dev/module-react', '@wxt-dev/auto-icons'],
  vite: () => ({
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    }
  }),
  autoIcons: {
    developmentIndicator: false
  },
  // Disable browser reload to avoid connection errors
  // The extension will still be built, but WXT won't try to reload it automatically
  webExt: {
    disabled: true
  },

  manifest: (env) => {
    const basePermissions: string[] = ['storage', 'tabs']

    // Only add side_panel permission for Chrome/Chromium (not Firefox)
    if (env.browser !== 'firefox') {
      basePermissions.push('side_panel')
    }

    // Add contextMenus permission for sidebar context menu item
    basePermissions.push('contextMenus')

    const manifest: any = {
      name: 'LockMark',
      description: 'Secure Bookmarks Vault',
      host_permissions: ['http://127.0.0.1:3500/*', 'http://localhost:3500/*'],
      permissions: basePermissions,
      content_security_policy: {
        extension_pages:
          "script-src 'self' http://localhost:3000 http://localhost:3001 'wasm-unsafe-eval'; object-src 'self'; worker-src 'self';"
      },
      browser_specific_settings: {
        chrome: {
          id: '@lockmark'
        },
        gecko: {
          id: '@lockmark'
        },
        edge: {
          id: '@lockmark'
        }
      } as any
    }

    // Add commands for keyboard shortcuts
    manifest.commands = {
      'open-sidepanel': {
        suggested_key: {
          default: 'Ctrl+Shift+X',
          mac: 'Command+Shift+X'
        },
        description: 'Open LockMark Sidebar'
      }
    }

    // Add sidebar_action for Firefox (not a permission, but a manifest field)
    if (env.browser === 'firefox') {
      manifest.sidebar_action = {
        default_panel: 'sidepanel/index.html',
        default_title: 'LockMark'
      }
    }

    return manifest
  }
})
