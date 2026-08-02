<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	let container: HTMLElement;
	let componentInstance: any;

	onMount(async () => {
		try {
			const { mountVault, unmountVault } = await import('sp_ui_vault/VaultPage');
			componentInstance = mountVault(container, {});
			return () => {
				unmountVault(componentInstance);
			};
		} catch (error) {
			console.error('Failed to load VaultPage:', error);
		}
	});

	onDestroy(() => {
		if (componentInstance) {
			import('sp_ui_vault/VaultPage').then(({ unmountVault }) => {
				unmountVault(componentInstance);
			}).catch(() => {});
		}
	});
</script>

<div bind:this={container} class="w-full h-full"></div>
