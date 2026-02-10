import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import type { UserMiles, MilesTransaction } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Award, TrendingUp, Gift, Star, ArrowUpRight, ArrowDownRight, Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const tierInfo: Record<string, { name: string, color: string, bgColor: string, nextTier: string | null, milesNeeded: number }> = {
  bronze: { name: "Bronce", color: "text-amber-700", bgColor: "bg-amber-100", nextTier: "silver", milesNeeded: 20000 },
  silver: { name: "Plata", color: "text-gray-600", bgColor: "bg-gray-200", nextTier: "gold", milesNeeded: 50000 },
  gold: { name: "Oro", color: "text-yellow-600", bgColor: "bg-yellow-100", nextTier: "platinum", milesNeeded: 100000 },
  platinum: { name: "Platino", color: "text-purple-600", bgColor: "bg-purple-100", nextTier: null, milesNeeded: 0 },
};

export default function MyMiles() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [_, setLocation] = useLocation();
  const [miles, setMiles] = useState<UserMiles | null>(null);
  const [transactions, setTransactions] = useState<MilesTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = "/api/login";
      return;
    }

    if (isAuthenticated) {
      fetchMilesData();
    }
  }, [isAuthenticated, authLoading]);

  async function fetchMilesData() {
    try {
      setLoading(true);
      const [milesData, transactionsData] = await Promise.all([
        api.getMyMiles(),
        api.getMilesTransactions(),
      ]);
      setMiles(milesData);
      setTransactions(transactionsData);
      setError(null);
    } catch (err) {
      console.error("Error fetching miles:", err);
      setError("Error al cargar tus millas");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const tier = tierInfo[miles?.tierLevel || "bronze"];
  const nextTierInfo = tier.nextTier ? tierInfo[tier.nextTier] : null;
  const progressToNextTier = nextTierInfo 
    ? Math.min(100, ((miles?.lifetimeMiles || 0) / nextTierInfo.milesNeeded) * 100)
    : 100;
  const milesToNextTier = nextTierInfo 
    ? Math.max(0, nextTierInfo.milesNeeded - (miles?.lifetimeMiles || 0))
    : 0;

  return (
    <div className="min-h-screen bg-muted/20">
      <Navbar variant="solid" />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <Award className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Mis Millas</h1>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-xl">
            {error}
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-primary to-primary/80 text-white">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p className="text-white/80 text-sm mb-1">Millas Disponibles</p>
                      <p className="text-4xl font-bold">{(miles?.totalMiles || 0).toLocaleString('es-UY')}</p>
                    </div>
                    <div className={`${tier.bgColor} ${tier.color} px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1`}>
                      <Star className="w-4 h-4" />
                      {tier.name}
                    </div>
                  </div>
                  
                  {nextTierInfo && (
                    <div>
                      <div className="flex justify-between text-sm text-white/80 mb-2">
                        <span>Progreso a {nextTierInfo.name}</span>
                        <span>{milesToNextTier.toLocaleString('es-UY')} millas restantes</span>
                      </div>
                      <Progress value={progressToNextTier} className="h-2 bg-white/20" />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Millas de Por Vida
                  </CardTitle>
                  <CardDescription>Total acumulado histórico</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">
                    {(miles?.lifetimeMiles || 0).toLocaleString('es-UY')}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-primary" />
                  Beneficios de tu Nivel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {miles?.tierLevel === "bronze" && (
                    <>
                      <div className="p-4 bg-muted/50 rounded-xl">
                        <p className="font-medium">1 milla por $100</p>
                        <p className="text-sm text-muted-foreground">En todas tus compras</p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-xl">
                        <p className="font-medium">Ofertas exclusivas</p>
                        <p className="text-sm text-muted-foreground">Por email cada mes</p>
                      </div>
                    </>
                  )}
                  {(miles?.tierLevel === "silver" || miles?.tierLevel === "gold" || miles?.tierLevel === "platinum") && (
                    <>
                      <div className="p-4 bg-muted/50 rounded-xl">
                        <p className="font-medium">1.5 millas por $100</p>
                        <p className="text-sm text-muted-foreground">50% más millas</p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-xl">
                        <p className="font-medium">Embarque prioritario</p>
                        <p className="text-sm text-muted-foreground">En todos los viajes</p>
                      </div>
                    </>
                  )}
                  {(miles?.tierLevel === "gold" || miles?.tierLevel === "platinum") && (
                    <div className="p-4 bg-muted/50 rounded-xl">
                      <p className="font-medium">Sala VIP</p>
                      <p className="text-sm text-muted-foreground">Acceso en terminales</p>
                    </div>
                  )}
                  {miles?.tierLevel === "platinum" && (
                    <div className="p-4 bg-muted/50 rounded-xl">
                      <p className="font-medium">2 millas por $100</p>
                      <p className="text-sm text-muted-foreground">Doble de millas</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Historial de Millas</CardTitle>
                <CardDescription>Últimos movimientos de tu cuenta</CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Aún no tienes movimientos de millas</p>
                    <p className="text-sm">¡Reserva tu primer viaje para empezar a acumular!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx) => (
                      <div 
                        key={tx.id} 
                        className="flex items-center justify-between py-3 border-b last:border-0"
                        data-testid={`transaction-${tx.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            tx.type === 'earned' || tx.type === 'bonus' 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-red-100 text-red-600'
                          }`}>
                            {tx.type === 'earned' || tx.type === 'bonus' 
                              ? <ArrowUpRight className="w-5 h-5" />
                              : <ArrowDownRight className="w-5 h-5" />
                            }
                          </div>
                          <div>
                            <p className="font-medium">{tx.description}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(tx.createdAt), "d MMM yyyy", { locale: es })}
                            </p>
                          </div>
                        </div>
                        <div className={`font-bold ${
                          tx.type === 'earned' || tx.type === 'bonus' 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {tx.type === 'earned' || tx.type === 'bonus' ? '+' : '-'}
                          {Math.abs(tx.miles).toLocaleString('es-UY')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
