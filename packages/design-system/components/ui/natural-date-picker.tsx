"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import * as chrono from "chrono-node"
import { motion, AnimatePresence } from "motion/react"

import { cn } from "@delulu/design-system/lib/utils"
import { Calendar } from "@delulu/design-system/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@delulu/design-system/components/ui/popover"
import {
  Command,
  CommandGroup,
  CommandItem,
} from "@delulu/design-system/components/ui/command"
import { DayPicker } from "react-day-picker"


type Suggestion = {
  label: string
  value: string
}


const suggestions: Suggestion[] = [
  { label: "Tomorrow", value: "tomorrow" },
  { label: "In 2 days", value: "in 2 days" },
  { label: "In 3 days", value: "in 3 days" },
  { label: "Next week", value: "in 1 week" },
  { label: "Next month", value: "in 1 month" },
]

const dropdownVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
}

interface NaturalDatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
}

export function NaturalDatePicker({
  value,
  onChange,
  placeholder = "Pick a date and time...",
  className,
}: NaturalDatePickerProps) {
  const [calendarOpen, setCalendarOpen] = React.useState(false)
  const [showSuggestions, setShowSuggestions] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(
    value ? format(value, "PPP p") : ""
  )
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value)
  const [selectedTime, setSelectedTime] = React.useState<string>(
    value ? format(value, "HH:mm") : "00:00"
  )
  const inputRef = React.useRef<HTMLInputElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (value) {
      setInputValue(format(value, "PPP p"))
      setSelectedDate(value)
      setSelectedTime(format(value, "HH:mm"))
    } else {
      setInputValue("")
      setSelectedDate(undefined)
      setSelectedTime("00:00")
    }
  }, [value])

  const handleDateChange = (date: Date | undefined) => {
    if (!date) return

    const [hours, minutes] = selectedTime.split(":").map(Number)
    const newDate = new Date(date)
    newDate.setHours(hours, minutes)

    setSelectedDate(newDate)
    setInputValue(format(newDate, "PPP p"))
    onChange?.(newDate)
    setCalendarOpen(false)
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value
    setSelectedTime(time)

    if (selectedDate) {
      const [hours, minutes] = time.split(":").map(Number)
      const newDate = new Date(selectedDate)
      newDate.setHours(hours, minutes)
      // Update selectedDate to reflect new time for consistency
      setSelectedDate(newDate)
      setInputValue(format(newDate, "PPP p"))
      onChange?.(newDate)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    if (e.target.value.trim() === "") {
        onChange?.(undefined)
        setSelectedDate(undefined)
    }
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault() // Prevent form submission if any
      const parsedDate = chrono.parseDate(inputValue)
      if (parsedDate) {
        setSelectedDate(parsedDate)
        setSelectedTime(format(parsedDate, "HH:mm"))
        setInputValue(format(parsedDate, "PPP p"))
        onChange?.(parsedDate)
        setShowSuggestions(false)
      } else {
        // Handle invalid date input, maybe show an error or clear
        onChange?.(undefined) // Clear date if input is invalid
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false)
    }
  }

  const handleSuggestionSelect = (suggestionValue: string) => {
    const parsedDate = chrono.parseDate(suggestionValue)
    if (parsedDate) {
      setSelectedDate(parsedDate)
      setSelectedTime(format(parsedDate, "HH:mm"))
      setInputValue(format(parsedDate, "PPP p"))
      onChange?.(parsedDate)
    }
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const handleClickOutside = (event: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
      setShowSuggestions(false)
    }
  }

  React.useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])


  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full px-3 py-2 text-sm border border-input rounded-md shadow-sm pr-10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
              onClick={() => {
                setShowSuggestions(false) 
                // setCalendarOpen(!calendarOpen) // PopoverTrigger handles this
              }}
              aria-label="Open calendar"
            >
              <CalendarIcon className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 mt-1" align="end">
            <div className="p-3">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateChange}
                initialFocus
              />
              <div className="mt-4 flex items-center justify-center">
                <input
                  type="time"
                  value={selectedTime}
                  onChange={handleTimeChange}
                  className="border rounded-md px-2 py-1 text-sm w-full"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="absolute w-full mt-1 bg-background rounded-md border shadow-lg z-50 overflow-hidden"
          >
            <Command>
              <CommandGroup>
                {suggestions.map((suggestion) => (
                  <CommandItem
                    key={suggestion.value}
                    onSelect={() => handleSuggestionSelect(suggestion.value)}
                    className="cursor-pointer"
                  >
                    {suggestion.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 