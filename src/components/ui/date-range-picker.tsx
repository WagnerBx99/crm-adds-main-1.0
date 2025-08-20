import * as React from "react"
import { format, Locale, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isValid } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon, X, Loader2, ArrowRight, Check } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface DatePickerWithRangeProps {
  date: DateRange | undefined
  setDate: (date: DateRange) => void
  className?: string
  locale?: Locale
  disabled?: boolean
  isLoading?: boolean
  error?: string
  allowClear?: boolean
  showShortcuts?: boolean
  onApply?: (date: DateRange) => void
  label?: string
  placeholder?: string
}

type DatePreset = {
  id: string
  label: string
  getValue: () => DateRange
}

export function DatePickerWithRange({
  date,
  setDate,
  className,
  locale = ptBR,
  disabled = false,
  isLoading = false,
  error,
  allowClear = true,
  showShortcuts = true,
  onApply,
  label = "Selecionar período",
  placeholder = "Selecione um período"
}: DatePickerWithRangeProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [internalDate, setInternalDate] = React.useState<DateRange | undefined>(date)

  React.useEffect(() => {
    setInternalDate(date)
  }, [date])

  const datePresets: DatePreset[] = React.useMemo(() => [
    {
      id: "today",
      label: "Hoje",
      getValue: () => {
        const today = new Date()
        return { from: today, to: today }
      },
    },
    {
      id: "yesterday",
      label: "Ontem",
      getValue: () => {
        const yesterday = subDays(new Date(), 1)
        return { from: yesterday, to: yesterday }
      },
    },
    {
      id: "last7days",
      label: "Últimos 7 dias",
      getValue: () => ({
        from: subDays(new Date(), 6),
        to: new Date(),
      }),
    },
    {
      id: "last30days",
      label: "Últimos 30 dias",
      getValue: () => ({
        from: subDays(new Date(), 29),
        to: new Date(),
      }),
    },
    {
      id: "thisWeek",
      label: "Esta semana",
      getValue: () => ({
        from: startOfWeek(new Date(), { locale }),
        to: endOfWeek(new Date(), { locale }),
      }),
    },
    {
      id: "thisMonth",
      label: "Este mês",
      getValue: () => ({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
      }),
    },
    {
      id: "lastMonth",
      label: "Mês passado",
      getValue: () => {
        const date = new Date()
        date.setMonth(date.getMonth() - 1)
        return {
          from: startOfMonth(date),
          to: endOfMonth(date),
        }
      },
    },
    {
      id: "thisYear",
      label: "Este ano",
      getValue: () => ({
        from: startOfYear(new Date()),
        to: endOfYear(new Date()),
      }),
    },
  ], [locale])

  const handleSelectPreset = (preset: DatePreset) => {
    const range = preset.getValue()
    setInternalDate(range)
  }

  const handleClear = () => {
    setInternalDate(undefined)
  }

  const handleApply = () => {
    setDate(internalDate || { from: undefined, to: undefined })
    if (onApply && internalDate) {
      onApply(internalDate)
    }
    setIsOpen(false)
  }

  const handleCancel = () => {
    setInternalDate(date)
    setIsOpen(false)
  }

  const formatDate = (date: Date) => {
    return format(date, "dd/MM/yyyy", { locale })
  }

  const dateIsValid = internalDate?.from && isValid(internalDate.from) && 
    (!internalDate.to || (internalDate.to && isValid(internalDate.to)))

  return (
    <div className={cn("grid gap-2", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{label}</span>
          {date?.from && date?.to && (
            <Badge variant="outline" className="text-xs">
              {formatDate(date.from)}
              {date.to && date.from !== date.to && (
                <>
                  <ArrowRight className="mx-1 h-3 w-3" />
                  {formatDate(date.to)}
                </>
              )}
            </Badge>
          )}
        </div>
      )}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            size="sm"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground",
              disabled && "opacity-50 cursor-not-allowed",
              error && "border-destructive",
            )}
            disabled={disabled || isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CalendarIcon className="mr-2 h-4 w-4" />
            )}
            {date?.from ? (
              <>
                {formatDate(date.from)}
                {date.to && date.from !== date.to && (
                  <>
                    <span className="mx-1">até</span>
                    {formatDate(date.to)}
                  </>
                )}
              </>
            ) : (
              <span>{placeholder}</span>
            )}
            {date?.from && allowClear && !disabled && !isLoading && (
              <div 
                className="ml-auto flex h-4 w-4 items-center justify-center rounded-full hover:bg-muted"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClear()
                  setDate({ from: undefined, to: undefined })
                }}
              >
                <X className="h-3 w-3" />
              </div>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex flex-col sm:flex-row gap-0 sm:gap-4 p-3">
            {showShortcuts && (
              <div className="flex flex-col gap-1 mb-3 sm:mb-0 sm:border-r sm:pr-4">
                <p className="text-sm font-medium mb-1">Atalhos</p>
                <div className="flex flex-wrap sm:flex-col gap-1">
                  {datePresets.map((preset) => (
                    <Button
                      key={preset.id}
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs justify-start font-normal"
                      onClick={() => handleSelectPreset(preset)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={internalDate?.from}
                selected={internalDate}
                onSelect={setInternalDate}
                numberOfMonths={1}
                locale={locale}
                disabled={disabled}
                className={showShortcuts ? "sm:w-auto" : "w-auto"}
              />
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between p-3">
            {error ? (
              <p className="text-xs text-destructive">{error}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {internalDate?.from && internalDate?.to && internalDate.from !== internalDate.to
                  ? `${formatDate(internalDate.from)} até ${formatDate(internalDate.to)}`
                  : internalDate?.from
                  ? formatDate(internalDate.from)
                  : "Selecione as datas"}
              </p>
            )}
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCancel}
              >
                Cancelar
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      onClick={handleApply}
                      disabled={!dateIsValid || disabled}
                    >
                      <Check className="mr-1 h-4 w-4" />
                      Aplicar
                    </Button>
                  </TooltipTrigger>
                  {!dateIsValid && (
                    <TooltipContent>
                      <p>Selecione datas válidas</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {error && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}
    </div>
  )
} 