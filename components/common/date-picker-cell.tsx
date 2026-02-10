'use client';

import React from 'react';
import { format, parse } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverTrigger,
  PopoverPortal,
  PopoverPositioner,
  PopoverPopup,
} from '@/components/ui/popover';

interface DatePickerCellProps {
  /** ISO date string (YYYY-MM-DD) */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function DatePickerCell({
  value,
  onChange,
  placeholder = '날짜 선택',
  className,
}: DatePickerCellProps) {
  const [open, setOpen] = React.useState(false);

  const selected = value
    ? parse(value, 'yyyy-MM-dd', new Date())
    : undefined;

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, 'yyyy-MM-dd'));
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={
          className ??
          'w-full h-8 px-2 rounded border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-ring inline-flex items-center justify-between gap-1'
        }
      >
        {value ? (
          <span>{format(selected!, 'yyyy-MM-dd', { locale: ko })}</span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <CalendarIcon size={12} className="text-muted-foreground shrink-0" />
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverPositioner sideOffset={4} align="start">
          <PopoverPopup>
            <Calendar
              mode="single"
              selected={selected}
              onSelect={handleSelect}
              defaultMonth={selected}
            />
          </PopoverPopup>
        </PopoverPositioner>
      </PopoverPortal>
    </Popover>
  );
}
