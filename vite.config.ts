import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

import { federation } from '@module-federation/vite';

const isProd = process.env.NODE_ENV === 'production';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		federation({
			name: 'sp_ui_shell',
			remotes: {
				sp_ui_chat: isProd ? '/assets/sp_ui_chat/remoteEntry.js' : 'http://localhost:5174/assets/remoteEntry.js',
				sp_ui_vault: isProd ? '/assets/sp_ui_vault/remoteEntry.js' : 'http://localhost:5175/assets/remoteEntry.js',
				sp_ui_projects: isProd ? '/assets/sp_ui_projects/remoteEntry.js' : 'http://localhost:5176/assets/remoteEntry.js',
				sp_ui_rag: isProd ? '/assets/sp_ui_rag/remoteEntry.js' : 'http://localhost:5177/assets/remoteEntry.js',
				sp_ui_coding: isProd ? '/assets/sp_ui_coding/remoteEntry.js' : 'http://localhost:5178/assets/remoteEntry.js'
			},
			shared: ['svelte']
		})
	],
	server: {
		port: 5173,
		strictPort: true,
		cors: true
	},
	preview: {
		port: 5173,
		strictPort: true,
		cors: true
	},
	build: {
		target: 'esnext'
	},
	define: {
		__APP_VERSION__: JSON.stringify(pkg.version)
	}
});
