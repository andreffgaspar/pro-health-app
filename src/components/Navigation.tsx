import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Menu, Settings, Home, BarChart3, Users, MessageSquare } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import NotificationCenter from "./NotificationCenter";

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, profile } = useAuth();

  // Public navigation items
  const publicNavItems = [
    { name: "Home", href: "/", external: false },
    { name: "Features", href: "#features", external: true },
    { name: "Pricing", href: "#pricing", external: true },
    { name: "Contact", href: "#contact", external: true },
  ];

  // Authenticated navigation items
  const authenticatedNavItems = user && profile?.user_type === 'athlete' ? [
    { name: "Dashboard", href: "/athlete-dashboard", external: false },
    { name: "Settings", href: "/athlete-settings", external: false },
    { name: "Logs", href: "/login-logs", external: false },
    { name: "Debug", href: "/debug-logs", external: false },
  ] : user && profile?.user_type === 'professional' ? [
    { name: "Dashboard", href: "/professional-dashboard", external: false },
    { name: "Settings", href: "/settings", external: false },
  ] : publicNavItems;

  const navItems = user ? authenticatedNavItems : publicNavItems;

  return (
    <>
      {/* Mobile Navigation - Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/40">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.slice(0, 4).map((item, index) => (
            <Link
              key={item.name}
              to={item.href}
              className="flex flex-col items-center justify-center p-2 rounded-lg text-xs font-medium transition-colors flex-1 max-w-[80px]"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {index === 0 && <Home className="h-5 w-5 mb-1" />}
              {index === 1 && <BarChart3 className="h-5 w-5 mb-1" />}
              {index === 2 && <Users className="h-5 w-5 mb-1" />}
              {index === 3 && <MessageSquare className="h-5 w-5 mb-1" />}
              <span className="text-[10px] leading-none">{item.name}</span>
            </Link>
          ))}
          
          {/* Mobile Profile/Menu Button */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="flex flex-col items-center justify-center p-2 rounded-lg flex-1 max-w-[80px]">
                {user ? (
                  <>
                    <Avatar className="h-5 w-5 mb-1">
                      <AvatarImage src={profile?.full_name} alt={profile?.full_name || user.email} />
                      <AvatarFallback className="text-[8px]">
                        {profile?.full_name?.[0] || user.email?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[10px] leading-none">Perfil</span>
                  </>
                ) : (
                  <>
                    <Menu className="h-5 w-5 mb-1" />
                    <span className="text-[10px] leading-none">Menu</span>
                  </>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] rounded-t-xl">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-center pb-6 border-b border-border">
                  <div className="flex items-center space-x-2">
                    <img 
                      src="/placeholder.svg" 
                      alt="ProSport" 
                      className="h-8 w-8"
                    />
                    <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                      ProSport
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto py-6">
                  <div className="space-y-4">
                    {navItems.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className="flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-colors hover:bg-muted"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <span>{item.name}</span>
                      </Link>
                    ))}
                  </div>
                  
                  {user && (
                    <div className="mt-8 pt-6 border-t border-border">
                      <div className="flex items-center space-x-3 px-4 py-3 mb-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={profile?.full_name} alt={profile?.full_name || user.email} />
                          <AvatarFallback>
                            {profile?.full_name?.[0] || user.email?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-medium truncate">
                            {profile?.full_name || 'Usuário'}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Button variant="ghost" className="w-full justify-start" asChild>
                          <Link to="/athlete-settings" onClick={() => setIsMobileMenuOpen(false)}>
                            <Settings className="mr-3 h-5 w-5" />
                            Configurações
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start text-destructive"
                          onClick={() => {
                            supabase.auth.signOut();
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          <LogOut className="mr-3 h-5 w-5" />
                          Sair
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {!user && (
                    <div className="mt-8 pt-6 border-t border-border space-y-3">
                      <Button variant="outline" className="w-full" asChild>
                        <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                          Entrar
                        </Link>
                      </Button>
                      <Button variant="default" className="w-full" asChild>
                        <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                          Começar Agora
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* Desktop Navigation - Top Bar */}
      <nav className="hidden md:block fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <img 
                src="/placeholder.svg" 
                alt="ProSport" 
                className="h-8 w-8 mr-2"
              />
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                ProSport
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="flex items-baseline space-x-4">
              {navItems.map((item) => 
                item.external ? (
                  <a
                    key={item.name}
                    href={item.href}
                    className="text-foreground/80 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    {item.name}
                  </a>
                ) : (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="text-foreground/80 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    {item.name}
                  </Link>
                )
              )}
            </div>

            {/* Desktop Actions */}
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <NotificationCenter />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={profile?.full_name} alt={profile?.full_name || user.email} />
                          <AvatarFallback>
                            {profile?.full_name?.[0] || user.email?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {profile?.full_name || 'Usuário'}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/athlete-settings">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Configurações</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive cursor-pointer"
                        onClick={() => {
                          supabase.auth.signOut();
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sair</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Button variant="ghost" asChild>
                    <Link to="/login">Entrar</Link>
                  </Button>
                  <Button variant="default" asChild>
                    <Link to="/register">Começar Agora</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navigation;