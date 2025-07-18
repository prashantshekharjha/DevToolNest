import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      // Flat, no background, no rounded corners, border bottom for underline
      "flex border-b border-gray-200 bg-transparent p-0",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      // Curvy arc underline for active, smooth transition
      "relative -mb-px inline-flex items-center justify-center whitespace-nowrap px-6 py-2 text-base font-semibold border-b-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      // Active: white bg, black text, arc underline, lifted
      "data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:border-b-black data-[state=active]:z-10",
      // Less bold curvy arc underline for active
      "after:absolute after:left-1/2 after:-translate-x-1/2 after:bottom-[-6px] after:h-2 after:w-3/4 after:rounded-b-full after:bg-black after:transition-all after:duration-200 after:opacity-0 data-[state=active]:after:opacity-100",
      // Inactive: muted text
      "data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-black",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
