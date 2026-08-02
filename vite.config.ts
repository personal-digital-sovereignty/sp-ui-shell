import { readFileSync } from 'fs';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

import { federation } from '@module-federation/vite';

const isProd = process.env.NODE_ENV === 'production';

function dummyFederation() {
  return {
    name: 'dummy-federation',
    resolveId(id: string) {
      if (id.startsWith('sp_ui_')) {
        return '\0dummy-federation:' + id;
      }
    },
    load(id: string) {
      if (id.startsWith('\0dummy-federation:')) {
        return `
          export const mountSpotlight = () => {};
          export const unmountSpotlight = () => {};
          export const mountVault = () => {};
          export const unmountVault = () => {};
          export const mountProjects = () => {};
          export const unmountProjects = () => {};
          export const mountRag = () => {};
          export const unmountRag = () => {};
          export const mountCoding = () => {};
          export const unmountCoding = () => {};
          export default function() { return {}; }
        `;
      }
    }
  };
}

export default defineConfig(({ isSsrBuild }) => {
	const plugins = [tailwindcss(), sveltekit()];
	
	if (isSsrBuild) {
		plugins.push(dummyFederation());
	} else {
		plugins.push(
			federation({
				name: 'sp_ui_shell',
				remotes: {
					sp_ui_chat: {
						type: 'module',
						name: 'sp_ui_chat',
						entry: isProd ? '/assets/sp_ui_chat/remoteEntry.js' : 'http://localhost:5174/assets/remoteEntry.js'
					},
					sp_ui_vault: {
						type: 'module',
						name: 'sp_ui_vault',
						entry: isProd ? '/assets/sp_ui_vault/remoteEntry.js' : 'http://localhost:5175/assets/remoteEntry.js'
					},
					sp_ui_projects: {
						type: 'module',
						name: 'sp_ui_projects',
						entry: isProd ? '/assets/sp_ui_projects/remoteEntry.js' : 'http://localhost:5176/assets/remoteEntry.js'
					},
					sp_ui_rag: {
						type: 'module',
						name: 'sp_ui_rag',
						entry: isProd ? '/assets/sp_ui_rag/remoteEntry.js' : 'http://localhost:5177/assets/remoteEntry.js'
					},
					sp_ui_coding: {
						type: 'module',
						name: 'sp_ui_coding',
						entry: isProd ? '/assets/sp_ui_coding/remoteEntry.js' : 'http://localhost:5178/assets/remoteEntry.js'
					}
				},
				shared: ['svelte']
			})
		);
	}

	return {
		plugins,
		build: {
			target: 'esnext'
		},
		define: {
			__APP_VERSION__: JSON.stringify(pkg.version)
		},
		test: {
			include: ['src/**/*.{test,spec}.{js,ts}']
		}
	};
});
