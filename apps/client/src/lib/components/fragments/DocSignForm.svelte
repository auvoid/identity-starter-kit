<script lang="ts">
	import { Card } from 'flowbite-svelte';
	import Button from '../ui/Button.svelte';
	import Input from '../ui/Input.svelte';
	import { CheckCircleSolid, ExclamationCircleSolid } from 'flowbite-svelte-icons';

	let isSigned: boolean = true;
</script>

<Card class="min-w-[450px] shadow-xl h-[calc(100vh-130px)] fixed top-[88px] right-5">
	<div class="flex flex-col h-full justify-between max-w-full">
		<div class="flex flex-col gap-4">
			<h1 class="font-bold text-md dark:text-white">
				{#if isSigned}
					Document Signed!
				{:else}
					Document is waiting for you to complete the Signature field.
				{/if}
			</h1>
			<Card padding="sm">
				<div class="flex flex-col gap-3">
					<div>
						<Input label="" variant="text" disabled={true} value="Ananya Rana"></Input>
						<!-- disabled not working here -->
					</div>
					<div class="flex gap-3 items-center justify-between">
						{#if isSigned}
							<div class="flex gap-1">
								<CheckCircleSolid class="text-brand-green_dark"></CheckCircleSolid>
								<h2 class="text-sm font-medium">Signature is complete</h2>
							</div>
							<Button color="light-blue">View in Document</Button>
						{:else}
							<div class="flex gap-1">
								<ExclamationCircleSolid class="text-brand-yellow"></ExclamationCircleSolid>
								<h2 class="text-sm font-medium">Sign this Document</h2>
							</div>
							<Button color="light-yellow">Sign</Button>
						{/if}
					</div>
				</div>
			</Card>
		</div>
		<div class="flex flex-col gap-4">
			<div class="text-sm text-gray-500">
				Once you have input all the information required, press the “Sign & Send” button to sign and
				send the document.
			</div>
			<div class="flex gap-4 w-full">
				<Button buttonClass="w-full" color="white">Cancel</Button>
				<Button buttonClass="w-full" color="yellow">Sign & Send</Button>
			</div>
		</div>
	</div>
</Card>
