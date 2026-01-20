import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import * as React from "react";
import { cn } from "../../lib/cn";

const ScrollArea = React.forwardRef<
	React.ComponentRef<typeof ScrollAreaPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
	<ScrollAreaPrimitive.Root
		ref={ref}
		type="always"
		className={cn("overflow-hidden", className)}
		{...props}
	>
		{children}
		<ScrollAreaPrimitive.Corner />
		<ScrollBar orientation="vertical" />
	</ScrollAreaPrimitive.Root>
));

ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollViewport = React.forwardRef<
	React.ComponentRef<typeof ScrollAreaPrimitive.Viewport>,
	React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Viewport>
>(({ className, children, ...props }, ref) => (
	<ScrollAreaPrimitive.Viewport
		ref={ref}
		className={cn("size-full rounded-[inherit]", className)}
		{...props}
	>
		{children}
	</ScrollAreaPrimitive.Viewport>
));

ScrollViewport.displayName = ScrollAreaPrimitive.Viewport.displayName;

const ScrollBar = React.forwardRef<
	React.ComponentRef<typeof ScrollAreaPrimitive.Scrollbar>,
	React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Scrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
	<ScrollAreaPrimitive.Scrollbar
		ref={ref}
		orientation={orientation}
		className={cn(
			"flex select-none touch-none p-0.5 transition-colors",
			orientation === "vertical" &&
				"h-full w-2.5 border-l border-l-transparent",
			orientation === "horizontal" &&
				"h-2.5 flex-col border-t border-t-transparent",
			className,
		)}
		{...props}
	>
		<ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-fd-muted-foreground/40 hover:bg-fd-muted-foreground/60 transition-colors" />
	</ScrollAreaPrimitive.Scrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.Scrollbar.displayName;

export { ScrollArea, ScrollBar, ScrollViewport };
