import * as React from "react"
import { Check, ChevronsUpDown, PenLine, ArrowLeft } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command"

interface ComboboxProps {
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  customPlaceholder?: string
  className?: string
  "data-testid"?: string
}

export function Combobox({
  value, onChange, options, placeholder = "Select...", searchPlaceholder = "Search...",
  emptyText = "No matches found.", customPlaceholder = "Type it in yourself", className, ...rest
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [isCustom, setIsCustom] = React.useState(() => !!value && !options.includes(value))

  React.useEffect(() => {
    if (value && !options.includes(value)) setIsCustom(true)
  }, [value, options])

  if (isCustom) {
    return (
      <div className={cn("flex gap-1.5", className)}>
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={customPlaceholder}
          className="h-8 text-sm"
          {...rest}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 px-2 shrink-0"
          onClick={() => { setIsCustom(false); onChange(""); }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </Button>
      </div>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal h-8 text-sm px-2", !value && "text-muted-foreground", className)}
          {...rest}
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>
              <div className="text-center text-sm text-muted-foreground px-2 py-1">{emptyText}</div>
            </CommandEmpty>
            <CommandGroup>
              {options.map(opt => (
                <CommandItem
                  key={opt}
                  value={opt}
                  onSelect={() => { onChange(opt); setOpen(false); }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === opt ? "opacity-100" : "opacity-0")} />
                  {opt}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          <CommandSeparator />
          <div className="p-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs text-muted-foreground"
              onClick={() => { setIsCustom(true); onChange(""); setOpen(false); }}
            >
              <PenLine className="mr-2 h-3.5 w-3.5" />
              Not listed? Enter manually
            </Button>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
