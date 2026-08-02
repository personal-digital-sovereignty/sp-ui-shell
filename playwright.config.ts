import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
//	webServer: {
//		command: 'npx concurrently "npm run dev" "cd ../sp-ui-chat && npm run dev" "cd ../sp-ui-vault && npm run dev" "cd ../sp-ui-projects && npm run dev" "cd ../sp-ui-rag && npm run dev" "cd ../sp-ui-coding && npm run dev"',
//		url: 'http://localhost:5173',
//		timeout: 120000
//	},
	testDir: 'tests/e2e',
	use: {
		baseURL: 'http://localhost:4173'
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		}
	]
});
