import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/hooks/use-auth";
import { api, formatPrice } from "@/lib/api";
import type { Booking, Trip } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Ticket, Calendar, Users, MapPin, Ship, Bus, AlertCircle, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface BookingWithTrip extends Booking {
  trip?: Trip;
}

export default function MyBookings() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [_, setLocation] = useLocation();
  const [bookings, setBookings] = useState<BookingWithTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = "/api/login";
      return;
    }

    if (isAuthenticated) {
      fetchBookings();
    }
  }, [isAuthenticated, authLoading]);

  async function fetchBookings() {
    try {
      setLoading(true);
      const bookingsData = await api.getMyBookings();
      
      const bookingsWithTrips = await Promise.all(
        bookingsData.map(async (booking) => {
          try {
            const trip = await api.getTripById(booking.tripId);
            return { ...booking, trip };
          } catch {
            return booking;
          }
        })
      );
      
      setBookings(bookingsWithTrips);
      setError(null);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError("Error al cargar tus reservas");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelBooking(bookingId: string) {
    try {
      await api.cancelBooking(bookingId);
      toast({
        title: "Reserva cancelada",
        description: "Tu reserva ha sido cancelada exitosamente",
      });
      fetchBookings();
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo cancelar la reserva",
        variant: "destructive",
      });
    }
  }

  const statusColors: Record<string, string> = {
    confirmed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    completed: "bg-blue-100 text-blue-800",
  };

  const statusLabels: Record<string, string> = {
    confirmed: "Confirmada",
    cancelled: "Cancelada",
    completed: "Completada",
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <Navbar variant="solid" />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <Ticket className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Mis Viajes</h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        ) : bookings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Ticket className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No tienes reservas</h3>
              <p className="text-muted-foreground mb-6">¡Busca tu próximo viaje ahora!</p>
              <Button onClick={() => setLocation("/")} data-testid="search-trips-button">
                Buscar Viajes
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id} className="overflow-hidden" data-testid={`booking-card-${booking.id}`}>
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            booking.trip?.type === 'ferry' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                          }`}>
                            {booking.trip?.type === 'ferry' ? <Ship className="w-6 h-6" /> : <Bus className="w-6 h-6" />}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">
                              {booking.trip?.origin} → {booking.trip?.destination}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {booking.trip?.departure} - {booking.trip?.arrival}
                            </p>
                          </div>
                        </div>
                        <Badge className={statusColors[booking.status] || 'bg-gray-100 text-gray-800'}>
                          {statusLabels[booking.status] || booking.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>
                            {format(new Date(booking.travelDate), "d 'de' MMMM, yyyy", { locale: es })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>{booking.passengers} pasajero{booking.passengers > 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span>{booking.trip?.duration}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-gray-50 flex flex-col items-center justify-center min-w-[160px] border-t md:border-t-0 md:border-l border-gray-100">
                      <div className="text-xs text-muted-foreground mb-1">Total</div>
                      <div className="text-2xl font-bold text-primary mb-3">
                        {formatPrice(booking.totalPrice)}
                      </div>
                      
                      {booking.status === "confirmed" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1" data-testid={`cancel-booking-${booking.id}`}>
                              <X className="w-3 h-3" />
                              Cancelar
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Cancelar esta reserva?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. ¿Estás seguro que deseas cancelar tu viaje?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>No, mantener</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleCancelBooking(booking.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Sí, cancelar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}

                      {booking.milesEarned && booking.milesEarned > 0 && (
                        <div className="mt-2 text-xs text-primary font-medium">
                          +{booking.milesEarned} millas
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
