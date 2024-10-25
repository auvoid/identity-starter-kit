<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';

	import { Card } from 'flowbite-svelte';
	import { BarsOutline } from 'flowbite-svelte-icons';
</script>

<main class="w-full flex gap-5">
	<div class="w-full flex gap-5">
		<Card class="shadow-xl max-w-full h-[calc(100vh-130px)]">
			<h1 class="text-3xl font-bold text-gray-700 mb-10">Edit Document Field</h1>
			<div>
				<h1 class="text-2xl font-semibold text-gray-600 mb-10">Document Name</h1>
				Pdf to be displayed here
			</div>
		</Card>
	</div>
	<Card class="min-w-[450px] shadow-xl h-[calc(100vh-130px)]">
		<div class="flex flex-col h-full justify-between">
			<div class="flex flex-col gap-4">
				<div class="flex items-center justify-between">
					<h1 class="font-bold text-2xl dark:text-white">Document Name</h1>
				</div>
				<Card>
					<div class="flex flex-col gap-3">
						<div>
							<Input label="ananya@auvo.io (prefilled email of signing party)" value="Ananya Rana"
							></Input>
						</div>
						<div class="flex justify-between gap-3 items-center">
							<BarsOutline size="xl"></BarsOutline>
							<div class="w-full">
								<Button buttonClass="w-full" color="light-yellow"
									>Place the signature in document</Button
								>
							</div>
						</div>
					</div>
				</Card>
			</div>
			<div class="flex gap-4 w-full">
				<Button buttonClass="w-full" color="white">View Document</Button>
				<Button buttonClass="w-full" color="yellow">Send</Button>
			</div>
		</div>
	</Card>
</main>
