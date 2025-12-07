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
import { Info } from "lucide-react";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

export default function SepaSettingsPage() {
	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
	};

	return (
		<div className="flex flex-col gap-8">
			<Header>
				<HeaderContent>
					<HeaderTitle>SEPA Payment Settings</HeaderTitle>
					<HeaderDescription>
						Configure your SEPA direct debit payment information
					</HeaderDescription>
				</HeaderContent>
			</Header>

			<div className="space-y-6">
				<Frame>
					<FrameHeader className="flex-row items-start justify-between">
						<div>
							<FrameTitle>Bank Account Details</FrameTitle>
							<FrameDescription>
								Enter your bank account information for SEPA direct debit
							</FrameDescription>
						</div>
						<div className="flex gap-2">
							<Button type="reset" form="sepa-bank-form" variant="ghost">
								Reset
							</Button>
							<Button type="submit" form="sepa-bank-form">
								Save Changes
							</Button>
						</div>
					</FrameHeader>
					<FramePanel>
						<Form
							id="sepa-bank-form"
							onSubmit={handleSubmit}
							className="space-y-4"
						>
							<Field>
								<FieldLabel>IBAN</FieldLabel>
								<Input
									placeholder="DE89370400440532013000"
									type="text"
									maxLength={34}
								/>
							</Field>
							<Field>
								<FieldLabel>BIC</FieldLabel>
								<Input placeholder="COBADEFFXXX" type="text" maxLength={11} />
							</Field>
							<Field>
								<FieldLabel>Creditor ID</FieldLabel>
								<Input placeholder="DE98ZZZ09999999999" type="text" />
							</Field>
						</Form>
					</FramePanel>
				</Frame>

				<Frame>
					<FrameHeader className="flex-row items-start justify-between">
						<div>
							<FrameTitle>Transaction Details</FrameTitle>
							<FrameDescription>
								Customize how transactions appear on bank statements
							</FrameDescription>
						</div>
						<div className="flex gap-2">
							<Button type="reset" form="sepa-transaction-form" variant="ghost">
								Reset
							</Button>
							<Button type="submit" form="sepa-transaction-form">
								Save Changes
							</Button>
						</div>
					</FrameHeader>
					<FramePanel>
						<Form
							id="sepa-transaction-form"
							onSubmit={handleSubmit}
							className="space-y-6"
						>
							<Field>
								<FieldLabel>Monatsbeitrag</FieldLabel>
								<Input
									placeholder="Monthly membership fee for %MONTH% %YEAR%"
									type="text"
									maxLength={140}
								/>
								<p className="text-xs text-muted-foreground mt-1">
									Description for recurring monthly payments
								</p>
							</Field>

							<Field>
								<FieldLabel>Aufnahmegebühr</FieldLabel>
								<Input
									placeholder="One-time membership registration fee"
									type="text"
									maxLength={140}
								/>
								<p className="text-xs text-muted-foreground mt-1">
									Description for the initial joining fee charged when a member
									registers
								</p>
							</Field>

							<Field>
								<FieldLabel>Jahresbeitrag</FieldLabel>
								<Input
									placeholder="Annual membership fee %YEAR%"
									type="text"
									maxLength={140}
								/>
								<p className="text-xs text-muted-foreground mt-1">
									Description for annual fee (e.g., charged every January 1st)
								</p>
							</Field>
						</Form>
					</FramePanel>
					<FrameFooter>
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<div className="flex items-center gap-2 text-sm text-muted-foreground cursor-help w-fit">
										<Info className="size-4" />
										<span>Available variables</span>
									</div>
								</TooltipTrigger>
								<TooltipContent className="max-w-xs" side="top" align="start">
									<p className="text-sm">
										<strong>%MONTH%</strong> - Month name (e.g., January)
										<br />
										<strong>%YEAR%</strong> - Year (e.g., 2025)
										<br />
										<strong>%MEMBER_NAME%</strong> - Member's full name
										<br />
										<strong>%MEMBER_ID%</strong> - Member ID number
										<br />
										<strong>%JOIN_DATE%</strong> - Date of joining
									</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</FrameFooter>
				</Frame>
			</div>
		</div>
	);
}
