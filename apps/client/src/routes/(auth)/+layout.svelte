<script lang="ts">
	import { Card } from 'flowbite-svelte';
</script>

<div class="flex h-full w-full items-center justify-center bg-gray-900">
	<Card>
		<div class="max-w-[500px]">
			<slot />
		</div>
	</Card>
</div>
