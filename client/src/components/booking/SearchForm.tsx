import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, MapPin, Bus, Ship, Search, Users, Minus, Plus, RefreshCw, X, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { mockLocations } from "@/lib/constants";
import { ScrollArea } from "@/components/ui/scroll-area";

// Custom hook to handle clicking outside
function useOnClickOutside(ref: React.RefObject<HTMLElement | null>, handler: (event: MouseEvent | TouchEvent) => void) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

interface LocationInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  hasBorder?: boolean;
}

function LocationInput({ label, placeholder, value, onChange, hasBorder = true }: LocationInputProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 300),
      });
    }
  };

  // Handle window resize to update coords if open
  useEffect(() => {
    if (!open) return;
    window.addEventListener('resize', updateCoords);
    window.addEventListener('scroll', updateCoords, true);
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [open]);

  // Close when clicking outside - we need a separate ref for the portal content
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current && 
        !containerRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const filteredLocations = value 
    ? mockLocations.filter(loc => loc.city.toLowerCase().includes(value.toLowerCase()))
    : mockLocations;

  const handleOpen = () => {
    updateCoords();
    setOpen(true);
  };

  return (
    <>
      <div 
        ref={containerRef}
        className={cn("relative group w-full h-full flex flex-col justify-center px-4 py-2", hasBorder && "border-r border-border")}
      >
        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5 block">{label}</label>
        
        <div className="relative w-full">
          <Input 
            ref={inputRef}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              handleOpen();
            }}
            onFocus={handleOpen}
            onClick={handleOpen}
            placeholder={placeholder} 
            className="h-8 p-0 text-base font-semibold border-none shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/50 w-full bg-transparent truncate pr-6" 
          />
          {value && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
                inputRef.current?.focus();
              }}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 z-10"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Portal Dropdown */}
      {open && createPortal(
        <div 
          ref={dropdownRef}
          style={{ 
            top: coords.top, 
            left: coords.left,
            width: coords.width
          }}
          className="absolute bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden z-[9999] animate-in fade-in zoom-in-95 duration-100"
        >
           {!value && (
            <div className="px-4 py-3 text-sm font-semibold text-foreground border-b border-black/5">
              Búsquedas recientes
            </div>
           )}
           {value && (
             <div className="px-4 py-3 text-sm font-semibold text-foreground border-b border-black/5">
              Sugerencias de búsqueda
            </div>
           )}
           <ScrollArea className="h-[240px]">
             <div className="py-2">
               {filteredLocations.length > 0 ? (
                 filteredLocations.map((loc, i) => (
                   <div 
                      key={i} 
                      className="px-4 py-3 hover:bg-black/5 cursor-pointer flex items-start gap-3 transition-colors"
                      onClick={() => {
                        onChange(loc.city);
                        setOpen(false);
                      }}
                    >
                     <div className="mt-0.5 bg-muted rounded-full p-1.5 shrink-0">
                       <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                     </div>
                     <div>
                       <div className="font-semibold text-foreground">{loc.city}</div>
                       <div className="text-xs text-muted-foreground">{loc.region}</div>
                     </div>
                   </div>
                 ))
               ) : (
                 <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                   No se encontraron resultados
                 </div>
               )}
             </div>
           </ScrollArea>
        </div>,
        document.body
      )}
    </>
  );
}

interface SearchFormProps {
  initialOrigin?: string;
  initialDestination?: string;
  initialDate?: Date;
  initialReturnDate?: Date | null;
  initialPassengers?: number;
  initialTypes?: string[];
  showUpdateButton?: boolean;
  hideTypeToggles?: boolean;
  onSearch?: (params: {
    origin: string;
    destination: string;
    date: Date;
    returnDate: Date | null;
    passengers: number;
    types: string[];
  }) => void;
}

