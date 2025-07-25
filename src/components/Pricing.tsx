import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Users, Crown } from "lucide-react";

const Pricing = () => {
  const athletePlans = [
    {
      name: "Freemium",
      price: "R$ 0",
      period: "/mês",
      description: "Perfeito para começar sua jornada",
      features: [
        "Dashboard básico de performance",
        "Input manual de dados",
        "Histórico de 30 dias",
        "1 profissional vinculado",
        "Relatórios básicos"
      ],
      buttonText: "Começar Grátis",
      variant: "outline" as const,
      popular: false
    },
    {
      name: "Premium",
      price: "R$ 50",
      period: "/mês",
      description: "Funcionalidades completas com profissional",
      features: [
        "Dashboard completo e avançado",
        "Integração com wearables",
        "Histórico completo",
        "Profissionais ilimitados",
        "Relatórios personalizados",
        "Notificações inteligentes",
        "Análises preditivas",
        "Suporte prioritário"
      ],
      buttonText: "Escolher Premium",
      variant: "hero" as const,
      popular: true
    }
  ];

  const professionalPlans = [
    {
      name: "Start",
      price: "R$ 49,90",
      period: "/mês",
      description: "Ideal para profissionais iniciantes",
      features: [
        "Até 5 atletas",
        "Painel de gestão básico",
        "Relatórios padrão",
        "Prescrições e planos",
        "Suporte via chat"
      ],
      buttonText: "Começar Start",
      variant: "outline" as const,
      icon: Users,
      limit: "5 atletas"
    },
    {
      name: "Pro",
      price: "R$ 199",
      period: "/mês",
      description: "Para profissionais estabelecidos",
      features: [
        "Até 25 atletas",
        "Dashboard avançado",
        "Relatórios personalizados",
        "Análises comparativas",
        "Notificações inteligentes",
        "API de integração",
        "Suporte prioritário"
      ],
      buttonText: "Escolher Pro",
      variant: "performance" as const,
      icon: Star,
      limit: "25 atletas",
      popular: true
    },
    {
      name: "Elite",
      price: "R$ 499",
      period: "/mês",
      description: "Para clínicas e assessorias",
      features: [
        "Atletas ilimitados",
        "Gestão de equipe",
        "Branding customizado",
        "Relatórios white-label",
        "IA preditiva completa",
        "Integrações avançadas",
        "Account manager dedicado",
        "Treinamentos exclusivos"
      ],
      buttonText: "Escolher Elite",
      variant: "energy" as const,
      icon: Crown,
      limit: "Ilimitado"
    }
  ];

  return (
    <section className="py-20 bg-gradient-subtle" id="planos">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="outline" className="mb-4 text-primary border-primary">
            Planos e Preços
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Escolha o Plano
            <span className="bg-gradient-hero bg-clip-text text-transparent"> Perfeito</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Soluções flexíveis para atletas e profissionais, desde o primeiro passo até o crescimento completo.
          </p>
        </div>

        {/* Athlete Plans */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold text-center mb-12 text-primary">
            Planos para Atletas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {athletePlans.map((plan) => (
              <Card 
                key={plan.name} 
                className={`p-8 relative ${plan.popular ? 'border-2 border-primary shadow-sport' : ''} hover:shadow-lg transition-all duration-300`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-hero text-primary-foreground">
                    Mais Popular
                  </Badge>
                )}
                
                <div className="text-center mb-6">
                  <h4 className="text-2xl font-bold mb-2">{plan.name}</h4>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="text-muted-foreground">{plan.description}</p>
                </div>

                <div className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-secondary-foreground" />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button variant={plan.variant} className="w-full" size="lg">
                  {plan.buttonText}
                </Button>
              </Card>
            ))}
          </div>
        </div>

        {/* Professional Plans */}
        <div>
          <h3 className="text-3xl font-bold text-center mb-12 text-secondary">
            Planos para Profissionais
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {professionalPlans.map((plan) => {
              const Icon = plan.icon;
              return (
                <Card 
                  key={plan.name} 
                  className={`p-8 relative ${plan.popular ? 'border-2 border-secondary shadow-performance scale-105' : ''} hover:shadow-lg transition-all duration-300`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-performance text-secondary-foreground">
                      Recomendado
                    </Badge>
                  )}
                  
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <h4 className="text-2xl font-bold mb-2">{plan.name}</h4>
                    <div className="mb-2">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                    <Badge variant="outline" className="mb-4">
                      {plan.limit}
                    </Badge>
                    <p className="text-muted-foreground text-sm">{plan.description}</p>
                  </div>

                  <div className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-secondary-foreground" />
                        </div>
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button variant={plan.variant} className="w-full" size="lg">
                    {plan.buttonText}
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Trust Section */}
        <div className="text-center mt-16 p-8 bg-background rounded-2xl shadow-card-sport">
          <h4 className="text-2xl font-bold mb-4">
            Baseado na Confiança da Pro Soccer
          </h4>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Nossa plataforma B2B já atende 50% dos clubes da Série A do futebol brasileiro. 
            Agora trazemos essa expertise para o mercado B2C.
          </p>
          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <span>✓ Dados seguros e protegidos</span>
            <span>✓ Metodologia validada</span>
            <span>✓ Suporte especializado</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;