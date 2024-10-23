<script lang="ts">
	import { Search } from 'flowbite-svelte';
	import Button from './Button.svelte';
	import Logo from './Logo.svelte';
</script>

<header
	class="fixed z-[10] flex h-16 w-screen justify-between items-center border-b-[1px] gap-3 border-gray-200 bg-white p-2 pl-3 shadow-lg border"
>
	<Logo></Logo>
	<div class="w-2/5">
		<Search
			class="w-full text-ellipsis rounded-lg py-[12px] focus:border-brand-green focus:ring-brand-green"
			size="md"
		></Search>
	</div>
	<div>
		<Button>Create New Document</Button>
	</div>
</header>
