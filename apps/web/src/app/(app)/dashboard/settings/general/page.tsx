"use client";

import {
	Header,
	HeaderContent,
	HeaderTitle,
	HeaderDescription,
	HeaderActions,
} from "../../_components/page-header";
import {
	Frame,
	FramePanel,
	FrameHeader,
	FrameTitle,
	FrameDescription,
	FrameFooter,
} from "@/components/ui/frame";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { CircleUser, Plus } from "lucide-react";
// import { useClerk } from "@clerk/nextjs";

export default function GeneralSettingsPage() {
	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
	};

	// const {openUserProfile} = useClerk()

	return (
		<div className="flex flex-col gap-8">
			<Header>
				<HeaderContent>
					<HeaderTitle>General Settings</HeaderTitle>
					<HeaderDescription>
						Manage your general Organization settings
					</HeaderDescription>
				</HeaderContent>
				<HeaderActions>
					<Button
						variant={"outline"}
						onClick={() => {
							// Navigate to account settings page instead
							window.location.href = "/account";
						}}
					>
						<span className="flex items-center gap-2">
							<CircleUser className="size-4" />
							View Account Settings
						</span>
					</Button>
				</HeaderActions>
			</Header>

			<div className="space-y-6">
				<Frame className="after:-inset-[5px] after:-z-1 relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
					<FramePanel>
						<h2 className="font-heading text-xl mb-2 text-foreground">
							Organization Information
						</h2>
						<p className="text-sm text-muted-foreground mb-6">
							Update your organization details and public information
						</p>
						<Form
							id="org-info-form"
							onSubmit={handleSubmit}
							className="space-y-4"
						>
							<Field>
								<FieldLabel>Organization Name</FieldLabel>
								<Input placeholder="Acme Inc." />
							</Field>
							<Field>
								<FieldLabel>Description</FieldLabel>
								<Textarea
									placeholder="Tell us about your organization"
									rows={3}
								/>
							</Field>
						</Form>
					</FramePanel>
					<FrameFooter className="flex-row justify-end gap-2">
						<Button type="reset" form="org-info-form" variant="ghost">
							Reset
						</Button>
						<Button type="submit" form="org-info-form">
							Save Changes
						</Button>
					</FrameFooter>
				</Frame>

				<Frame className="after:-inset-[5px] after:-z-1 relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
					<FramePanel>
						<h2 className="font-heading text-xl mb-2 text-foreground">
							Contact Information
						</h2>
						<p className="text-sm text-muted-foreground mb-6">
							Manage your primary contact details
						</p>
						<Form
							id="contact-info-form"
							onSubmit={handleSubmit}
							className="space-y-4"
						>
							<Field>
								<FieldLabel>Email Address</FieldLabel>
								<Input type="email" placeholder="contact@example.com" />
							</Field>
							<Field>
								<FieldLabel>Phone Number</FieldLabel>
								<Input type="tel" placeholder="+1 (555) 000-0000" />
							</Field>
							<Field>
								<FieldLabel>Address</FieldLabel>
								<Textarea placeholder="Street address" rows={2} />
							</Field>
						</Form>
					</FramePanel>
					<FrameFooter className="flex-row justify-end gap-2">
						<Button type="reset" form="contact-info-form" variant="ghost">
							Reset
						</Button>
						<Button type="submit" form="contact-info-form">
							Save Changes
						</Button>
					</FrameFooter>
				</Frame>

				<Frame className="after:-inset-[5px] after:-z-1 relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
					<FramePanel>
						<h2 className="font-heading text-xl mb-2 text-foreground">
							Regional Settings
						</h2>
						<p className="text-sm text-muted-foreground mb-6">
							Configure timezone and language preferences
						</p>
						<Form
							id="regional-settings-form"
							onSubmit={handleSubmit}
							className="space-y-4"
						>
							<Field>
								<FieldLabel>Timezone</FieldLabel>
								<Input placeholder="UTC" />
							</Field>
							<Field>
								<FieldLabel>Language</FieldLabel>
								<Input placeholder="English" />
							</Field>
						</Form>
					</FramePanel>
					<FrameFooter className="flex-row justify-end gap-2">
						<Button type="reset" form="regional-settings-form" variant="ghost">
							Reset
						</Button>
						<Button type="submit" form="regional-settings-form">
							Save Changes
						</Button>
					</FrameFooter>
				</Frame>
			</div>
		</div>
	);
}
