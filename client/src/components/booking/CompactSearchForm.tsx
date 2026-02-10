import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, MapPin, Search, Users, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { mockLocations } from "@/lib/constants";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CompactSearchFormProps {
  initialOrigin?: string;
  initialDestination?: string;
  initialDate?: Date;
  initialReturnDate?: Date | null;
  initialPassengers?: number;
  onSearch: (params: {
    origin: string;
    destination: string;
    date: Date;
    returnDate: Date | null;
    passengers: number;
  }) => void;
}

function LocationDropdown({ 
  value, 
  onChange, 
  placeholder,
  inputRef,
  dropdownRef,
  open,
  setOpen,
  coords,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  inputRef: React.RefObject<HTMLInputElement>;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  open: boolean;
  setOpen: (open: boolean) => void;
  coords: { top: number; left: number; width: number };
}) {
  const filteredLocations = value 
    ? mockLocations.filter(loc => loc.city.toLowerCase().includes(value.toLowerCase()))
    : mockLocations;

  return (
    <>
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="h-10 bg-transparent border-0 focus-visible:ring-0 px-0"
      />
      {open && createPortal(
        <div
          ref={dropdownRef}
          style={{ position: 'absolute', top: coords.top, left: coords.left, width: coords.width, zIndex: 9999 }}
          className="bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-100 overflow-hidden"
        >
          <ScrollArea className="max-h-[200px]">
            {filteredLocations.map((location, index) => (
              <button
                key={`${location.city}-${index}`}
                className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-3 transition-colors"
                onClick={() => {
                  onChange(location.city);
                  setOpen(false);
                }}
              >
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <div className="font-medium text-sm">{location.city}</div>
                  <div className="text-xs text-muted-foreground">{location.region}</div>
                </div>
              </button>
            ))}
          </ScrollArea>
        </div>,
        document.body
      )}
    </>
  );
}

export function CompactSearchForm({
  initialOrigin = "",
  initialDestination = "",
  initialDate = new Date(),
  initialReturnDate = null,
  initialPassengers = 1,
  onSearch,
}: CompactSearchFormProps) {
  const [origin, setOrigin] = useState(initialOrigin);
  const [destination, setDestination] = useState(initialDestination);
  const [date, setDate] = useState<Date>(initialDate);
  const [returnDate, setReturnDate] = useState<Date | null>(initialReturnDate);
  const [passengers, setPassengers] = useState(initialPassengers);
  
  const [originOpen, setOriginOpen] = useState(false);
  const [destOpen, setDestOpen] = useState(false);
  
  const originInputRef = useRef<HTMLInputElement>(null);
  const destInputRef = useRef<HTMLInputElement>(null);
  const originContainerRef = useRef<HTMLDivElement>(null);
  const destContainerRef = useRef<HTMLDivElement>(null);
  const originDropdownRef = useRef<HTMLDivElement | null>(null);
  const destDropdownRef = useRef<HTMLDivElement | null>(null);
  
  const [originCoords, setOriginCoords] = useState({ top: 0, left: 0, width: 0 });
  const [destCoords, setDestCoords] = useState({ top: 0, left: 0, width: 0 });

  const updateCoords = () => {
    if (originContainerRef.current) {
      const rect = originContainerRef.current.getBoundingClientRect();
      setOriginCoords({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX, width: Math.max(rect.width, 250) });
    }
    if (destContainerRef.current) {
      const rect = destContainerRef.current.getBoundingClientRect();
      setDestCoords({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX, width: Math.max(rect.width, 250) });
    }
  };

  useEffect(() => {
    updateCoords();
    window.addEventListener('resize', updateCoords);
    window.addEventListener('scroll', updateCoords, true);
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (originContainerRef.current && !originContainerRef.current.contains(event.target as Node) &&
          originDropdownRef.current && !originDropdownRef.current.contains(event.target as Node)) {
        setOriginOpen(false);
      }
      if (destContainerRef.current && !destContainerRef.current.contains(event.target as Node) &&
          destDropdownRef.current && !destDropdownRef.current.contains(event.target as Node)) {
        setDestOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const swapLocations = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleSearch = () => {
    onSearch({ origin, destination, date, returnDate, passengers });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-2">
      <div className="flex flex-col md:flex-row items-stretch gap-2">
        <div className="flex-1 flex items-center gap-2 bg-muted/30 rounded-xl px-3 py-2" ref={originContainerRef}>
          <MapPin className="w-4 h-4 text-primary shrink-0" />
          <div className="flex-1">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Origen</div>
            <LocationDropdown
              value={origin}
              onChange={setOrigin}
              placeholder="¿Desde dónde?"
              inputRef={originInputRef as any}
              dropdownRef={originDropdownRef}
              open={originOpen}
              setOpen={setOriginOpen}
              coords={originCoords}
            />
          </div>
        </div>

        <button 
          onClick={swapLocations}
          className="hidden md:flex w-8 h-8 rounded-full bg-muted items-center justify-center hover:bg-muted/80 transition-colors self-center shrink-0"
        >
          <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="flex-1 flex items-center gap-2 bg-muted/30 rounded-xl px-3 py-2" ref={destContainerRef}>
          <MapPin className="w-4 h-4 text-primary shrink-0" />
          <div className="flex-1">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Destino</div>
            <LocationDropdown
              value={destination}
              onChange={setDestination}
              placeholder="¿A dónde vas?"
              inputRef={destInputRef as any}
              dropdownRef={destDropdownRef}
              open={destOpen}
              setOpen={setDestOpen}
              coords={destCoords}
            />
          </div>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-2 bg-muted/30 rounded-xl px-3 py-2 hover:bg-muted/50 transition-colors">
              <CalendarIcon className="w-4 h-4 text-primary shrink-0" />
              <div className="text-left">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Fecha</div>
                <div className="text-sm font-medium">
                  {format(date, "d MMM", { locale: es })}
                </div>
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => d && setDate(d)}
              locale={es}
              disabled={(d) => d < new Date()}
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-2 bg-muted/30 rounded-xl px-3 py-2 hover:bg-muted/50 transition-colors">
              <CalendarIcon className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="text-left">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Regreso</div>
                <div className="text-sm font-medium text-muted-foreground">
                  {returnDate ? format(returnDate, "d MMM", { locale: es }) : "—"}
                </div>
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={returnDate || undefined}
              onSelect={(d) => setReturnDate(d || null)}
              locale={es}
              disabled={(d) => d < date}
            />
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-2 bg-muted/30 rounded-xl px-3 py-2">
          <Users className="w-4 h-4 text-primary shrink-0" />
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Pasajeros</div>
            <div className="text-sm font-medium">{passengers}</div>
          </div>
        </div>

        <Button 
          onClick={handleSearch}
          className="rounded-xl font-bold px-6"
          data-testid="search-update-button"
        >
          <Search className="w-4 h-4 md:mr-2" />
          <span className="hidden md:inline">Actualizar</span>
        </Button>
      </div>
    </div>
  );
}
