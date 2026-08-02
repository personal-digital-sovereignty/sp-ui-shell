<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	let container: HTMLElement;
	let componentInstance: any;

	onMount(async () => {
		try {
			const { mountProjects, unmountProjects } = await import('sp_ui_projects/ProjectsPage');
			componentInstance = mountProjects(container, {});
			return () => {
				unmountProjects(componentInstance);
			};
		} catch (error) {
			console.error('Failed to load ProjectsPage:', error);
		}
	});

	onDestroy(() => {
		if (componentInstance) {
			import('sp_ui_projects/ProjectsPage').then(({ unmountProjects }) => {
				unmountProjects(componentInstance);
			}).catch(() => {});
		}
	});
</script>

<div bind:this={container} class="w-full h-full"></div>
