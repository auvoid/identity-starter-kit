<script lang="ts">
	import '../app.pcss';
	import { Toast } from 'flowbite-svelte';
	import { CheckCircleSolid, ExclamationCircleSolid } from 'flowbite-svelte-icons';
	import { toasts } from './store';
	import Header from '$lib/components/fragments/Header.svelte';
	import Sidebar from '$lib/components/ui/Sidebar.svelte';
	import DocPreviewBar from '$lib/components/fragments/DocPreviewBar.svelte';
	import DocSignForm from '$lib/components/fragments/DocSignForm.svelte';

	let toastDivClass = 'w-full max-w-xs p-4 text-gray-500 bg-white shadow-2xl ring-gray-800 ring-1';
</script>

{#if $toasts.length > 0}
	<div class="fixed right-0 top-0 z-[1000] flex flex-col gap-2 px-5 py-[80px]">
		{#each $toasts as toast (toast.id)}
			<Toast divClass={toastDivClass}>
				<svelte:fragment slot="icon">
					{#if toast.type === 'error'}
						<ExclamationCircleSolid color="#ff6161" class="h-8 w-8" />
					{:else if toast.type === 'info'}
						<CheckCircleSolid color="#F7D57E" class="h-8 w-8" />
					{/if}
				</svelte:fragment>
				<div>{toast.message}</div>
			</Toast>
		{/each}
	</div>
{/if}

<Header></Header>
<Sidebar></Sidebar>
<div class="fixed flex h-screen w-full items-center justify-center overflow-y-auto">
	<slot />
</div>
