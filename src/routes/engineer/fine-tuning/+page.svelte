<script lang="ts">
	import { logger } from '@sp/ui-core/logger';

	import { API_BASE_URL } from '@sp/ui-core/config';

	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import {
		trainerState,
		exportTrainerConfig,
		fetchTrainerStats,
		sendUnslothControl,
		AI_MODELS,
		populateTrainerModels
	} from '@sp/ui-core/trainer';

	let targetModel = $derived(
		AI_MODELS.find((m) => m.type === 'local')?.id || 'Sovereign-Base-Model'
	);

	let isSubmitting = $state(false);
	let pollingInterval: any;

	onMount(() => {
		populateTrainerModels();
		fetchTrainerStats();
		pollingInterval = setInterval(fetchTrainerStats, 10000);
		return () => clearInterval(pollingInterval);
	});

	async function runFineTuning() {
		if (isSubmitting) return;
		isSubmitting = true;
		try {
			await fetch(`${API_BASE_URL}/v1/engineer/trainer/finetune`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					base_model: targetModel,
					dataset_name: `sovereign-hq-${new Date().toISOString().split('T')[0]}-tuning`,
					learning_rate: trainerState.learningRate,
					lora_rank: trainerState.loraRank,
					batch_size: trainerState.batchSize,
					internet_to_rag: trainerState.internetToRagActive,
					strict_grounding: trainerState.strictGrounding,
					top_k: trainerState.contextDepthTopK
				})
			});
			goto('/engineer/unsloth');
		} catch (e) {
			logger.error(e);
			isSubmitting = false;
		}
	}
</script>

