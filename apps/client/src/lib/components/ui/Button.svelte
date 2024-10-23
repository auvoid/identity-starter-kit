<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import { Button } from 'flowbite-svelte';
	import { twMerge } from 'tailwind-merge';

	interface $$Props extends Omit<ComponentProps<Button>, 'color'> {
		color?: 'primary' | 'alternative' | 'none';
		buttonClass?: string;
	}

	export let color: $$Props['color'] = 'primary';
	export let buttonClass = '';
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
	{...$$restProps}
	on:click
	on:change
	on:keydown
	on:keyup
	on:touchend
	on:touchcancel
	on:mouseenter
	on:mouseleave
>
	<slot />
</Button>
