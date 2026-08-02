<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	let container: HTMLElement;
	let componentInstance: any;

	onMount(async () => {
		try {
			const { mountRag, unmountRag } = await import('sp_ui_rag/RagPipelinePage');
			componentInstance = mountRag(container, {});
			return () => {
				unmountRag(componentInstance);
			};
		} catch (error) {
			console.error('Failed to load RagPipelinePage:', error);
		}
	});

	onDestroy(() => {
		if (componentInstance) {
			import('sp_ui_rag/RagPipelinePage').then(({ unmountRag }) => {
				unmountRag(componentInstance);
			}).catch(() => {});
		}
	});
</script>

<div bind:this={container} class="w-full h-full"></div>