export function SearchForm({
  initialOrigin = "",
  initialDestination = "",
  initialDate,
  initialReturnDate = null,
  initialPassengers = 1,
  initialTypes = ["ferry", "bus"],
  showUpdateButton = false,
  hideTypeToggles = false,
  onSearch,
}: SearchFormProps = {}) {
  const [date, setDate] = useState<Date | undefined>(initialDate || new Date());
  const [isDateOpen, setIsDateOpen] = useState(false);
  
  const [returnDate, setReturnDate] = useState<Date | undefined>(initialReturnDate || undefined);
  const [isReturnDateOpen, setIsReturnDateOpen] = useState(false);

  const [passengers, setPassengers] = useState(initialPassengers);
  const [includeFerry, setIncludeFerry] = useState(initialTypes.includes("ferry"));
  const [includeBus, setIncludeBus] = useState(initialTypes.includes("bus"));
  
  const [origin, setOrigin] = useState(initialOrigin);
  const [destination, setDestination] = useState(initialDestination);
  
  const [_, setLocation] = useLocation();

  const handleSearch = () => {
    const types: string[] = [];
    if (includeFerry) types.push("ferry");
    if (includeBus) types.push("bus");
    
    if (onSearch) {
      onSearch({
        origin,
        destination,
        date: date || new Date(),
        returnDate: returnDate || null,
        passengers,
        types,
      });
    } else {
      const searchParams = new URLSearchParams();
      if (origin) searchParams.set("origin", origin);
      if (destination) searchParams.set("destination", destination);
      if (date) searchParams.set("date", date.toISOString().split('T')[0]);
      if (returnDate) searchParams.set("returnDate", returnDate.toISOString().split('T')[0]);
      searchParams.set("passengers", passengers.toString());
      searchParams.set("types", types.join(","));
      setLocation(`/results?${searchParams}`);
    }
  };

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto space-y-4">
      
      {/* Type Toggles - Clean */}
      {!hideTypeToggles && (
        <div className="flex justify-start px-2">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIncludeFerry(!includeFerry)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border shadow-sm",
                includeFerry 
                  ? "bg-white border-white text-blue-600 shadow-md scale-105" 
                  : "bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
              )}
            >
              <Ship className="w-4 h-4" /> Ferry
            </button>
            
            <button 
              onClick={() => setIncludeBus(!includeBus)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border shadow-sm",
                includeBus 
                  ? "bg-white border-white text-orange-600 shadow-md scale-105" 
                  : "bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
              )}
            >
              <Bus className="w-4 h-4" /> Bus
            </button>
          </div>
        </div>
      )}

      <div className="glass p-2 rounded-[1.5rem] animate-in fade-in zoom-in duration-500 shadow-2xl shadow-black/5">
        <div className="bg-white rounded-[1.2rem] shadow-sm flex flex-col lg:flex-row h-auto lg:h-[88px] relative divide-y lg:divide-y-0 lg:divide-x divide-border">
          
          {/* Origin */}
          <div className="flex-1 min-w-[200px] relative">
            <LocationInput 
              label="Origen" 
              placeholder="Origen..." 
              value={origin}
              onChange={setOrigin}
              hasBorder={false} 
            />
            {/* Swap Button Positioned on border between Origin and Destination */}
            <div className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20">
              <button 
                onClick={handleSwap}
                className="h-8 w-8 bg-white border border-border shadow-sm rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors cursor-pointer"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Destination */}
          <div className="flex-1 min-w-[200px]">
             <LocationInput 
               label="Destino" 
               placeholder="Destino..." 
               value={destination}
               onChange={setDestination}
               hasBorder={false} 
             />
          </div>

          {/* Departure Date */}
          <div className="w-[180px] px-4 py-2 flex flex-col justify-center cursor-pointer hover:bg-muted/30 transition-colors">
            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5 block">Fecha</label>
            <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
              <PopoverTrigger asChild>
                <div className="font-semibold text-base truncate">
                   {date ? format(date, "EEE, d MMM", { locale: es }) : "Elegir fecha"}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl border-none shadow-2xl bg-white/70 backdrop-blur-xl" align="center">
                <div className="p-4">
                   <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(newDate) => {
                        setDate(newDate);
                        setIsDateOpen(false);
                      }}
                      locale={es}
                      initialFocus
                      className="rounded-xl border-none"
                      classNames={{
                        day_selected: "bg-primary text-white hover:bg-primary hover:text-white focus:bg-primary focus:text-white rounded-full",
                        day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 rounded-full hover:bg-muted transition-colors",
                      }}
                    />
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Return Date */}
          <div className="w-[180px] px-4 py-2 flex flex-col justify-center cursor-pointer hover:bg-muted/30 transition-colors">
            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5 block">Fecha de regreso</label>
            <Popover open={isReturnDateOpen} onOpenChange={setIsReturnDateOpen}>
              <PopoverTrigger asChild>
                <div className={cn("font-semibold text-base truncate", !returnDate && "text-muted-foreground font-normal")}>
                   {returnDate ? format(returnDate, "EEE, d MMM", { locale: es }) : "Opcional"}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl border-none shadow-2xl bg-white/70 backdrop-blur-xl" align="center">
                <div className="p-4">
                   <Calendar
                      mode="single"
                      selected={returnDate}
                      onSelect={(newDate) => {
                        setReturnDate(newDate);
                        setIsReturnDateOpen(false);
                      }}
                      locale={es}
                      initialFocus
                      disabled={(day) => date ? day <= date : false}
                      className="rounded-xl border-none"
                      classNames={{
                        day_selected: "bg-primary text-white hover:bg-primary hover:text-white focus:bg-primary focus:text-white rounded-full",
                        day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 rounded-full hover:bg-muted transition-colors",
                      }}
                    />
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Passengers */}
          <div className="w-[160px] px-4 py-2 flex flex-col justify-center cursor-pointer hover:bg-muted/30 transition-colors">
            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5 block">Pasajeros</label>
            <Popover>
              <PopoverTrigger asChild>
                 <div className="font-semibold text-base truncate">
                   {passengers} {passengers === 1 ? 'Pasajero' : 'Pasajeros'}
                 </div>
              </PopoverTrigger>
              <PopoverContent className="w-60 p-4 rounded-xl shadow-xl bg-white/70 backdrop-blur-xl" align="center">
                 <div className="flex items-center justify-between">
                   <span className="font-medium">Pasajeros</span>
                   <div className="flex items-center gap-3">
                     <button 
                        onClick={() => setPassengers(Math.max(1, passengers - 1))}
                        className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                        disabled={passengers <= 1}
                     >
                       <Minus className="w-3 h-3" />
                     </button>
                     <span className="w-4 text-center font-bold">{passengers}</span>
                     <button 
                        onClick={() => setPassengers(Math.min(10, passengers + 1))}
                        className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                     >
                       <Plus className="w-3 h-3" />
                     </button>
                   </div>
                 </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Search Button (Square/Full Height) */}
          <div className="w-full lg:w-auto p-2 lg:p-0 flex">
             <Button 
                onClick={handleSearch}
                className={cn(
                  "h-12 lg:h-auto rounded-xl lg:rounded-none lg:rounded-r-[1.2rem] font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-all shadow-none",
                  showUpdateButton ? "w-full lg:w-[140px] text-base gap-2" : "w-full lg:w-[100px] text-lg"
                )}
              >
                {showUpdateButton ? (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    Actualizar
                  </>
                ) : (
                  <Search className="w-6 h-6" />
                )}
              </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
