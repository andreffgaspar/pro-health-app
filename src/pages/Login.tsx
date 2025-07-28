import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Users, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória")
});

const Login = () => {
  const [activeTab, setActiveTab] = useState<"athlete" | "professional">("athlete");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, user, profile, loading } = useAuth();

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user && profile) {
      const redirectTo = profile.user_type === 'athlete' ? '/athlete-dashboard' : '/professional-dashboard';
      navigate(redirectTo, { replace: true });
    }
  }, [user, profile, navigate]);

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    
    const { error } = await signIn(data.email, data.password);
    
    if (!error) {
      // Clear form after successful login
      form.reset();
    }
    
    setIsLoading(false);
  };

  // Don't render login form if user is already authenticated and we're still loading profile
  if (user && loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-primary hover:text-primary-glow mb-6">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Início
          </Link>
          <h1 className="text-4xl font-bold mb-2">
            Entrar na
            <span className="bg-gradient-hero bg-clip-text text-transparent"> ProSport</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Acesse sua conta e continue sua jornada
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-card-sport">
          <CardHeader>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "athlete" | "professional")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="athlete" className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Atleta
                </TabsTrigger>
                <TabsTrigger value="professional" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Profissional
                </TabsTrigger>
              </TabsList>

              <TabsContent value="athlete" className="mt-6">
                <CardTitle className="mb-2">Login de Atleta</CardTitle>
                <CardDescription className="mb-6">
                  Acesse sua conta para monitorar sua performance
                </CardDescription>
              </TabsContent>

              <TabsContent value="professional" className="mt-6">
                <CardTitle className="mb-2">Login de Profissional</CardTitle>
                <CardDescription className="mb-6">
                  Acesse sua conta para gerenciar seus atletas
                </CardDescription>
              </TabsContent>
            </Tabs>
          </CardHeader>

          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  placeholder="seu@email.com"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  {...form.register("password")}
                  placeholder="Sua senha"
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                )}
              </div>

              <div className="text-right">
                <Link to="#" className="text-sm text-primary hover:underline">
                  Esqueceu a senha?
                </Link>
              </div>

              <Button 
                type="submit" 
                variant={activeTab === "athlete" ? "hero" : "performance"} 
                className="w-full" 
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Register Link */}
        <div className="text-center mt-6">
          <p className="text-muted-foreground">
            Não possui uma conta?{" "}
            <Link to="/register" className="text-primary hover:underline font-medium">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;