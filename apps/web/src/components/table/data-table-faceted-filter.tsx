import { Check, PlusCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverPopup, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface DataTableFacetedFilterProps {
	title?: string;
	options: {
		label: string;
		value: string;
	}[];
	selectedValues: string[];
	onValueChange: (values: string[]) => void;
}

export function DataTableFacetedFilter({
	title,
	options,
	selectedValues,
	onValueChange,
}: DataTableFacetedFilterProps) {
	const selectedSet = new Set(selectedValues);
	const [open, setOpen] = useState(false);

	const toggleValue = (value: string) => {
		const newSet = new Set(selectedSet);
		if (newSet.has(value)) {
			newSet.delete(value);
		} else {
			newSet.add(value);
		}
		onValueChange(Array.from(newSet));
	};

	const onReset = (event?: React.MouseEvent) => {
		event?.stopPropagation();
		onValueChange([]);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger
				render={
					<Button
						variant="outline"
						size="sm"
						className="border-dashed font-normal"
					>
						{selectedSet.size > 0 ? (
							<div
								role="button"
								aria-label={`Clear ${title} filter`}
								tabIndex={0}
								className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
								onClick={onReset}
							>
								<XCircle />
							</div>
						) : (
							<PlusCircle />
						)}
						{title}
						{selectedSet.size > 0 && (
							<>
								<Separator
									orientation="vertical"
									className="mx-0.5 data-[orientation=vertical]:h-4"
								/>
								<Badge
									variant="secondary"
									className="rounded-sm px-1 font-normal lg:hidden"
								>
									{selectedSet.size}
								</Badge>
								<div className="hidden items-center gap-1 lg:flex">
									{selectedSet.size > 2 ? (
										<Badge
											variant="secondary"
											className="rounded-sm px-1 font-normal"
										>
											{selectedSet.size} selected
										</Badge>
									) : (
										options
											.filter((option) => selectedSet.has(option.value))
											.map((option) => (
												<Badge
													variant="secondary"
													key={option.value}
													className="rounded-sm px-1 font-normal"
												>
													{option.label}
												</Badge>
											))
									)}
								</div>
							</>
						)}
					</Button>
				}
			/>
			<PopoverPopup className="w-[200px]" align="start" tooltipStyle>
				<ScrollArea className="max-h-[300px]">
					<div className="space-y-1">
						{options.map((option) => {
							const isSelected = selectedSet.has(option.value);
							return (
								<button
									key={option.value}
									type="button"
									onClick={() => toggleValue(option.value)}
									className="relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
								>
									<div
										className={cn(
											"flex size-4 items-center justify-center rounded-[4px] border",
											isSelected
												? "border-primary bg-primary text-primary-foreground"
												: "border-input [&_svg]:invisible",
										)}
									>
										<Check className="size-3.5 text-primary-foreground" />
									</div>
									<span>{option.label}</span>
								</button>
							);
						})}
					</div>
				</ScrollArea>
				{selectedSet.size > 0 && (
					<>
						<Separator className="my-1" />
						<div className="px-1">
							<button
								type="button"
								onClick={() => onValueChange([])}
								className="relative flex w-full cursor-pointer select-none items-center justify-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
							>
								Clear filters
							</button>
						</div>
					</>
				)}
			</PopoverPopup>
		</Popover>
	);
}
