import { useState } from "react";
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

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória")
});

const Login = () => {
  const [activeTab, setActiveTab] = useState<"athlete" | "professional">("athlete");
  const navigate = useNavigate();

  const form = useForm({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = (data: z.infer<typeof loginSchema>) => {
    console.log("Login:", data, "Type:", activeTab);
    
    // Simulate successful login
    localStorage.setItem("userType", activeTab);
    localStorage.setItem("userName", data.email.split("@")[0]);
    
    if (activeTab === "athlete") {
      navigate("/athlete-dashboard");
    } else {
      navigate("/professional-dashboard");
    }
  };

  const handleDemoLogin = (userType: "athlete" | "professional") => {
    // Demo login - bypass form validation
    localStorage.setItem("userType", userType);
    localStorage.setItem("userName", userType === "athlete" ? "Demo Atleta" : "Demo Profissional");
    
    if (userType === "athlete") {
      navigate("/athlete-dashboard");
    } else {
      navigate("/professional-dashboard");
    }
  };

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
              >
                Entrar
              </Button>

              {/* Demo Buttons */}
              <div className="space-y-3 pt-4 border-t">
                <p className="text-sm text-muted-foreground text-center">
                  Acesso rápido para demonstração:
                </p>
                <div className="space-y-2">
                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full" 
                    onClick={() => handleDemoLogin("athlete")}
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    Demo Atleta
                  </Button>
                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full" 
                    onClick={() => handleDemoLogin("professional")}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Demo Profissional
                  </Button>
                </div>
              </div>
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