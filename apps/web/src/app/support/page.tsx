"use client";

import { Button } from "@/components/ui/button";
import { Frame, FramePanel, FrameFooter } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectPopup,
	SelectItem,
} from "@/components/ui/select";
import {
	useOrganizationList,
	useUser,
	SignInButton,
	useClerk,
} from "@clerk/nextjs";
import { useState, useEffect, useRef } from "react";
import type { Route } from "next";
import Link from "next/link";
import {
	ChevronsUpDown,
	Check,
	ArrowLeft,
	Home,
	Settings,
	User,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SupportPage() {
	const { isSignedIn, isLoaded: userLoaded, user } = useUser();
	const { openUserProfile, openOrganizationProfile } = useClerk();
	const [selectedOrg, setSelectedOrg] = useState<string>("");
	const [open, setOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const { userMemberships, isLoaded } = useOrganizationList({
		userMemberships: {
			infinite: true,
		},
	});

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const getSelectedOrgData = () => {
		if (selectedOrg === "my-account") return null;
		return userMemberships.data?.find(
			(mem) => mem.organization.id === selectedOrg,
		)?.organization;
	};

	const selectedOrgData = getSelectedOrgData();

	if (!userLoaded) {
		return null;
	}

	if (!isSignedIn) {
		return (
			<div className="flex min-h-screen items-center justify-center p-4 bg-sidebar">
				<div className="w-full max-w-2xl">
					<div className="mb-4">
						<Link
							href={"/" as Route}
							className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
						>
							<ArrowLeft className="h-4 w-4" />
							Back to Home
						</Link>
					</div>
					<Frame className="after:-inset-[5px] after:-z-1 relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
						<FramePanel className="text-center py-12">
							<h1 className="font-heading text-2xl mb-4">Priority Support</h1>
							<p className="text-muted-foreground mb-6">
								Sign in to access priority support for your organizations
							</p>
							<SignInButton mode="modal">
								<Button size="lg">Sign In</Button>
							</SignInButton>
						</FramePanel>
						<FrameFooter className="flex-row items-center justify-center">
							<p className="text-sm text-muted-foreground">
								Not a customer?{" "}
								<Link
									href={"/contact" as Route}
									className="text-foreground hover:underline"
								>
									Use contact form
								</Link>
							</p>
						</FrameFooter>
					</Frame>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-start md:items-center justify-center p-4 bg-sidebar">
			<div className="w-full max-w-2xl my-4 md:my-0">
				<div className="mb-4 flex items-center justify-between">
					<Link
						href={"/dashboard" as Route}
						className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
					>
						<ArrowLeft className="h-4 w-4" />
						Back to Dashboard
					</Link>
					<div className="flex items-center gap-2">
						{selectedOrg === "my-account" && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => openUserProfile()}
								className="text-muted-foreground hover:text-foreground"
							>
								<User className="h-4 w-4" />
								Manage Account
							</Button>
						)}
						{selectedOrg && selectedOrg !== "my-account" && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => openOrganizationProfile()}
								className="text-muted-foreground hover:text-foreground"
							>
								<Settings className="h-4 w-4" />
								Manage Organization
							</Button>
						)}
					</div>
				</div>
				<Frame className="after:-inset-[5px] after:-z-1 relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
					<FramePanel>
						<h1 className="font-heading text-2xl mb-6">Contact Support</h1>

						<form className="space-y-4">
							<div className="space-y-2">
								<Label>Select Organization</Label>
								<div className="relative">
									<button
										type="button"
										onClick={() => setOpen(!open)}
										className="flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
									>
										<span className="flex items-center gap-2">
											{selectedOrg === "my-account" ? (
												<>
													<div className="flex size-5 items-center justify-center rounded-full border overflow-hidden">
														{user?.imageUrl ? (
															<img
																src={user.imageUrl}
																alt={user.fullName || "User"}
																className="size-5 rounded-full"
															/>
														) : (
															<span className="text-xs font-semibold">
																{user?.firstName?.charAt(0).toUpperCase() ||
																	"U"}
															</span>
														)}
													</div>
													My Account
												</>
											) : selectedOrgData ? (
												<>
													<div className="flex size-5 items-center justify-center rounded border">
														{selectedOrgData.imageUrl ? (
															<img
																src={selectedOrgData.imageUrl}
																alt={selectedOrgData.name}
																className="size-5 rounded"
															/>
														) : (
															<span className="text-xs font-semibold">
																{selectedOrgData.name.charAt(0).toUpperCase()}
															</span>
														)}
													</div>
													{selectedOrgData.name}
												</>
											) : (
												"Select an organization"
											)}
										</span>
										<ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
									</button>
									{open && (
										<div
											ref={dropdownRef}
											className="absolute z-50 mt-1 w-full rounded-lg border bg-popover p-1 shadow-lg"
										>
											<div className="max-h-[300px] overflow-y-auto">
												<button
													type="button"
													onClick={() => {
														setSelectedOrg("my-account");
														setOpen(false);
													}}
													className={cn(
														"relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
														selectedOrg === "my-account" && "bg-accent",
													)}
												>
													<div className="flex size-5 shrink-0 items-center justify-center rounded-full border overflow-hidden">
														{user?.imageUrl ? (
															<img
																src={user.imageUrl}
																alt={user.fullName || "User"}
																className="size-5 rounded-full"
															/>
														) : (
															<span className="text-xs font-semibold">
																{user?.firstName?.charAt(0).toUpperCase() ||
																	"U"}
															</span>
														)}
													</div>
													My Account
												</button>
												{isLoaded &&
													userMemberships.data?.map((mem) => (
														<button
															key={mem.organization.id}
															type="button"
															onClick={() => {
																setSelectedOrg(mem.organization.id);
																setOpen(false);
															}}
															className={cn(
																"relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
																selectedOrg === mem.organization.id &&
																	"bg-accent",
															)}
														>
															<div className="flex size-5 shrink-0 items-center justify-center rounded border">
																{mem.organization.imageUrl ? (
																	<img
																		src={mem.organization.imageUrl}
																		alt={mem.organization.name}
																		className="size-5 rounded"
																	/>
																) : (
																	<span className="text-xs font-semibold">
																		{mem.organization.name
																			.charAt(0)
																			.toUpperCase()}
																	</span>
																)}
															</div>
															{mem.organization.name}
														</button>
													))}
											</div>
										</div>
									)}
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="firstName">First name</Label>
									<Input
										id="firstName"
										value={user?.firstName || ""}
										disabled
										className="bg-muted"
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="lastName">Last name</Label>
									<Input
										id="lastName"
										value={user?.lastName || ""}
										disabled
										className="bg-muted"
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="email">Email</Label>
									<Input
										id="email"
										type="email"
										placeholder="john.doe@example.com"
										required
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="phone">Phone (optional)</Label>
									<Input
										id="phone"
										type="tel"
										placeholder="+1 (555) 000-0000"
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label>Category</Label>
								<Select required>
									<SelectTrigger>
										<SelectValue placeholder="Select a category" />
									</SelectTrigger>
									<SelectPopup>
										<SelectItem value="billing">Billing</SelectItem>
										<SelectItem value="technical">Technical Support</SelectItem>
										<SelectItem value="account">Account Issues</SelectItem>
										<SelectItem value="feature">Feature Request</SelectItem>
										<SelectItem value="bug">Bug Report</SelectItem>
										<SelectItem value="other">Other</SelectItem>
									</SelectPopup>
								</Select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="message">Message</Label>
								<Textarea
									id="message"
									placeholder="Describe your issue or question..."
									rows={20}
									required
									className="min-h-[300px]"
								/>
							</div>
						</form>
					</FramePanel>

					<FrameFooter className="flex-row items-center justify-between">
						<p className="text-sm text-muted-foreground">
							Not a customer?{" "}
							<Link
								href={"/contact" as Route}
								className="text-foreground hover:underline"
							>
								Contact us
							</Link>
						</p>
						<Button type="submit">Submit</Button>
					</FrameFooter>
				</Frame>
			</div>
		</div>
	);
}
