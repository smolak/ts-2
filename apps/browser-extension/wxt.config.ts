import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  srcDir: "src",
  dev: {
    server: {
      port: 3001,
    }
  },
  manifest: {
    permissions: ["activeTab", "scripting", "storage"],
    host_permissions: ["<all_urls>"],
  },
  vite: () => ({
    plugins: [tailwindcss()],
  })
});
