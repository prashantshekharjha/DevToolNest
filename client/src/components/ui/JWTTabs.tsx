import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

const JWTTabs = TabsPrimitive.Root

const JWTTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      // Centered, no background, no border, spacing between tabs
      "flex justify-center gap-8 mb-4 border-b border-gray-200 bg-transparent p-0",
      className
    )}
    {...props}
  />
))
JWTTabsList.displayName = "JWTTabsList"

const JWTTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      // JWT style: centered, bold, curvy arc underline for active, smooth transition
      "relative px-6 py-2 text-lg font-semibold bg-transparent border-none outline-none transition-colors duration-200",
      // Active: white bg, black text, arc underline, lifted
      "data-[state=active]:text-black data-[state=active]:font-bold data-[state=active]:bg-white data-[state=active]:z-10",
      // Less bold curvy arc underline for active
      "after:absolute after:left-1/2 after:-translate-x-1/2 after:bottom-[-6px] after:h-2 after:w-3/4 after:rounded-b-full after:bg-black after:transition-all after:duration-200 after:opacity-0 data-[state=active]:after:opacity-100",
      // Inactive: muted text
      "text-gray-500 hover:text-black",
      className
    )}
    {...props}
  />
))
JWTTabsTrigger.displayName = "JWTTabsTrigger"

const JWTTabsContent = React.forwardRef<
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
JWTTabsContent.displayName = "JWTTabsContent"

export { JWTTabs, JWTTabsList, JWTTabsTrigger, JWTTabsContent } 