'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';

export interface SearchSelectOption {
  value: string;
  label: string;
  searchText?: string;
}

interface SearchSelectProps {
  options: SearchSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  compact?: boolean;
  className?: string;
  disabled?: boolean;
}

export function SearchSelect({
  options,
  value,
  onChange,
  placeholder = '검색...',
  compact = false,
  className,
  disabled = false,
}: SearchSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  const listboxId = React.useId();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const justSelectedRef = React.useRef(false);

  const selectedLabel = React.useMemo(
    () => options.find((opt) => opt.value === value)?.label ?? '',
    [options, value],
  );

  const filtered = React.useMemo(() => {
    if (!search) return options;
    const lower = search.toLowerCase();
    return options.filter((opt) => (opt.searchText || opt.label).toLowerCase().includes(lower));
  }, [options, search]);

  // Reset highlight when filtered list changes
  React.useEffect(() => {
    setHighlightedIndex(-1);
  }, [filtered]);

  // Scroll highlighted item into view
  React.useEffect(() => {
    if (highlightedIndex < 0 || !listRef.current) return;
    const items = listRef.current.querySelectorAll('[data-item]');
    items[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex]);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleSelect = (optValue: string) => {
    justSelectedRef.current = true;
    onChange(optValue);
    setOpen(false);
    setSearch('');
    setTimeout(() => { justSelectedRef.current = false; }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
      setSearch('');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) { setOpen(true); return; }
      setHighlightedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) { setOpen(true); return; }
      setHighlightedIndex((prev) => (prev <= 0 ? filtered.length - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
        handleSelect(filtered[highlightedIndex].value);
      }
    }
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={open ? search : selectedLabel}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            if (justSelectedRef.current) return;
            setOpen(true);
            setSearch('');
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-haspopup="listbox"
          className={cn(
            'w-full border border-input bg-background pr-7 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed',
            compact ? 'h-8 px-2 text-xs rounded' : 'h-9 px-3 text-sm rounded-md',
          )}
        />
        <ChevronDown
          size={compact ? 14 : 16}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
      </div>
      {open && (
        <div
          ref={listRef}
          id={listboxId}
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md max-h-60 overflow-y-auto"
        >
          {filtered.length > 0 ? (
            filtered.map((opt, index) => (
              <div
                key={opt.value}
                data-item
                role="option"
                aria-selected={opt.value === value}
                className={cn(
                  'flex items-center gap-2 px-2 py-1.5 cursor-pointer transition-colors',
                  compact ? 'text-xs' : 'text-sm',
                  index === highlightedIndex && 'bg-accent text-accent-foreground',
                  index !== highlightedIndex && 'hover:bg-accent/50',
                )}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(opt.value);
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <span className={cn('w-4 shrink-0', opt.value !== value && 'invisible')}>
                  <Check size={12} />
                </span>
                <span className="truncate">{opt.label}</span>
              </div>
            ))
          ) : (
            <div className={cn(
              'px-3 py-2 text-muted-foreground text-center',
              compact ? 'text-xs' : 'text-sm',
            )}>
              검색 결과 없음
            </div>
          )}
        </div>
      )}
    </div>
  );
}
