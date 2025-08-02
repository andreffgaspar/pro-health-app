import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, User, Settings, LogOut, Activity, Users, Star } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import NotificationCenter from "@/components/NotificationCenter";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Navegação pública (quando não logado)
  const publicNavItems = [
    { label: "Para Atletas", href: "#atletas", icon: Activity },
    { label: "Para Profissionais", href: "#profissionais", icon: Users },
    { label: "Planos", href: "#planos", icon: Star },
  ];

  // Navegação autenticada
  const authenticatedNavItems = user && profile?.user_type === 'athlete' ? [
    { label: "Dashboard", href: "/athlete-dashboard" },
    { label: "Comunicação", href: "/communication" },
    { label: "Configurações", href: "/athlete-settings" },
  ] : user && profile?.user_type === 'professional' ? [
    { label: "Dashboard", href: "/professional-dashboard" },
    { label: "Comunicação", href: "/communication" },
    { label: "Configurações", href: "/settings" },
  ] : [];

  const navItems = user ? authenticatedNavItems : publicNavItems;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-hero rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                ProSport
              </h1>
              <p className="text-xs text-muted-foreground">B2C Platform</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              user ? (
                <Link
                  key={item.label}
                  to={item.href}
                  className={`text-foreground hover:text-primary transition-colors duration-200 font-medium ${
                    location.pathname === item.href ? 'text-primary' : ''
                  }`}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-foreground hover:text-primary transition-colors duration-200 font-medium"
                >
                  {item.label}
                </a>
              )
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <NotificationCenter />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {profile?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Perfil</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Configurações</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
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
                <Button variant="sport" asChild>
                  <Link to="/register">Começar Agora</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px]">
              <div className="flex flex-col gap-6 mt-8">
                {navItems.map((item) => (
                  user ? (
                    <Link
                      key={item.label}
                      to={item.href}
                      className="flex items-center gap-3 text-foreground hover:text-primary transition-colors duration-200 font-medium text-lg"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <a
                      key={item.label}
                      href={item.href}
                      className="flex items-center gap-3 text-foreground hover:text-primary transition-colors duration-200 font-medium text-lg"
                      onClick={() => setIsOpen(false)}
                    >
                      {'icon' in item && item.icon && React.createElement(item.icon as any, { className: "w-5 h-5" })}
                      {item.label}
                    </a>
                  )
                ))}
                
                {/* Mobile Actions */}
                <div className="flex flex-col gap-3 mt-8">
                  {user ? (
                    <>
                      <div className="px-4 py-2">
                        <NotificationCenter />
                      </div>
                      <Button variant="ghost" className="justify-start" onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Sair
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" className="justify-start" asChild>
                        <Link to="/login">Entrar</Link>
                      </Button>
                      <Button variant="sport" className="justify-start" asChild>
                        <Link to="/register">Começar Agora</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;