import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// A production build must know where the backend API lives (e.g. https://api.your-domain.com/api).
// Set it in frontend/.env.production (see .env.production.example).
const requireApiUrl = (env) => {
  const value = env.VITE_API_URL
  let url
  try { url = new URL(value) } catch { url = null }
  if (!url || !/^https?:$/.test(url.protocol)) {
    throw new Error(
      `VITE_API_URL ${value ? `("${value}") is not a full web address` : 'is not set'}.\n` +
      'Create frontend/.env.production with the address of your backend on Hostinger, for example:\n' +
      '  VITE_API_URL=https://api.your-domain.com/api'
    )
  }
  return url
}

// Writes the backend's address into the security policy in dist/.htaccess (Hostinger's web server
// reads that file; public/.htaccess has the placeholder __API_ORIGIN__).
const htaccessApiOrigin = (apiUrl) => {
  let outDir
  return {
    name: 'htaccess-api-origin',
    apply: 'build',
    configResolved(config) { outDir = path.resolve(config.root, config.build.outDir) },
    closeBundle() {
      const file = path.join(outDir, '.htaccess')
      if (!fs.existsSync(file)) return
      fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replaceAll('__API_ORIGIN__', apiUrl.origin))
    }
  }
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = command === 'build' ? requireApiUrl(env) : null

  return {
    plugins: [react(), ...(apiUrl ? [htaccessApiOrigin(apiUrl)] : [])],
    // Served from the domain root; keeps asset URLs absolute (/assets/...) so they load on nested routes.
    base: '/',
    server: {
      port: 5175,
      strictPort: true
    }
  }
})
