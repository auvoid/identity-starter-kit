<script lang="ts">
	import { Button, Spinner } from 'flowbite-svelte';
	import { type ComponentProps, createEventDispatcher } from 'svelte';
	import { twMerge } from 'tailwind-merge';

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface $$Props extends ComponentProps<Button> {
		color?: 'primary' | 'alternative';
	}

	export let color: $$Props['color'] = 'primary';
	export let buttonClass = '';

	export let blockingClick: null | (() => Promise<void>) = null;

	const dispatch = createEventDispatcher();

	let isSubmitting = false;
	async function handleClick() {
		if (!blockingClick) {
			dispatch('click');
			return;
		}
		isSubmitting = true;
		await blockingClick().catch(() => (isSubmitting = false));
		isSubmitting = false;
	}

	switch (color) {
		case 'primary':
			buttonClass += ' bg-brand-yellow text-gray-800 hover:bg-brand-yellow_hover focus:ring-0';
			break;
		case 'alternative':
			buttonClass +=
				' dark:bg-gray-800 bg-gray-50 text-gray-800 dark:text-gray-400 border-[1px] dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-0 border-gray-300';
			break;
		default:
			buttonClass += '';
			break;
	}
</script>

<Button
	class={twMerge(buttonClass, $$restProps.class)}
	disabled={isSubmitting}
	{...$$restProps}
	on:click={handleClick}
	on:change
	on:keydown
	on:keyup
	on:touchend
	on:touchcancel
	on:mouseenter
	on:mouseleave
>
	{#if isSubmitting}
		<Spinner class="me-3" size="4" color="white" />
	{/if}
	<slot />
</Button>
