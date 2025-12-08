import * as React from "react";
import type { Column } from "@tanstack/react-table";
import { Check, PlusCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverPopup, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DataTableFacetedFilterProps<TData, TValue> {
	column?: Column<TData, TValue>;
	title?: string;
	options: {
		label: string;
		value: string;
		icon?: React.ComponentType<{ className?: string }>;
	}[];
}

export function DataTableFacetedFilter<TData, TValue>({
	column,
	title,
	options,
}: DataTableFacetedFilterProps<TData, TValue>) {
	const facets = column?.getFacetedUniqueValues();
	const selectedValues = new Set(column?.getFilterValue() as string[]);

	return (
		<Popover>
			<PopoverTrigger
				render={
					<Button variant="outline" className="border-dashed">
						<PlusCircle />
						{title}
						{selectedValues?.size > 0 && (
							<>
								<Separator orientation="vertical" className="mx-2 h-4" />
								<Badge
									variant="secondary"
									className="rounded-sm px-1 font-normal lg:hidden"
								>
									{selectedValues.size}
								</Badge>
								<div className="hidden gap-1 lg:flex">
									{selectedValues.size > 2 ? (
										<Badge
											variant="secondary"
											className="rounded-sm px-1 font-normal"
										>
											{selectedValues.size} selected
										</Badge>
									) : (
										options
											.filter((option) => selectedValues.has(option.value))
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
							const isSelected = selectedValues.has(option.value);
							return (
								<button
									key={option.value}
									type="button"
									onClick={() => {
										if (isSelected) {
											selectedValues.delete(option.value);
										} else {
											selectedValues.add(option.value);
										}
										const filterValues = Array.from(selectedValues);
										column?.setFilterValue(
											filterValues.length ? filterValues : undefined,
										);
									}}
									className="relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
								>
									<div
										className={cn(
											"flex size-4 items-center justify-center rounded-[4px] border",
											isSelected
												? "bg-primary border-primary text-primary-foreground"
												: "border-input [&_svg]:invisible",
										)}
									>
										<Check className="text-primary-foreground size-3.5" />
									</div>
									{option.icon && (
										<option.icon className="text-muted-foreground size-4" />
									)}
									<span>{option.label}</span>
									{facets?.get(option.value) && (
										<span className="text-muted-foreground ml-auto flex size-4 items-center justify-center font-mono text-xs">
											{facets.get(option.value)}
										</span>
									)}
								</button>
							);
						})}
					</div>
				</ScrollArea>
				{selectedValues.size > 0 && (
					<>
						<Separator className="my-1" />
						<div className="px-1">
							<button
								type="button"
								onClick={() => column?.setFilterValue(undefined)}
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
