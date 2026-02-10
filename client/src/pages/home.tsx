import { Navbar } from "@/components/layout/Navbar";
import { SearchForm } from "@/components/booking/SearchForm";
import { DestinationCard } from "@/components/booking/DestinationCard";
import { destinations, popularRoutes } from "@/lib/constants";
import { Bus, Ship, ShieldCheck, Clock, CreditCard } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/hero-bg.png" 
            alt="Travel Background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-5xl space-y-8 pt-20">
          <div className="text-center space-y-4 animate-in slide-in-from-bottom-8 duration-700 fade-in">
            <h1 className="text-5xl md:text-7xl font-display font-bold text-white tracking-tight leading-tight text-shadow">
              Tu Viaje <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-200 to-white">Comienza Aquí</span>
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto font-light leading-relaxed">
              Reserva pasajes de ferry y autobús de forma sencilla hacia los destinos más bellos.
            </p>
          </div>

          <div className="pt-8">
            <SearchForm />
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-24 px-6 md:px-12 bg-white">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="flex flex-col md:flex-row justify-between items-end gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Destinos Populares</h2>
              <p className="text-muted-foreground text-lg">Explora los lugares más visitados esta temporada.</p>
            </div>
            <button className="text-primary font-semibold hover:underline decoration-2 underline-offset-4">Ver todos</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {destinations.map((dest, i) => (
              <DestinationCard key={dest.id} {...dest} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Features/Trust Section */}
      <section className="py-24 px-6 md:px-12 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Reserva Segura</h3>
              <p className="text-muted-foreground leading-relaxed">
                Tu información de pago está encriptada y procesada de forma segura. Garantizamos la seguridad de tu transacción.
              </p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-6">
                <Clock className="w-7 h-7 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">Horarios en Tiempo Real</h3>
              <p className="text-muted-foreground leading-relaxed">
                Recibe actualizaciones al instante sobre horarios de salida, retrasos y cambios de plataforma directamente en tu teléfono.
              </p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-6">
                <CreditCard className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Mejor Precio Garantizado</h3>
              <p className="text-muted-foreground leading-relaxed">
                Comparamos precios entre cientos de transportistas para asegurar que obtengas el pasaje más económico.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Routes List */}
      <section className="py-24 px-6 md:px-12 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Rutas en Tendencia</h2>
          <div className="grid gap-4">
            {popularRoutes.map((route, i) => (
              <div key={i} className="group flex items-center justify-between p-6 rounded-2xl border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all bg-white cursor-pointer">
                <div className="flex items-center gap-6">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${route.type === 'ferry' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-500'}`}>
                    {route.type === 'ferry' ? <Ship className="w-5 h-5" /> : <Bus className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 text-lg font-bold">
                      {route.from} 
                      <div className="h-px w-8 bg-border group-hover:bg-primary/50 transition-colors" />
                      {route.to}
                    </div>
                    <p className="text-muted-foreground text-sm mt-1">Salidas diarias • {route.duration}</p>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all text-primary font-semibold">
                  Ver Horarios &rarr;
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="space-y-4">
             <div className="flex items-center gap-2 text-white">
              <span className="text-2xl font-display font-black tracking-tight text-white">BUSPLUS</span>
            </div>
            <p className="text-white/60 max-w-xs">
              Haciendo el viaje simple, accesible y económico para todos.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-12 text-sm text-white/80">
            <div className="space-y-4">
              <h4 className="font-bold text-white">Compañía</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Nosotros</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Carreras</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-white">Ayuda</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Centro de Ayuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contacto</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Reembolsos</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/10 text-center text-white/40 text-sm">
          © 2024 BusPlus. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
