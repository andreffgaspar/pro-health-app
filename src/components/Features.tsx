import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  Brain, 
  Smartphone, 
  Users, 
  BarChart3, 
  Shield,
  Clock,
  Target,
  Heart,
  Zap
} from "lucide-react";

const Features = () => {
  const athleteFeatures = [
    {
      icon: Activity,
      title: "Controle de Performance",
      description: "Monitore treinos, recuperação e evolução em tempo real",
      gradient: "gradient-performance"
    },
    {
      icon: Heart,
      title: "Saúde Integrada",
      description: "Acompanhe sono, alimentação e indicadores vitais",
      gradient: "gradient-hero"
    },
    {
      icon: Smartphone,
      title: "Wearables Conectados",
      description: "Sincronize dados de smartwatches e sensores automaticamente",
      gradient: "gradient-energy"
    }
  ];

  const professionalFeatures = [
    {
      icon: Users,
      title: "Gestão de Atletas",
      description: "Painel completo para acompanhar múltiplos atletas",
      gradient: "gradient-hero"
    },
    {
      icon: BarChart3,
      title: "Relatórios Avançados",
      description: "Análises detalhadas e exportação personalizada",
      gradient: "gradient-performance"
    },
    {
      icon: Brain,
      title: "IA Preditiva",
      description: "Insights automáticos para otimizar prescrições",
      gradient: "gradient-energy"
    }
  ];

  const differentials = [
    {
      icon: Shield,
      title: "Dados Unificados",
      description: "Prontuário único e portátil entre profissionais"
    },
    {
      icon: Clock,
      title: "Tempo Real",
      description: "Notificações inteligentes e sincronização instantânea"
    },
    {
      icon: Target,
      title: "Foco na Performance",
      description: "Metodologia validada em 50% dos clubes da Série A"
    },
    {
      icon: Zap,
      title: "Escalabilidade",
      description: "Infraestrutura robusta para crescimento nacional"
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="outline" className="mb-4 text-primary border-primary">
            Funcionalidades Principais
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Solução Completa para
            <span className="bg-gradient-hero bg-clip-text text-transparent"> Atletas e Profissionais</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            A primeira plataforma que une performance esportiva, gestão de saúde e colaboração profissional em um só lugar.
          </p>
        </div>

        {/* Athlete Features */}
        <div className="mb-20" id="atletas">
          <h3 className="text-3xl font-bold text-center mb-12">
            <Activity className="w-8 h-8 inline-block mr-3 text-primary" />
            Para Atletas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {athleteFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index} 
                  className="p-8 hover:shadow-sport transition-all duration-300 hover:-translate-y-2 group"
                >
                  <div className={`w-16 h-16 bg-${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-xl font-semibold mb-4">{feature.title}</h4>
                  <p className="text-muted-foreground mb-6">{feature.description}</p>
                  <Button variant="outline" className="w-full group-hover:border-primary group-hover:text-primary">
                    Saiba Mais
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Professional Features */}
        <div className="mb-20" id="profissionais">
          <h3 className="text-3xl font-bold text-center mb-12">
            <Users className="w-8 h-8 inline-block mr-3 text-secondary" />
            Para Profissionais
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {professionalFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index} 
                  className="p-8 hover:shadow-performance transition-all duration-300 hover:-translate-y-2 group"
                >
                  <div className={`w-16 h-16 bg-${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-xl font-semibold mb-4">{feature.title}</h4>
                  <p className="text-muted-foreground mb-6">{feature.description}</p>
                  <Button variant="outline" className="w-full group-hover:border-secondary group-hover:text-secondary">
                    Explorar
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Differentials Grid */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-center mb-12">
            Nossos Diferenciais
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {differentials.map((item, index) => {
              const Icon = item.icon;
              return (
                <Card key={index} className="p-6 text-center hover:shadow-card-sport transition-shadow duration-300">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-semibold mb-2">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </Card>
              );
            })}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-subtle rounded-2xl p-12">
          <h3 className="text-3xl font-bold mb-4">
            Pronto para Transformar sua Performance?
          </h3>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Junte-se aos milhares de atletas e profissionais que já confiam na nossa plataforma.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg" className="px-8">
              Começar como Atleta
            </Button>
            <Button variant="performance" size="lg" className="px-8">
              Sou Profissional
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;