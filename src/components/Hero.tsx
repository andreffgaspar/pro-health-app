import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Users, TrendingUp, Shield, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-sports-app.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-subtle">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Athletes training with digital health monitoring"
          className="w-full h-full object-cover opacity-10"
        />
        <div className="absolute inset-0 bg-gradient-hero opacity-5"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-6 text-center">
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
          {/* Hero Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <Shield className="w-4 h-4" />
            Plataforma inspirada na Pro Soccer App
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            Transforme sua
            <span className="bg-gradient-hero bg-clip-text text-transparent"> Performance</span>
            <br />
            Esportiva
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            A primeira plataforma B2C que conecta atletas amadores e profissionais de saúde, 
            oferecendo gestão completa de performance, saúde e evolução esportiva.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button variant="hero" size="lg" className="text-lg px-8 py-6 animate-pulse-glow" asChild>
              <Link to="/register">
                Começar como Atleta
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="sport" size="lg" className="text-lg px-8 py-6" asChild>
              <Link to="/register">
                Sou Profissional
                <Users className="w-5 h-5" />
              </Link>
            </Button>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 animate-slide-up">
            <Card className="p-6 bg-background/80 backdrop-blur-sm shadow-card-sport hover:shadow-sport transition-all duration-300 hover:-translate-y-2">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-gradient-performance rounded-lg flex items-center justify-center mx-auto">
                  <TrendingUp className="w-6 h-6 text-secondary-foreground" />
                </div>
                <h3 className="text-xl font-semibold">Controle Total</h3>
                <p className="text-muted-foreground">
                  Monitore sono, alimentação, treinos e recuperação em uma única plataforma
                </p>
              </div>
            </Card>

            <Card className="p-6 bg-background/80 backdrop-blur-sm shadow-card-sport hover:shadow-performance transition-all duration-300 hover:-translate-y-2">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold">Profissionais Conectados</h3>
                <p className="text-muted-foreground">
                  Trabalhe com nutricionistas, fisioterapeutas e treinadores especializados
                </p>
              </div>
            </Card>

            <Card className="p-6 bg-background/80 backdrop-blur-sm shadow-card-sport hover:shadow-sport transition-all duration-300 hover:-translate-y-2">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-gradient-energy rounded-lg flex items-center justify-center mx-auto">
                  <Smartphone className="w-6 h-6 text-accent-foreground" />
                </div>
                <h3 className="text-xl font-semibold">Tecnologia Avançada</h3>
                <p className="text-muted-foreground">
                  Integração com wearables e relatórios inteligentes para sua evolução
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;