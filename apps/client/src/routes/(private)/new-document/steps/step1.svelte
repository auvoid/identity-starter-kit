<script lang="ts">
	import Input from '$lib/components/ui/Input.svelte';
	import {
		Card,
		Dropzone,
		Textarea,
		Label,
		Toolbar,
		ToolbarGroup,
		ToolbarButton,
		Helper
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
		PaperPlaneOutline,
		UploadOutline
	} from 'flowbite-svelte-icons';
</script>

<main class="w-full flex gap-5">
	<div class="w-full">
		<Card class="shadow-xl max-w-full h-[calc(100vh-130px)]">
			<h1 class="text-3xl font-bold text-gray-700 mb-10">New Document</h1>
			<div class="flex flex-col gap-5">
				<div class="flex gap-5 w-full">
					<div class="w-full">
						<Input
							label="Document Name"
							helperText="Name your Document"
							placeholder="My New Document"
						></Input>
					</div>
					<div class="w-full">
						<Input
							label="Add Signing Parties"
							helperText="Enter the emails of all the signing parties"
							placeholder="name@example.com"
						></Input>
					</div>
				</div>
				<div class="flex gap-5 w-full">
					<div class="w-full">
						<Dropzone accept={'.pdf'}>
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
								unWrappedClass="focus:border-brand-green focus:ring-brand-green bg-gray-200 "
								placeholder="Write text here..."
								rows={6}
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
	</div>
</main>
