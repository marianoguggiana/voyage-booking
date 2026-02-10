import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Ticket, Award, LogOut, Menu, ChevronDown } from "lucide-react";

interface NavbarProps {
  variant?: "transparent" | "solid";
}

export function Navbar({ variant = "transparent" }: NavbarProps) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();

  const isTransparent = variant === "transparent";
  const textColor = isTransparent ? "text-white" : "text-foreground";
  const textMuted = isTransparent ? "text-white/80" : "text-muted-foreground";

  return (
    <nav className={`${isTransparent ? 'absolute' : 'sticky'} top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12 ${!isTransparent && 'bg-white border-b border-gray-100 shadow-sm'}`}>
      <Link href="/">
        <span className={`text-2xl font-display font-black tracking-tight cursor-pointer ${isTransparent ? 'text-white' : 'text-primary'}`}>BUSPLUS</span>
      </Link>

      <div className="hidden md:flex items-center gap-8">
        <Link href="/">
          <span className={`${location === '/' ? textColor : textMuted} hover:${textColor} font-medium transition-colors cursor-pointer`}>Buscar</span>
        </Link>
        {isAuthenticated && (
          <>
            <Link href="/mis-viajes">
              <span className={`${location === '/mis-viajes' ? textColor : textMuted} hover:${textColor} font-medium transition-colors cursor-pointer`}>Mis Viajes</span>
            </Link>
            <Link href="/mis-millas">
              <span className={`${location === '/mis-millas' ? textColor : textMuted} hover:${textColor} font-medium transition-colors cursor-pointer`}>Mis Millas</span>
            </Link>
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        {isLoading ? (
          <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
        ) : isAuthenticated && user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant={isTransparent ? "ghost" : "outline"} 
                className={`gap-2 ${isTransparent ? 'text-white hover:bg-white/10' : ''}`}
                data-testid="user-menu-trigger"
              >
                {user.profileImageUrl ? (
                  <img 
                    src={user.profileImageUrl} 
                    alt={user.firstName || 'Usuario'} 
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <User className="w-5 h-5" />
                )}
                <span className="hidden sm:inline">
                  {user.firstName || user.email?.split('@')[0] || 'Usuario'}
                </span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/mis-viajes">
                  <span className="flex items-center gap-2 cursor-pointer w-full">
                    <Ticket className="w-4 h-4" />
                    Mis Viajes
                  </span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/mis-millas">
                  <span className="flex items-center gap-2 cursor-pointer w-full">
                    <Award className="w-4 h-4" />
                    Mis Millas
                  </span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => logout()}
                className="text-red-600 cursor-pointer"
                data-testid="logout-button"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <>
            <a 
              href="/api/login" 
              className={`hidden md:block ${textColor} font-medium hover:opacity-80 transition-opacity`}
              data-testid="login-button"
            >
              Iniciar sesión
            </a>
            <a href="/api/login">
              <Button 
                className={`${isTransparent ? 'bg-white text-primary hover:bg-white/90' : ''} px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-black/5`}
                data-testid="register-button"
              >
                Registrarse
              </Button>
            </a>
          </>
        )}
      </div>
    </nav>
  );
}
