"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { ko } from "date-fns/locale"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      locale={ko}
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4",
        month_caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-medium",
        nav: "flex items-center gap-1 absolute inset-x-0 justify-between",
        button_previous: cn(
          buttonVariants({ variant: "outline", size: "icon-sm" }),
          "z-10"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline", size: "icon-sm" }),
          "z-10"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "text-muted-foreground w-8 font-normal text-[0.65rem]",
        week: "flex w-full mt-1",
        day: cn(
          "relative p-0 text-center text-xs focus-within:relative focus-within:z-20 [&:has(button)]:hover:bg-accent [&:has(button)]:rounded-md",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has(button)]:rounded-md"
        ),
        day_button: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "size-8 font-normal"
        ),
        range_end: "day-range-end aria-selected:rounded-r-md",
        range_start: "day-range-start aria-selected:rounded-l-md",
        selected:
          "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground [&>button]:focus:bg-primary [&>button]:focus:text-primary-foreground",
        today: "[&>button]:bg-accent [&>button]:text-accent-foreground",
        outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        disabled: "text-muted-foreground opacity-50",
        range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          const Icon = orientation === "left" ? ChevronLeftIcon : ChevronRightIcon
          return <Icon className="size-4" />
        },
      }}
      {...props}
    />
  )
}

export { Calendar }
