import { useState, useEffect } from "react";
import { format, addDays, subDays, isSameDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, formatShortPrice, type DatePrice } from "@/lib/api";
import { cn } from "@/lib/utils";

interface DatePriceBarProps {
  origin: string;
  destination: string;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function DatePriceBar({ origin, destination, selectedDate, onDateChange }: DatePriceBarProps) {
  const [prices, setPrices] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(false);

  const dates = Array.from({ length: 7 }, (_, i) => addDays(subDays(selectedDate, 3), i));

  useEffect(() => {
    async function fetchPrices() {
      if (!origin || !destination) return;
      
      try {
        setLoading(true);
        const startDate = format(dates[0], 'yyyy-MM-dd');
        const endDate = format(dates[dates.length - 1], 'yyyy-MM-dd');
        
        const pricesData = await api.getPricesByDateRange(origin, destination, startDate, endDate);
        const priceMap = new Map(pricesData.map(p => [p.date, p.lowestPrice]));
        setPrices(priceMap);
      } catch (err) {
        console.error("Error fetching prices:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchPrices();
  }, [origin, destination, selectedDate]);

  const getDayName = (date: Date) => {
    const dayName = format(date, 'EEE', { locale: es });
    return dayName.charAt(0).toUpperCase() + dayName.slice(1);
  };

  const handlePrevious = () => {
    onDateChange(subDays(selectedDate, 1));
  };

  const handleNext = () => {
    onDateChange(addDays(selectedDate, 1));
  };

  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between py-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevious}
            className="shrink-0"
            data-testid="date-prev-button"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <div className="flex-1 flex justify-center gap-1 md:gap-2 overflow-x-auto px-2">
            {dates.map((date) => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const price = prices.get(dateStr);
              const isSelected = isSameDay(date, selectedDate);
              const isToday = isSameDay(date, new Date());

              return (
                <button
                  key={dateStr}
                  onClick={() => onDateChange(date)}
                  className={cn(
                    "flex flex-col items-center py-2 px-3 md:px-4 rounded-lg transition-all min-w-[60px] md:min-w-[80px]",
                    isSelected 
                      ? "border-2 border-primary bg-primary/5" 
                      : "hover:bg-muted border-2 border-transparent"
                  )}
                  data-testid={`date-button-${dateStr}`}
                >
                  <span className={cn(
                    "text-xs font-medium",
                    isSelected ? "text-primary" : "text-muted-foreground"
                  )}>
                    {getDayName(date)}
                  </span>
                  <span className={cn(
                    "text-lg font-bold",
                    isSelected ? "text-primary" : "text-foreground"
                  )}>
                    {format(date, 'd')}
                  </span>
                  {price ? (
                    <span className="text-xs font-semibold text-primary">
                      {formatShortPrice(price)}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      —
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            className="shrink-0"
            data-testid="date-next-button"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
