<script lang="ts">
	import { Card, CloseButton } from 'flowbite-svelte';
	import Button from '../ui/Button.svelte';

	// export let selectedDoc: string;
</script>

<Card class="min-w-[450px] shadow-xl h-[calc(100vh-130px)]">
	<!-- {#if selectedDoc} -->
	<div class="flex flex-col h-full justify-between">
		<div class="flex flex-col gap-4">
			<div class="flex items-center justify-between">
				<h1 class="font-bold text-2xl dark:text-white">Document Name</h1>
				<div class="cursor-pointer">
					<!-- <CloseButton on:click={() => selectedDoc === ''} class=" dark:text-white" /> -->
					<CloseButton class=" dark:text-white" />
				</div>
			</div>
			<div>Some details about document</div>
		</div>
		<div class="flex gap-4 w-full">
			<Button buttonClass="w-full" color="white">Delete Document</Button>
			<Button buttonClass="w-full" color="yellow">View Document</Button>
		</div>
	</div>
	<!-- {:else}
		<p class="w-full py-8 text-center">Please Select a Document to view</p>
	{/if} -->
</Card>
