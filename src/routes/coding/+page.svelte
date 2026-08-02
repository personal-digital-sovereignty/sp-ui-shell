<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	let container: HTMLElement;
	let componentInstance: any;

	onMount(async () => {
		try {
			const { mountCoding, unmountCoding } = await import('sp_ui_coding/CodingPage');
			componentInstance = mountCoding(container, {});
			return () => {
				unmountCoding(componentInstance);
			};
		} catch (error) {
			console.error('Failed to load CodingPage:', error);
		}
	});

	onDestroy(() => {
		if (componentInstance) {
			import('sp_ui_coding/CodingPage').then(({ unmountCoding }) => {
				unmountCoding(componentInstance);
			}).catch(() => {});
		}
	});
</script>

<div bind:this={container} class="w-full h-full"></div>