<div class="p-8 h-full">
	<div class="w-full flex-1">
		<!-- Title Section -->
		<section class="flex justify-between items-end mb-10">
			<div>
				<p class="text-primary font-semibold text-sm tracking-wide mb-1 uppercase">Model Trainer</p>
				<h1 class="font-extrabold text-3xl tracking-tight text-on-surface">Fine-Tuning Engine</h1>
			</div>
			<div class="flex gap-3">
				<button
					onclick={exportTrainerConfig}
					class="px-5 py-2.5 rounded-xl border border-outline-variant/30 text-on-surface-variant font-bold text-xs hover:bg-surface-container-high transition-colors cursor-pointer active:scale-95"
				>
					Export Configuration
				</button>
				<button
					disabled={isSubmitting}
					onclick={runFineTuning}
					class="px-5 py-2.5 rounded-xl bg-gradient-to-br from-[#001360] to-[#002395] text-white font-bold text-xs shadow-md shadow-primary/20 active:scale-95 transition-transform flex items-center gap-2 cursor-pointer disabled:opacity-50"
				>
					<span class="material-symbols-outlined text-[18px]">play_arrow</span>
					{isSubmitting ? 'Iniciando...' : 'Start Fine-Tuning'}
				</button>
			</div>
		</section>

		<!-- Grid Layout -->
		<div class="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
			<!-- Section 1 & 2: Main Left Column -->
			<div class="xl:col-span-7 space-y-8">
				<!-- Deep Research Agent WAG Section -->
				<section
					class="bg-surface-container-lowest rounded-3xl p-8 relative overflow-hidden border border-outline-variant/10 shadow-sm"
				>
					<div class="flex justify-between items-start relative z-10 mb-10">
						<div class="flex gap-4">
							<div class="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center">
								<span class="material-symbols-outlined text-primary text-[24px]"
									>travel_explore</span
								>
							</div>
							<div>
								<h2 class="text-xl font-bold text-on-surface">Deep Research Agent</h2>
								<div class="flex items-center gap-2 mt-1">
									<span
										class="w-2 h-2 rounded-full bg-on-tertiary-container shadow-[0_0_8px_rgba(79,175,110,0.6)]"
									></span>
									<p class="text-xs text-on-surface-variant font-medium">
										Status: Web-Augmented Generation (WAG) Active
									</p>
								</div>
							</div>
						</div>
						<div class="flex items-center gap-3 px-4 py-2 bg-surface-container-low rounded-xl">
							<span class="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter"
								>Internet-to-RAG</span
							>
							<button
								onclick={() =>
									(trainerState.internetToRagActive = !trainerState.internetToRagActive)}
								class="w-10 h-5 {trainerState.internetToRagActive
									? 'bg-primary'
									: 'bg-surface-variant'} rounded-full relative transition-colors cursor-pointer"
							>
								<div
									class="absolute top-1 w-3 h-3 bg-white rounded-full transition-all {trainerState.internetToRagActive
										? 'right-1'
										: 'left-1'}"
								></div>
							</button>
						</div>
					</div>

					<div class="grid grid-cols-3 gap-4 mb-8">
						<div class="p-4 bg-surface-container-low rounded-xl">
							<p class="text-[10px] text-on-surface-variant font-bold uppercase mb-2">
								Knowledge Gap
							</p>
							<p class="text-lg font-bold text-on-surface">
								{trainerState.knowledgeGapPercentage.toFixed(1)}%
							</p>
							<div
								class="w-full h-1 bg-surface-container-highest mt-3 rounded-full overflow-hidden"
							>
								<div
									class="h-full bg-primary transition-all duration-500"
									style="width: {trainerState.knowledgeGapPercentage}%"
								></div>
							</div>
						</div>
						<div class="p-4 bg-surface-container-low rounded-xl">
							<p class="text-[10px] text-on-surface-variant font-bold uppercase mb-2">
								Sources Scanned
							</p>
							<p class="text-lg font-bold text-on-surface">
								{trainerState.sourcesScanned.toLocaleString()}
							</p>
							<p class="text-[10px] text-on-tertiary-container font-bold mt-1">
								+{trainerState.sourcesScannedDelta} in last hour
							</p>
						</div>
						<div class="p-4 bg-surface-container-low rounded-xl">
							<p class="text-[10px] text-on-surface-variant font-bold uppercase mb-2">Vault Sync</p>
							<p class="text-lg font-bold text-on-surface">Encrypted</p>
							<span
								class="text-[10px] {trainerState.sourcesScanned > 0
									? 'bg-tertiary-fixed text-on-tertiary-fixed'
									: 'bg-surface-variant text-on-surface-variant'} px-2 py-0.5 rounded-full mt-2 font-bold inline-block"
								>{trainerState.sourcesScanned > 0 ? 'Verified' : 'Idle'}</span
							>
						</div>
					</div>

					<div>
						<h3 class="text-sm font-bold text-on-surface mb-4">Recently Acquired Knowledge</h3>
						<div class="space-y-3">
							{#if trainerState.recentlyAcquiredKnowledge.length === 0}
								<div
									class="text-xs text-on-surface-variant font-medium text-center py-4 bg-surface-container-lowest rounded-lg border border-outline-variant/10"
								>
									No recent Vault injections documented in the system yet.
								</div>
							{/if}
							{#each trainerState.recentlyAcquiredKnowledge as item}
								<div
									class="flex items-center justify-between p-3 bg-surface hover:bg-surface-container-high rounded-lg transition-colors group cursor-pointer border border-transparent hover:border-outline-variant/20"
								>
									<div class="flex items-center gap-3">
										<span
											class="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-[20px]"
											>{item.type === 'description' ? 'description' : 'article'}</span
										>
										<span class="text-xs font-medium text-on-surface">{item.title}</span>
									</div>
									<span class="text-[10px] text-on-surface-variant font-medium">{item.timeAgo}</span
									>
								</div>
							{/each}
						</div>
					</div>
				</section>
			</div>

			<!-- Section 3: Right Sidebar Column -->
			<div class="xl:col-span-5 space-y-8">
				<!-- Alignment Metrics -->
				<!-- Unsloth Native Configuration (v1.3.0 MOCK HIDDEN) -->
				<section
					class="bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/10 shadow-sm"
				>
					<div class="flex items-center gap-3 mb-8">
						<span class="material-symbols-outlined text-secondary text-[24px]">memory</span>
						<h2 class="text-sm font-bold text-on-surface uppercase tracking-widest">
							Unsloth LoRA Engine
						</h2>
					</div>

					<div class="space-y-8">
						<div>
							<div class="flex justify-between items-center mb-3">
								<span class="text-xs font-bold text-on-surface-variant uppercase tracking-widest"
									>LoRA Rank (r)</span
								>
								<span class="px-2 py-1 bg-primary/10 text-primary font-extrabold text-xs rounded-lg"
									>{trainerState.loraRank}</span
								>
							</div>
							<input
								type="range"
								class="w-full accent-primary h-1.5 bg-surface-variant rounded-full appearance-none outline-none"
								min="8"
								max="128"
								step="8"
								bind:value={trainerState.loraRank}
							/>
							<div class="flex justify-between text-[10px] text-on-surface-variant mt-2 font-mono">
								<span>r=8 (Fast)</span>
								<span>r=128 (Detailed)</span>
							</div>
						</div>

						<div class="w-full h-[1px] bg-outline-variant/20"></div>

						<div>
							<div class="flex justify-between items-center mb-3">
								<span class="text-xs font-bold text-on-surface-variant uppercase tracking-widest"
									>Batch Size</span
								>
								<span
									class="px-2 py-1 bg-secondary/10 text-secondary font-extrabold text-xs rounded-lg"
									>{trainerState.batchSize}</span
								>
							</div>
							<input
								type="range"
								class="w-full accent-secondary h-1.5 bg-surface-variant rounded-full appearance-none outline-none"
								min="1"
								max="32"
								step="1"
								bind:value={trainerState.batchSize}
							/>
							<div class="flex justify-between text-[10px] text-on-surface-variant mt-2 font-mono">
								<span>1 (Slow / Precise)</span>
								<span>32 (High VRAM)</span>
							</div>
						</div>
					</div>
				</section>

				<!-- Perfection Controls & Reflection Lab -->
				<section
					class="bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/10 shadow-sm"
				>
					<h2 class="text-sm font-bold text-on-surface uppercase tracking-widest mb-6">
						Perfection Controls
					</h2>

					<div class="space-y-8">
						<!-- Hallucination Switch -->
						<div
							class="flex items-center justify-between p-4 bg-surface-container-low rounded-xl border border-outline-variant/10"
						>
							<div class="flex items-center gap-3">
								<div
									class="w-10 h-10 rounded-xl bg-error-container/40 flex items-center justify-center text-error"
								>
									<span class="material-symbols-outlined text-[20px]">security</span>
								</div>
								<div>
									<p class="text-xs font-bold text-on-surface">Strict Grounding AI</p>
									<p class="text-[10px] text-on-surface-variant mt-0.5">
										Force factual matching in RAG
									</p>
								</div>
							</div>
							<button
								onclick={() => (trainerState.strictGrounding = !trainerState.strictGrounding)}
								title="Toggle Strict Grounding AI"
								class="w-12 h-6 {trainerState.strictGrounding
									? 'bg-primary ring-4 ring-primary-fixed'
									: 'bg-surface-variant'} rounded-full relative cursor-pointer transition-colors"
							>
								<div
									class="absolute top-1.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all {trainerState.strictGrounding
										? 'right-1'
										: 'left-1'}"
								></div>
							</button>
						</div>

						<!-- Sliders -->
						<div class="space-y-6 px-1">
							<div class="space-y-3">
								<div class="flex justify-between text-[10px] font-bold uppercase tracking-widest">
									<span class="text-on-surface-variant">Embedding Alignment</span>
									<span
										class="text-primary font-mono bg-primary-fixed/50 px-2 py-0.5 rounded text-[10px]"
										>{trainerState.embeddingAlignmentAlpha / 100} Alpha</span
									>
								</div>
								<input
									class="w-full h-1.5 bg-surface-variant rounded-full appearance-none accent-primary cursor-pointer hover:accent-primary-container transition-colors"
									type="range"
									min="0"
									max="100"
									bind:value={trainerState.embeddingAlignmentAlpha}
								/>
							</div>

							<div class="space-y-3">
								<div class="flex justify-between text-[10px] font-bold uppercase tracking-widest">
									<span class="text-on-surface-variant">Context Depth (Top-K)</span>
									<span
										class="text-primary font-mono bg-primary-fixed/50 px-2 py-0.5 rounded text-[10px]"
										>k = {trainerState.contextDepthTopK}</span
									>
								</div>
								<input
									class="w-full h-1.5 bg-surface-variant rounded-full appearance-none accent-primary cursor-pointer hover:accent-primary-container transition-colors"
									type="range"
									min="1"
									max="128"
									bind:value={trainerState.contextDepthTopK}
								/>
							</div>
						</div>
					</div>
				</section>
			</div>
		</div>
	</div>

	<style>
		.material-symbols-outlined {
			font-variation-settings:
				'FILL' 0,
				'wght' 400,
				'GRAD' 0,
				'opsz' 24;
		}

		input[type='range'] {
			-webkit-appearance: none;
			appearance: none;
			width: 100%;
			background: transparent;
		}
		input[type='range']::-webkit-slider-thumb {
			-webkit-appearance: none;
			appearance: none;
			height: 18px;
			width: 18px;
			border-radius: 50%;
			background: var(--color-primary);
			cursor: pointer;
			margin-top: -6px;
			box-shadow: 0 0 10px rgba(0, 19, 96, 0.3);
		}
		input[type='range']::-moz-range-track {
			width: 100%;
			height: 6px;
			cursor: pointer;
			background: var(--color-surface-variant);
			border-radius: 3px;
		}
		input[type='range']::-webkit-slider-thumb:hover {
			background: var(--color-primary-container);
			transform: scale(1.1);
		}
		input[type='range']::-webkit-slider-runnable-track {
			width: 100%;
			height: 6px;
			cursor: pointer;
			background: var(--color-surface-variant);
			border-radius: 3px;
		}
	</style>
</div>
