import { test, expect } from '@playwright/test';

test.describe('Validação das Entregas de Hoje', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.setItem('sovereign_token', 'e2e-mock-token-123456');
        });
    });

    test('Centralização do Design System - Sem preto puro', async ({ page }) => {
        await page.goto('/');
        
        // Testa se a cor de fundo do body não é preto puro rgb(0, 0, 0)
        const bgColor = await page.evaluate(() => {
            return window.getComputedStyle(document.body).backgroundColor;
        });
        
        expect(bgColor).not.toBe('rgb(0, 0, 0)');
        expect(bgColor).not.toBe('rgba(0, 0, 0, 1)');
        
        const errors: string[] = [];
        page.on('pageerror', (err) => errors.push(err.message));
        await page.waitForTimeout(500);
        expect(errors).toHaveLength(0);
    });

    test('TTFT Telemetry - Métrica avg_ttft_ms não quebra a interface', async ({ page }) => {
        // Intercept API calls to mock telemetry with the new avg_ttft_ms
        await page.route('**/v1/analytics/telemetry', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    total_tokens: 5000,
                    avg_tps: 45.5,
                    avg_latency_ms: 120,
                    avg_ttft_ms: 250, // A nova chave
                    estimated_cost: 0.05,
                    avg_cloud_cost_per_1k: 0.00625,
                    models_usage: {},
                    hardware: {
                        cpu_cores: [],
                        ram_usage_mb: 1000,
                        ram_total_gb: 24,
                        io_rx_bytes: 0,
                        io_tx_bytes: 0,
                        gpu_name: "Mock GPU",
                        gpu_vram_total_mb: 8000,
                        gpu_vram_used_mb: 2000,
                        gpu_utilization_pct: 10
                    }
                })
            });
        });

        const errors: string[] = [];
        page.on('pageerror', (err) => errors.push(err.message));

        await page.goto('/');
        await page.waitForTimeout(1000);
        
        const typeErrors = errors.filter(e => e.includes('TypeError') || e.includes('avgTtftMs') || e.includes('avg_ttft_ms'));
        expect(typeErrors).toHaveLength(0);
    });

    test('Navegação Cíbrida via Module Federation', async ({ page }) => {
        const routes = ['/vault', '/coding', '/chat', '/projects', '/rag'];
        
        for (const route of routes) {
            const errors: string[] = [];
            page.on('pageerror', (err) => errors.push(err.message));
            
            await page.goto(route);
            await expect(page.locator('main').first()).toBeVisible();
            await page.waitForTimeout(500);
            
            // Should load without critical module loading errors
            const fetchErrors = errors.filter(e => e.includes('Failed to fetch dynamically imported module'));
            expect(fetchErrors).toHaveLength(0);
        }
    });
});
