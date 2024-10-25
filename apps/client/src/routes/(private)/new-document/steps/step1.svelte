<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import {
		Card,
		Dropzone,
		Textarea,
		Label,
		Toolbar,
		ToolbarGroup,
		ToolbarButton,
		Helper,
		Li
	} from 'flowbite-svelte';
	import {
		CalendarMonthSolid,
		CodeOutline,
		CogSolid,
		DownloadSolid,
		FaceGrinOutline,
		ImageOutline,
		ListOutline,
		MapPinAltSolid,
		PaperClipOutline,
		UploadOutline
	} from 'flowbite-svelte-icons';

	let docName: string;
	let signingParties: string[];
	let emailContent: string;
</script>

<main class="w-full flex gap-5">
	<div class="w-full flex gap-5">
		<Card class="shadow-xl max-w-full h-[calc(100vh-130px)]">
			<h1 class="text-3xl font-bold text-gray-700 mb-10">New Document</h1>
			<div class="flex flex-col gap-5 mb-10">
				<div class="flex gap-5 w-full">
					<div class="w-full">
						<Input
							variant="text"
							label="Document Name"
							helperText="Name your Document"
							placeholder="My New Document"
							bind:value={docName}
						></Input>
					</div>
					<div class="w-full">
						<Input
							variant="email"
							label="Add Signing Parties"
							helperText="Enter the emails of all the signing parties"
							placeholder="name@example.com"
							bind:value={signingParties}
						></Input>
					</div>
				</div>
				<div class="flex gap-5 w-full">
					<div class="w-full">
						<Dropzone class="bg-gray-200" accept={'.pdf'}>
							<UploadOutline size="xl"></UploadOutline>
							<p class="mb-2 text-sm text-gray-500 dark:text-gray-400">
								<span class="font-semibold">Click to upload</span> or drag and drop
							</p>
							<p class="text-xs text-gray-500 dark:text-gray-400">
								PDF Format Only (File Size: 30MB)
							</p>
						</Dropzone>
					</div>
					<div class="w-full">
						<div>
							<Label for="input" class="text-font-bold text-md mb-1">Your Message</Label>
							<Textarea
								class="bg-gray-200"
								placeholder="Write text here..."
								rows={6}
								bind:value={emailContent}
							>
								<Toolbar slot="header" embedded>
									<ToolbarGroup>
										<ToolbarButton name="Attach file"
											><PaperClipOutline class="w-6 h-6 text-gray-500" /></ToolbarButton
										>
										<ToolbarButton name="Embed map"
											><MapPinAltSolid class="w-6 h-6 text-gray-500" /></ToolbarButton
										>
										<ToolbarButton name="Upload image"
											><ImageOutline class="w-6 h-6 text-gray-500" /></ToolbarButton
										>
										<ToolbarButton name="Format code"
											><CodeOutline class="w-6 h-6 text-gray-500" /></ToolbarButton
										>
										<ToolbarButton name="Add emoji"
											><FaceGrinOutline class="w-6 h-6 text-gray-500" /></ToolbarButton
										>
									</ToolbarGroup>
									<ToolbarGroup>
										<ToolbarButton name="Add List">
											<ListOutline class="w-6 h-6 text-gray-500"></ListOutline>
										</ToolbarButton>
										<ToolbarButton name="Settings">
											<CogSolid class="w-6 h-6 text-gray-500"></CogSolid>
										</ToolbarButton>
										<ToolbarButton name="Calender">
											<CalendarMonthSolid class="w-6 h-6 text-gray-500"></CalendarMonthSolid>
										</ToolbarButton>
										<ToolbarButton name="Download">
											<DownloadSolid class="w-6 h-6 text-gray-500"></DownloadSolid>
										</ToolbarButton>
									</ToolbarGroup>
								</Toolbar>
							</Textarea>
							<Helper class="ms-1 mt-1 text-gray-500">
								Write the message to be sent along with the document in email
							</Helper>
						</div>
					</div>
				</div>
			</div>
		</Card>
		<Card class="min-w-[450px] shadow-xl h-[calc(100vh-130px)]">
			<div class="flex flex-col h-full justify-between">
				<div class="flex flex-col gap-5">
					<div class="flex flex-col">
						<h3 class="font-sm font-semibold text-gray-700 dark:text-gray-400">Document Name</h3>
						<p>{docName ?? 'My New Document'}</p>
					</div>
					<div class="flex flex-col">
						<h3 class="font-sm font-semibold text-gray-700 dark:text-gray-400">Signing Parties</h3>
						{#each signingParties as party}
							<div>
								<Li>{party}</Li>
							</div>
						{/each}
					</div>
					<div>
						<h3 class="font-sm font-semibold text-gray-700 dark:text-gray-400">PDF File</h3>
						<div>MyPdfFile.pdf (file displayed and on click opens on screen)</div>
					</div>
					<div>
						<h3 class="font-sm font-semibold text-gray-700 dark:text-gray-400">Your Message</h3>
						<p>
							{emailContent}
						</p>
					</div>
				</div>
				<div class="flex gap-4 w-full">
					<Button buttonClass="w-full" color="white">Save as Draft</Button>
					<Button buttonClass="w-full" color="yellow">Continue to Edit Document</Button>
				</div>
			</div>
		</Card>
	</div>
</main>
