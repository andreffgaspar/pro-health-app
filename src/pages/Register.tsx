import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Activity, Users, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";

// Validation schemas
const athleteSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  birthDate: z.string().min(1, "Data de nascimento é obrigatória"),
  sport: z.string().min(1, "Modalidade é obrigatória"),
  level: z.string().min(1, "Nível é obrigatório"),
  terms: z.boolean().refine(val => val === true, "É necessário aceitar os termos")
});

const professionalSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  profession: z.string().min(1, "Profissão é obrigatória"),
  specialization: z.string().min(1, "Especialização é obrigatória"),
  license: z.string().min(1, "Registro profissional é obrigatório"),
  terms: z.boolean().refine(val => val === true, "É necessário aceitar os termos")
});

const Register = () => {
  const [activeTab, setActiveTab] = useState<"athlete" | "professional">("athlete");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp, user, profile } = useAuth();

  const athleteForm = useForm({
    resolver: zodResolver(athleteSchema)
  });

  const professionalForm = useForm({
    resolver: zodResolver(professionalSchema)
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user && profile) {
      if (profile.user_type === 'athlete') {
        navigate('/athlete-dashboard');
      } else if (profile.user_type === 'professional') {
        navigate('/professional-dashboard');
      }
    }
  }, [user, profile, navigate]);

  const onAthleteSubmit = async (data: z.infer<typeof athleteSchema>) => {
    setIsLoading(true);
    const { error } = await signUp(data.email, data.password, data.name, 'athlete');
    if (!error) {
      // Navigation will be handled by the useEffect above
    }
    setIsLoading(false);
  };

  const onProfessionalSubmit = async (data: z.infer<typeof professionalSchema>) => {
    setIsLoading(true);
    const { error } = await signUp(data.email, data.password, data.name, 'professional');
    if (!error) {
      // Navigation will be handled by the useEffect above
    }
    setIsLoading(false);
  };

  const sports = [
    "Futebol", "Basquete", "Vôlei", "Tênis", "Natação", "Atletismo",
    "Ciclismo", "Corrida", "Musculação", "Crossfit", "Outros"
  ];

  const levels = [
    "Iniciante", "Intermediário", "Avançado", "Competitivo", "Profissional"
  ];

  const professions = [
    "Nutricionista", "Fisioterapeuta", "Educador Físico", "Médico do Esporte",
    "Psicólogo do Esporte", "Treinador", "Preparador Físico"
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-primary hover:text-primary-glow mb-6">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Início
          </Link>
          <h1 className="text-4xl font-bold mb-2">
            Criar Conta na
            <span className="bg-gradient-hero bg-clip-text text-transparent"> ProSport</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Escolha o tipo de conta para começar sua jornada
          </p>
        </div>

        {/* Registration Tabs */}
        <Card className="shadow-card-sport">
          <CardHeader>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "athlete" | "professional")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="athlete" className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Sou Atleta
                </TabsTrigger>
                <TabsTrigger value="professional" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Sou Profissional
                </TabsTrigger>
              </TabsList>

              {/* Athlete Registration */}
              <TabsContent value="athlete" className="mt-6">
                <CardTitle className="mb-2">Cadastro de Atleta</CardTitle>
                <CardDescription className="mb-6">
                  Crie sua conta para monitorar sua performance e conectar-se com profissionais
                </CardDescription>
                
                <form onSubmit={athleteForm.handleSubmit(onAthleteSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="athlete-name">Nome Completo</Label>
                      <Input
                        id="athlete-name"
                        {...athleteForm.register("name")}
                        placeholder="Seu nome completo"
                      />
                      {athleteForm.formState.errors.name && (
                        <p className="text-sm text-destructive">{athleteForm.formState.errors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="athlete-email">Email</Label>
                      <Input
                        id="athlete-email"
                        type="email"
                        {...athleteForm.register("email")}
                        placeholder="seu@email.com"
                      />
                      {athleteForm.formState.errors.email && (
                        <p className="text-sm text-destructive">{athleteForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="athlete-password">Senha</Label>
                      <Input
                        id="athlete-password"
                        type="password"
                        {...athleteForm.register("password")}
                        placeholder="Mínimo 6 caracteres"
                      />
                      {athleteForm.formState.errors.password && (
                        <p className="text-sm text-destructive">{athleteForm.formState.errors.password.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="athlete-birthDate">Data de Nascimento</Label>
                      <Input
                        id="athlete-birthDate"
                        type="date"
                        {...athleteForm.register("birthDate")}
                      />
                      {athleteForm.formState.errors.birthDate && (
                        <p className="text-sm text-destructive">{athleteForm.formState.errors.birthDate.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Modalidade Principal</Label>
                      <Controller
                        name="sport"
                        control={athleteForm.control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione sua modalidade" />
                            </SelectTrigger>
                            <SelectContent>
                              {sports.map((sport) => (
                                <SelectItem key={sport} value={sport}>{sport}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {athleteForm.formState.errors.sport && (
                        <p className="text-sm text-destructive">{athleteForm.formState.errors.sport.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Nível</Label>
                      <Controller
                        name="level"
                        control={athleteForm.control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione seu nível" />
                            </SelectTrigger>
                            <SelectContent>
                              {levels.map((level) => (
                                <SelectItem key={level} value={level}>{level}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {athleteForm.formState.errors.level && (
                        <p className="text-sm text-destructive">{athleteForm.formState.errors.level.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Controller
                      name="terms"
                      control={athleteForm.control}
                      render={({ field }) => (
                        <Checkbox
                          id="athlete-terms"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label htmlFor="athlete-terms" className="text-sm">
                      Aceito os <Link to="#" className="text-primary hover:underline">termos de uso</Link> e 
                      <Link to="#" className="text-primary hover:underline"> política de privacidade</Link>
                    </Label>
                  </div>
                  {athleteForm.formState.errors.terms && (
                    <p className="text-sm text-destructive">{athleteForm.formState.errors.terms.message}</p>
                  )}

                  <Button type="submit" variant="hero" className="w-full" size="lg" disabled={isLoading}>
                    {isLoading ? "Criando conta..." : "Criar Conta de Atleta"}
                  </Button>
                </form>
              </TabsContent>

              {/* Professional Registration */}
              <TabsContent value="professional" className="mt-6">
                <CardTitle className="mb-2">Cadastro de Profissional</CardTitle>
                <CardDescription className="mb-6">
                  Crie sua conta para gerenciar atletas e oferecer seus serviços especializados
                </CardDescription>
                
                <form onSubmit={professionalForm.handleSubmit(onProfessionalSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="prof-name">Nome Completo</Label>
                      <Input
                        id="prof-name"
                        {...professionalForm.register("name")}
                        placeholder="Seu nome completo"
                      />
                      {professionalForm.formState.errors.name && (
                        <p className="text-sm text-destructive">{professionalForm.formState.errors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="prof-email">Email</Label>
                      <Input
                        id="prof-email"
                        type="email"
                        {...professionalForm.register("email")}
                        placeholder="seu@email.com"
                      />
                      {professionalForm.formState.errors.email && (
                        <p className="text-sm text-destructive">{professionalForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="prof-password">Senha</Label>
                      <Input
                        id="prof-password"
                        type="password"
                        {...professionalForm.register("password")}
                        placeholder="Mínimo 6 caracteres"
                      />
                      {professionalForm.formState.errors.password && (
                        <p className="text-sm text-destructive">{professionalForm.formState.errors.password.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Profissão</Label>
                      <Controller
                        name="profession"
                        control={professionalForm.control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione sua profissão" />
                            </SelectTrigger>
                            <SelectContent>
                              {professions.map((profession) => (
                                <SelectItem key={profession} value={profession}>{profession}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {professionalForm.formState.errors.profession && (
                        <p className="text-sm text-destructive">{professionalForm.formState.errors.profession.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="prof-specialization">Especialização</Label>
                      <Input
                        id="prof-specialization"
                        {...professionalForm.register("specialization")}
                        placeholder="Ex: Nutrição Esportiva, Reabilitação..."
                      />
                      {professionalForm.formState.errors.specialization && (
                        <p className="text-sm text-destructive">{professionalForm.formState.errors.specialization.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="prof-license">Registro Profissional</Label>
                      <Input
                        id="prof-license"
                        {...professionalForm.register("license")}
                        placeholder="CRN, CREF, CRM, etc."
                      />
                      {professionalForm.formState.errors.license && (
                        <p className="text-sm text-destructive">{professionalForm.formState.errors.license.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Controller
                      name="terms"
                      control={professionalForm.control}
                      render={({ field }) => (
                        <Checkbox
                          id="prof-terms"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label htmlFor="prof-terms" className="text-sm">
                      Aceito os <Link to="#" className="text-primary hover:underline">termos de uso</Link> e 
                      <Link to="#" className="text-primary hover:underline"> política de privacidade</Link>
                    </Label>
                  </div>
                  {professionalForm.formState.errors.terms && (
                    <p className="text-sm text-destructive">{professionalForm.formState.errors.terms.message}</p>
                  )}

                  <Button type="submit" variant="performance" className="w-full" size="lg" disabled={isLoading}>
                    {isLoading ? "Criando conta..." : "Criar Conta de Profissional"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>

        {/* Login Link */}
        <div className="text-center mt-6">
          <p className="text-muted-foreground">
            Já possui uma conta?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;