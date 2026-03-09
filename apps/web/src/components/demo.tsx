"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@repo/ui/components/alert-dialog";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { ButtonGroup } from "@repo/ui/components/button-group";
import { Card, CardContent } from "@repo/ui/components/card";
import { Checkbox } from "@repo/ui/components/checkbox";
import { Field, FieldGroup } from "@repo/ui/components/field";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	InputGroupText,
} from "@repo/ui/components/input-group";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemSeparator,
	ItemTitle,
} from "@repo/ui/components/item";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/popover";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import { Slider } from "@repo/ui/components/slider";
import { Switch } from "@repo/ui/components/switch";
import { Textarea } from "@repo/ui/components/textarea";
import {
	AlertCircle,
	ArrowDown,
	ArrowLeft,
	ArrowRight,
	ArrowUp,
	Check,
	ChevronRight,
	Copy,
	Loader2,
	Minus,
	MoreHorizontal,
	Plus,
	Search,
	Settings,
	Share2,
	ShoppingBag,
	Trash2,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

type ColorSwatchStyle = React.CSSProperties & Record<"--color", string>;

export function Demo() {
	const [sliderValue, setSliderValue] = React.useState<number[]>([500]);
	const [isActionMenuOpen, setIsActionMenuOpen] = React.useState(false);
	const handleSliderValueChange = React.useCallback((value: number | readonly number[]) => {
		if (typeof value === "number") {
			setSliderValue([value]);
		} else {
			setSliderValue([...value]);
		}
	}, []);
	const handleAction = React.useCallback((label: string) => {
		setIsActionMenuOpen(false);
		toast(label);
	}, []);

	return (
		<div className="flex min-h-screen w-full flex-col items-center justify-center p-4 sm:p-6 lg:p-12">
			<div className="grid max-w-3xl gap-4 sm:grid-cols-2">
				<div className="flex flex-col gap-4">
					<Card>
						<CardContent className="flex flex-col gap-6">
							<div className="flex flex-col gap-1">
								<div className="text-2xl font-medium">Style Overview</div>
								<div className="text-muted-foreground line-clamp-2 text-base">
									Designers love packing quirky glyphs into test phrases. This is a preview of the
									typography styles.
								</div>
							</div>
							<div className="grid grid-cols-6 gap-3">
								{[
									"--background",
									"--foreground",
									"--primary",
									"--secondary",
									"--muted",
									"--accent",
									"--destructive",
									"--chart-1",
									"--chart-2",
									"--chart-3",
									"--chart-4",
									"--chart-5",
								].map((variant) => {
									const colorStyle: ColorSwatchStyle = { "--color": `var(${variant})` };

									return (
										<div key={variant} className="flex flex-col flex-wrap items-center gap-2">
											<div
												className="after:border-border relative aspect-square w-full rounded-lg bg-(--color) after:absolute after:inset-0 after:rounded-lg after:border after:mix-blend-darken dark:after:mix-blend-lighten"
												style={colorStyle}
											/>
											<div className="hidden max-w-14 truncate font-mono text-[0.60rem] md:block">
												{variant}
											</div>
										</div>
									);
								})}
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent>
							<div className="grid grid-cols-8 place-items-center gap-4">
								<Card className="ring-border flex size-8 items-center justify-center rounded-md p-0 ring *:[svg]:size-4">
									<Copy />
								</Card>
								<Card className="ring-border flex size-8 items-center justify-center rounded-md p-0 ring *:[svg]:size-4">
									<AlertCircle />
								</Card>
								<Card className="ring-border flex size-8 items-center justify-center rounded-md p-0 ring *:[svg]:size-4">
									<Trash2 />
								</Card>
								<Card className="ring-border flex size-8 items-center justify-center rounded-md p-0 ring *:[svg]:size-4">
									<Share2 />
								</Card>
								<Card className="ring-border flex size-8 items-center justify-center rounded-md p-0 ring *:[svg]:size-4">
									<ShoppingBag />
								</Card>
								<Card className="ring-border flex size-8 items-center justify-center rounded-md p-0 ring *:[svg]:size-4">
									<MoreHorizontal />
								</Card>
								<Card className="ring-border flex size-8 items-center justify-center rounded-md p-0 ring *:[svg]:size-4">
									<Loader2 />
								</Card>
								<Card className="ring-border flex size-8 items-center justify-center rounded-md p-0 ring *:[svg]:size-4">
									<Plus />
								</Card>
								<Card className="ring-border flex size-8 items-center justify-center rounded-md p-0 ring *:[svg]:size-4">
									<Minus />
								</Card>
								<Card className="ring-border flex size-8 items-center justify-center rounded-md p-0 ring *:[svg]:size-4">
									<ArrowLeft />
								</Card>
								<Card className="ring-border flex size-8 items-center justify-center rounded-md p-0 ring *:[svg]:size-4">
									<ArrowRight />
								</Card>
								<Card className="ring-border flex size-8 items-center justify-center rounded-md p-0 ring *:[svg]:size-4">
									<Check />
								</Card>
								<Card className="ring-border flex size-8 items-center justify-center rounded-md p-0 ring *:[svg]:size-4">
									<ArrowDown />
								</Card>
								<Card className="ring-border flex size-8 items-center justify-center rounded-md p-0 ring *:[svg]:size-4">
									<ChevronRight />
								</Card>
								<Card className="ring-border flex size-8 items-center justify-center rounded-md p-0 ring *:[svg]:size-4">
									<Search />
								</Card>
								<Card className="ring-border flex size-8 items-center justify-center rounded-md p-0 ring *:[svg]:size-4">
									<Settings />
								</Card>
							</div>
						</CardContent>
					</Card>
				</div>
				<div className="flex flex-col gap-4">
					<Card className="w-full">
						<CardContent className="flex flex-col gap-6">
							<div className="flex flex-col gap-4">
								<div className="flex flex-wrap gap-2">
									<Button>Button</Button>
									<Button variant="secondary">Secondary</Button>
									<Button variant="outline">Outline</Button>
									<Button variant="destructive">Delete</Button>
								</div>
								<Item variant="outline">
									<ItemContent>
										<ItemTitle>Two-factor authentication</ItemTitle>
										<ItemDescription className="text-pretty xl:hidden 2xl:block">
											Verify via email or phone number.
										</ItemDescription>
									</ItemContent>
									<ItemActions className="hidden md:flex">
										<Button size="sm" variant="secondary">
											Enable
										</Button>
									</ItemActions>
								</Item>
							</div>
							<Slider
								value={sliderValue}
								onValueChange={handleSliderValueChange}
								max={1000}
								min={0}
								step={10}
								className="flex-1"
								aria-label="Slider"
							/>
							<FieldGroup>
								<Field>
									<InputGroup>
										<InputGroupInput placeholder="Name" />
										<InputGroupAddon align="inline-end">
											<InputGroupText>
												<Search />
											</InputGroupText>
										</InputGroupAddon>
									</InputGroup>
								</Field>
								<Field className="flex-1">
									<Textarea placeholder="Message" className="resize-none" />
								</Field>
							</FieldGroup>
							<div className="flex items-center gap-2">
								<div className="flex gap-2">
									<Badge>Badge</Badge>
									<Badge variant="secondary">Secondary</Badge>
									<Badge variant="outline">Outline</Badge>
								</div>
								<RadioGroup defaultValue="apple" className="ml-auto flex w-fit gap-3">
									<RadioGroupItem value="apple" />
									<RadioGroupItem value="banana" />
								</RadioGroup>
								<div className="flex gap-3">
									<Checkbox defaultChecked />
									<Checkbox />
								</div>
							</div>
							<div className="flex items-center gap-4">
								<AlertDialog>
									<AlertDialogTrigger render={<Button variant="outline" />}>
										<span className="hidden md:block">Alert Dialog</span>
										<span className="block md:hidden">Dialog</span>
									</AlertDialogTrigger>
									<AlertDialogContent size="sm">
										<AlertDialogHeader>
											<AlertDialogTitle>Allow accessory to connect?</AlertDialogTitle>
											<AlertDialogDescription>
												Do you want to allow the USB accessory to connect to this device and your
												data?
											</AlertDialogDescription>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel>Don&apos;t allow</AlertDialogCancel>
											<AlertDialogAction>Allow</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
								<ButtonGroup>
									<Button variant="outline">Button Group</Button>
									<Popover open={isActionMenuOpen} onOpenChange={setIsActionMenuOpen} modal={false}>
										<PopoverTrigger render={<Button variant="outline" size="icon" />}>
											<ArrowUp />
										</PopoverTrigger>
										<PopoverContent
											align="end"
											side="top"
											sideOffset={0}
											className="w-40 gap-0 p-1"
										>
											<div className="flex flex-col">
												<div className="text-muted-foreground px-2 py-2 text-xs">Quick Actions</div>
												<ItemGroup className="gap-0">
													<Button
														variant="ghost"
														size="sm"
														className="w-full justify-start border-transparent font-normal"
														onClick={() => handleAction("Muted conversation")}
													>
														Mute Conversation
													</Button>
													<Button
														variant="ghost"
														size="sm"
														className="w-full justify-start border-transparent font-normal"
														onClick={() => handleAction("Marked as read")}
													>
														Mark as Read
													</Button>
													<Button
														variant="ghost"
														size="sm"
														className="w-full justify-start border-transparent font-normal"
														onClick={() => handleAction("Blocked user")}
													>
														Block User
													</Button>
												</ItemGroup>
												<ItemSeparator className="my-1" />
												<div className="text-muted-foreground px-2 py-2 text-xs">Conversation</div>
												<ItemGroup className="gap-0">
													<Button
														variant="ghost"
														size="sm"
														className="w-full justify-start border-transparent font-normal"
														onClick={() => handleAction("Shared conversation")}
													>
														Share Conversation
													</Button>
													<Button
														variant="ghost"
														size="sm"
														className="w-full justify-start border-transparent font-normal"
														onClick={() => handleAction("Copied conversation")}
													>
														Copy Conversation
													</Button>
													<Button
														variant="ghost"
														size="sm"
														className="w-full justify-start border-transparent font-normal"
														onClick={() => handleAction("Reported conversation")}
													>
														Report Conversation
													</Button>
												</ItemGroup>
												<ItemSeparator className="my-1" />
												<ItemGroup className="gap-0">
													<Button
														variant="ghost"
														size="sm"
														className="text-destructive hover:text-destructive w-full justify-start border-transparent font-normal"
														onClick={() => handleAction("Deleted conversation")}
													>
														Delete Conversation
													</Button>
												</ItemGroup>
											</div>
										</PopoverContent>
									</Popover>
								</ButtonGroup>
								<Switch defaultChecked className="ml-auto" />
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
