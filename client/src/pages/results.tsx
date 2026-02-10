import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { SearchForm } from "@/components/booking/SearchForm";
import { DatePriceBar } from "@/components/booking/DatePriceBar";
import { ArrowLeft, Filter, Ship, Bus, Clock, SlidersHorizontal, Wifi, Coffee, Snowflake, BedDouble, Dog, ShoppingBag, Loader2, Link2 } from "lucide-react";
import { useLocation, useSearch } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { api, formatPrice, type Connection } from "@/lib/api";
import type { Trip } from "@shared/schema";

interface TripWithOperator extends Trip {
  operatorName?: string;
}

type SortOption = "price" | "departure" | "duration";

const featureIcons: Record<string, { icon: React.ElementType, label: string }> = {
  wifi: { icon: Wifi, label: "WiFi Gratis" },
  cafe: { icon: Coffee, label: "Cafetería" },
  ac: { icon: Snowflake, label: "Aire Acondicionado" },
  bed: { icon: BedDouble, label: "Cama Ejecutivo" },
  pets: { icon: Dog, label: "Mascotas Permitidas" },
  shop: { icon: ShoppingBag, label: "Duty Free" },
  coffee: { icon: Coffee, label: "Snack a bordo" }
};

export default function Results() {
  const [_, setLocation] = useLocation();
  const searchString = useSearch();
  
  const params = new URLSearchParams(searchString);
  const initialOrigin = params.get("origin") || "";
  const initialDestination = params.get("destination") || "";
  const initialDate = params.get("date") ? new Date(params.get("date")!) : new Date();
  const initialReturnDate = params.get("returnDate") ? new Date(params.get("returnDate")!) : null;
  const initialPassengers = parseInt(params.get("passengers") || "1");
  const initialTypes = params.get("types") ? params.get("types")!.split(",") : ["ferry", "bus"];
  const initialDirection = params.get("direction") as "ida" | "vuelta" || "ida";

  const [origin, setOrigin] = useState(initialOrigin);
  const [destination, setDestination] = useState(initialDestination);
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [returnDate, setReturnDate] = useState<Date | null>(initialReturnDate);
  const [passengers, setPassengers] = useState(initialPassengers);
  const [activeDirection, setActiveDirection] = useState<"ida" | "vuelta">(initialDirection);
  
  const [selectedTypes, setSelectedTypes] = useState<string[]>(initialTypes);
  const [trips, setTrips] = useState<TripWithOperator[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [operators, setOperators] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("price");
  const [priceFilter, setPriceFilter] = useState(10000);

  const currentDate = activeDirection === "ida" ? selectedDate : (returnDate || selectedDate);
  const currentOrigin = activeDirection === "ida" ? origin : destination;
  const currentDestination = activeDirection === "ida" ? destination : origin;

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const dateStr = currentDate.toISOString().split('T')[0];
        
        const [tripsData, operatorsData] = await Promise.all([
          api.searchTrips({ 
            origin: currentOrigin || undefined, 
            destination: currentDestination || undefined, 
            types: selectedTypes,
            date: dateStr
          }),
          api.getOperators(),
        ]);
        
        const opMap = new Map(operatorsData.map(op => [op.id, op.name]));
        setOperators(opMap);
        
        const tripsWithOps: TripWithOperator[] = tripsData.map(trip => ({
          ...trip,
          operatorName: opMap.get(trip.operatorId),
        }));
        
        const sortedTrips = sortTrips(tripsWithOps, sortBy);
        
        setTrips(sortedTrips);
        
        if (tripsData.length === 0 && currentOrigin && currentDestination) {
          try {
            const connectionsData = await api.findConnections(currentOrigin, currentDestination, dateStr);
            connectionsData.sort((a, b) => a.totalPrice - b.totalPrice);
            setConnections(connectionsData);
          } catch {
            setConnections([]);
          }
        } else {
          setConnections([]);
        }
        
        setError(null);
      } catch (err) {
        console.error("Error fetching trips:", err);
        setError("Error al cargar los viajes. Por favor intenta de nuevo.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [selectedTypes, currentOrigin, currentDestination, sortBy, currentDate, activeDirection]);

  const sortTrips = (tripsToSort: TripWithOperator[], sort: SortOption): TripWithOperator[] => {
    return [...tripsToSort].sort((a, b) => {
      switch (sort) {
        case "price":
          return a.price - b.price;
        case "departure":
          return a.departure.localeCompare(b.departure);
        case "duration":
          const aDur = parseDuration(a.duration);
          const bDur = parseDuration(b.duration);
          return aDur - bDur;
        default:
          return 0;
      }
    });
  };

  const parseDuration = (dur: string): number => {
    const match = dur.match(/(\d+)h\s*(\d+)?m?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || "0");
    const mins = parseInt(match[2] || "0");
    return hours * 60 + mins;
  };

  const handleTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      setSelectedTypes([...selectedTypes, type]);
    } else {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    }
  };

  const handleDateChange = (date: Date) => {
    if (activeDirection === "ida") {
      setSelectedDate(date);
    } else {
      setReturnDate(date);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 font-sans">
      <TooltipProvider>
        <div className="relative pb-8 overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1920&q=80')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/85 to-primary/75" />
          <div className="relative z-10">
            <Navbar variant="transparent" />
          </div>
          
          <div className="relative z-10 pt-6 px-6 max-w-5xl mx-auto">
            <Button 
              variant="ghost" 
              onClick={() => setLocation("/")}
              className="text-white/80 hover:text-white hover:bg-white/10 mb-4 -ml-2"
              data-testid="back-button"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver
            </Button>
            
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                {origin && destination ? `${origin} → ${destination}` : 'Buscar viajes'}
              </h1>
              <p className="text-white/70 text-sm">
                {passengers} {passengers === 1 ? 'pasajero' : 'pasajeros'} • {returnDate ? 'Ida y vuelta' : 'Solo ida'}
              </p>
            </div>
            
            <SearchForm 
              key={`${origin}-${destination}-${selectedDate.toISOString()}-${returnDate?.toISOString() || 'no-return'}-${passengers}-${selectedTypes.join(',')}`}
              initialOrigin={origin}
              initialDestination={destination}
              initialDate={selectedDate}
              initialReturnDate={returnDate}
              initialPassengers={passengers}
              initialTypes={selectedTypes}
              showUpdateButton={true}
              hideTypeToggles={true}
              onSearch={(params) => {
                setOrigin(params.origin);
                setDestination(params.destination);
                setSelectedDate(params.date);
                setReturnDate(params.returnDate);
                setPassengers(params.passengers);
                setSelectedTypes(params.types);
                
                const searchParams = new URLSearchParams();
                if (params.origin) searchParams.set("origin", params.origin);
                if (params.destination) searchParams.set("destination", params.destination);
                searchParams.set("date", params.date.toISOString().split('T')[0]);
                if (params.returnDate) searchParams.set("returnDate", params.returnDate.toISOString().split('T')[0]);
                searchParams.set("passengers", params.passengers.toString());
                searchParams.set("types", params.types.join(","));
                searchParams.set("direction", activeDirection);
                setLocation(`/results?${searchParams}`);
              }}
            />
          </div>
        </div>

        {returnDate && (
          <div className="bg-white border-b shadow-sm">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
              <div className="flex gap-2 py-3">
                <button
                  onClick={() => {
                    setActiveDirection("ida");
                    const searchParams = new URLSearchParams(searchString);
                    searchParams.set("direction", "ida");
                    setLocation(`/results?${searchParams}`);
                  }}
                  className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all ${
                    activeDirection === "ida" 
                      ? "bg-primary text-white shadow-lg shadow-primary/30" 
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                  data-testid="tab-ida"
                >
                  Ida • {origin} → {destination}
                </button>
                <button
                  onClick={() => {
                    setActiveDirection("vuelta");
                    const searchParams = new URLSearchParams(searchString);
                    searchParams.set("direction", "vuelta");
                    setLocation(`/results?${searchParams}`);
                  }}
                  className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all ${
                    activeDirection === "vuelta" 
                      ? "bg-primary text-white shadow-lg shadow-primary/30" 
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                  data-testid="tab-vuelta"
                >
                  Vuelta • {destination} → {origin}
                </button>
              </div>
            </div>
          </div>
        )}

        <DatePriceBar
          origin={currentOrigin}
          destination={currentDestination}
          selectedDate={currentDate}
          onDateChange={handleDateChange}
        />

        <div className="bg-white/50 border-b">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span className="font-bold text-lg text-foreground">
                  {activeDirection === "ida" ? "Viajes de ida" : "Viajes de vuelta"}
                </span>
                <span className="text-sm text-muted-foreground bg-white px-3 py-1 rounded-full border shadow-sm">
                  {trips.length} resultados
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden md:inline">Ordenar:</span>
                <div className="flex gap-1 bg-white p-1 rounded-xl border shadow-sm">
                  <Button
                    variant={sortBy === "price" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSortBy("price")}
                    className={`text-xs rounded-lg ${sortBy === "price" ? "shadow-sm" : ""}`}
                    data-testid="sort-price"
                  >
                    Precio
                  </Button>
                  <Button
                    variant={sortBy === "duration" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSortBy("duration")}
                    className={`text-xs rounded-lg ${sortBy === "duration" ? "shadow-sm" : ""}`}
                    data-testid="sort-duration"
                  >
                    Duración
                  </Button>
                  <Button
                    variant={sortBy === "departure" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSortBy("departure")}
                    className={`text-xs rounded-lg ${sortBy === "departure" ? "shadow-sm" : ""}`}
                    data-testid="sort-departure"
                  >
                    Horario
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-6 py-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="hidden lg:block space-y-4">
              <div className="bg-white p-5 rounded-2xl shadow-sm border sticky top-24">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2 font-bold text-base">
                    <SlidersHorizontal className="w-4 h-4 text-primary" /> Filtros
                  </div>
                  <Button variant="link" className="text-xs text-muted-foreground p-0 h-auto">Limpiar</Button>
                </div>
                
                <Accordion type="multiple" defaultValue={["vehiculo", "hora"]} className="w-full">
                  <AccordionItem value="vehiculo" className="border-b-0 mb-3">
                    <AccordionTrigger className="hover:no-underline py-2 font-semibold text-sm">Tipo</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="ferry" 
                            checked={selectedTypes.includes("ferry")}
                            onCheckedChange={(checked) => handleTypeChange("ferry", checked as boolean)}
                          />
                          <label htmlFor="ferry" className="text-sm font-medium leading-none flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
                              <Ship className="w-3.5 h-3.5 text-blue-600" />
                            </div>
                            Ferry
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="bus" 
                            checked={selectedTypes.includes("bus")}
                            onCheckedChange={(checked) => handleTypeChange("bus", checked as boolean)}
                          />
                          <label htmlFor="bus" className="text-sm font-medium leading-none flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-orange-50 flex items-center justify-center">
                              <Bus className="w-3.5 h-3.5 text-orange-600" />
                            </div>
                            Bus
                          </label>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="hora" className="border-b-0 mb-3">
                    <AccordionTrigger className="hover:no-underline py-2 font-semibold text-sm">Horario</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="morning" />
                          <label htmlFor="morning" className="text-sm leading-none">Mañana (06-12)</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="afternoon" />
                          <label htmlFor="afternoon" className="text-sm leading-none">Tarde (12-18)</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="evening" />
                          <label htmlFor="evening" className="text-sm leading-none">Noche (18-24)</label>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="precio" className="border-b-0">
                    <AccordionTrigger className="hover:no-underline py-2 font-semibold text-sm">Precio</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-2">
                        <Slider 
                          value={[priceFilter]} 
                          onValueChange={(val) => setPriceFilter(val[0])} 
                          max={10000} 
                          step={500} 
                          className="w-full" 
                        />
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">$U 0</span>
                          <span className="font-semibold text-primary">Hasta $U {priceFilter.toLocaleString('es-UY')}</span>
                          <span className="text-muted-foreground">$U 10.000</span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>

            <div className="lg:col-span-3 space-y-3 min-h-[500px]">
              <div className="flex items-center justify-between mb-2 lg:hidden">
                <Button variant="outline" className="gap-2 rounded-xl">
                  <Filter className="w-4 h-4" /> Filtros
                </Button>
              </div>

              {loading && (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-3" />
                    <p className="text-muted-foreground">Buscando viajes...</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-5 py-4 rounded-xl">
                  {error}
                </div>
              )}

              {!loading && !error && trips.length === 0 && connections.length === 0 && (
                <div className="text-center py-20 bg-white rounded-2xl border">
                  <Bus className="w-14 h-14 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-bold mb-2">No hay viajes disponibles</h3>
                  <p className="text-muted-foreground text-sm">Prueba con otra fecha o ruta</p>
                </div>
              )}

              {!loading && !error && trips.length === 0 && connections.length > 0 && (
                <div className="space-y-3">
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl flex items-center gap-3">
                    <Link2 className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-medium">No hay viajes directos. Te mostramos opciones con conexión.</span>
                  </div>
                  
                  {connections.map((connection, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className="bg-white p-5 rounded-2xl shadow-sm border hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                        <Link2 className="w-3.5 h-3.5" />
                        <span className="font-medium">Viaje con conexión</span>
                      </div>
                      
                      {connection.legs.map((leg, j) => (
                        <div key={leg.id} className="flex items-center gap-4 py-2.5 border-t first:border-t-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${leg.type === 'ferry' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                            {leg.type === 'ferry' ? <Ship className="w-4 h-4" /> : <Bus className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm">{leg.origin} → {leg.destination}</div>
                            <div className="text-xs text-muted-foreground">{leg.departure} - {leg.arrival} • {leg.duration}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-bold text-primary text-sm">{formatPrice(leg.price)}</div>
                          </div>
                        </div>
                      ))}
                      
                      <div className="mt-3 pt-3 border-t flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          Duración total: <span className="font-semibold text-foreground">{connection.totalDuration}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">Total</div>
                            <div className="text-lg font-black text-primary">{formatPrice(connection.totalPrice)}</div>
                          </div>
                          <Button className="rounded-xl" data-testid={`select-connection-${i}`}>Seleccionar</Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {!loading && !error && trips.map((result, i) => (
                <motion.div 
                  key={result.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="bg-white rounded-2xl shadow-sm border hover:shadow-lg hover:border-primary/20 transition-all group cursor-pointer overflow-hidden relative"
                  data-testid={`trip-card-${result.id}`}
                >
                  {result.availableSeats <= 10 && (
                    <div className="absolute top-0 left-0 right-0 flex justify-center">
                      <div className="bg-gradient-to-r from-transparent via-amber-50 to-transparent px-8 py-2 rounded-b-xl border-b border-x border-amber-300">
                        <span className="text-amber-600 text-xs font-semibold flex items-center gap-1.5">
                          <span className="text-base">🔥</span> QUEDAN POCOS ASIENTOS
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col md:flex-row">
                    <div className="flex-1 p-5 flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${result.type === 'ferry' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                        {result.type === 'ferry' ? <Ship className="w-7 h-7" /> : <Bus className="w-7 h-7" />}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-lg text-foreground truncate">{result.operatorName || 'Operador'}</h3>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          {result.features.slice(0, 4).map(f => {
                            const Feature = featureIcons[f];
                            if (!Feature) return null;
                            const Icon = Feature.icon;
                            return (
                              <Tooltip key={f}>
                                <TooltipTrigger asChild>
                                  <div className="bg-muted/60 p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                                    <Icon className="w-4 h-4" />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent><p>{Feature.label}</p></TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex-[1.5] p-5 flex items-center justify-center border-t md:border-t-0 md:border-l border-dashed">
                      <div className="flex items-center gap-4 w-full max-w-sm">
                        <div className="text-center shrink-0">
                          <div className="font-black text-2xl text-foreground">{result.departure}</div>
                          <div className="text-xs font-medium text-muted-foreground mt-0.5 truncate max-w-[80px]">{result.origin}</div>
                        </div>
                        
                        <div className="flex-1 relative flex flex-col items-center gap-1">
                          <div className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" /> {result.duration}
                          </div>
                          <div className="w-full flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-primary/30" />
                            <div className="flex-1 h-px bg-gradient-to-r from-primary/30 via-primary/50 to-primary/30" />
                            <div className={`p-1 rounded-full ${result.type === 'ferry' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                              {result.type === 'ferry' ? <Ship className="w-3 h-3" /> : <Bus className="w-3 h-3" />}
                            </div>
                            <div className="flex-1 h-px bg-gradient-to-r from-primary/30 via-primary/50 to-primary/30" />
                            <div className="w-2 h-2 rounded-full bg-primary" />
                          </div>
                          <div className="text-[10px] text-green-600 font-bold">Directo</div>
                        </div>

                        <div className="text-center shrink-0">
                          <div className="font-black text-2xl text-foreground">{result.arrival}</div>
                          <div className="text-xs font-medium text-muted-foreground mt-0.5 truncate max-w-[80px]">{result.destination}</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 flex flex-row md:flex-col items-center justify-between md:justify-center gap-3 bg-gradient-to-r md:bg-gradient-to-b from-primary/5 to-transparent md:min-w-[160px] border-t md:border-t-0 md:border-l">
                      <div className="text-center md:text-right">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">por persona</div>
                        <div className="text-2xl font-black text-primary">{formatPrice(result.price)}</div>
                      </div>
                      <Button 
                        className="rounded-xl font-bold shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all group-hover:-translate-y-0.5" 
                        data-testid={`select-trip-${result.id}`}
                      >
                        Seleccionar
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
}
