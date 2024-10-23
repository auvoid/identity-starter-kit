<script lang="ts">
	import { page } from '$app/stores';
	import { Avatar, Sidebar, SidebarGroup, SidebarItem, SidebarWrapper } from 'flowbite-svelte';
	import {
		ChartPieSolid,
		InboxFullOutline,
		BookSolid,
		UserSettingsSolid,
		LifeSaverSolid
	} from 'flowbite-svelte-icons';

	$: activeUrl = $page.url.pathname;
</script>

<!-- <Sidebar
	class="fixed bottom-6 top-[88px] z-[10] flex w-64 flex-col justify-between gap-6 overflow-x-hidden overflow-y-scroll bg-white px-3 py-6 text-base font-medium"
>
	<SidebarWrapper>
		<div class="flex flex-col gap-6">
			<div class="flex items-center gap-3">
				<Avatar rounded class="object-cover" src="" />
				<h2 class="text-2xl font-semibold">User name</h2>
			</div>
		</div>
	</SidebarWrapper>
</Sidebar> -->

<Sidebar {activeUrl}>
	<SidebarWrapper
		class="shadow-xl h-[calc(100vh-130px)] fixed top-[88px] w-64 bg-white border flex flex-col justify-between"
	>
		<div>
			<SidebarGroup>
				<div class="flex flex-col gap-6 mb-3">
					<div class="flex items-center gap-3">
						<Avatar rounded class="object-cover" src="" />
						<h2 class="text-lg font-semibold">User name</h2>
					</div>
				</div>
				<SidebarItem label="Documents">
					<svelte:fragment slot="icon">
						<ChartPieSolid
							class="w-6 h-6 text-gray-500 transition duration-75  group-hover:text-gray-900"
						/>
					</svelte:fragment>
				</SidebarItem>
				<SidebarItem label="Notification">
					<svelte:fragment slot="icon">
						<InboxFullOutline
							class="w-6 h-6 text-gray-500 transition duration-75 group-hover:text-gray-900"
						/>
					</svelte:fragment>
					<svelte:fragment slot="subtext">
						<span
							class=" text-red-700 ms-3 inline-flex h-3 w-3 items-center justify-center rounded-full bg-red-200 p-3 text-sm font-medium"
						>
							1
						</span>
					</svelte:fragment>
				</SidebarItem>
			</SidebarGroup>
		</div>
		<div>
			<SidebarGroup border>
				<SidebarItem label="Docs">
					<svelte:fragment slot="icon">
						<BookSolid
							class="h-6 w-6 text-gray-500 transition duration-75 group-hover:text-gray-900"
						/>
					</svelte:fragment>
				</SidebarItem>
				<SidebarItem label="Settings">
					<svelte:fragment slot="icon">
						<UserSettingsSolid
							class="h-6 w-6 text-gray-500 transition duration-75 group-hover:text-gray-900"
						/>
					</svelte:fragment>
				</SidebarItem>
				<SidebarItem label="Logout">
					<svelte:fragment slot="icon">
						<LifeSaverSolid
							class="h-6 w-6 text-gray-500 transition duration-75 group-hover:text-gray-900"
						/>
					</svelte:fragment>
				</SidebarItem>
			</SidebarGroup>
		</div>
	</SidebarWrapper>
</Sidebar>
