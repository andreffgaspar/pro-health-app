import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Users, TrendingUp, Shield, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-sports-app.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-subtle pt-16 md:pt-0">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Athletes training with digital health monitoring"
          className="w-full h-full object-cover opacity-10"
        />
        <div className="absolute inset-0 bg-gradient-hero opacity-5"></div>
      </div>

      {/* Main Content - Mobile First */}
      <div className="relative z-10 container mx-auto px-4 text-center pb-20 md:pb-0">
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-fade-in">
          {/* Hero Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-2 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium">
            <Shield className="w-3 h-3 md:w-4 md:h-4" />
            Plataforma inspirada na Pro Soccer App
          </div>

          {/* Main Headline - Mobile Optimized */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold leading-tight">
            Transforme sua
            <span className="bg-gradient-hero bg-clip-text text-transparent"> Performance</span>
            <br />
            Esportiva
          </h1>

          {/* Subtitle - Mobile Responsive */}
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-2">
            A primeira plataforma B2C que conecta atletas amadores e profissionais de saúde, 
            oferecendo gestão completa de performance, saúde e evolução esportiva.
          </p>

          {/* CTA Buttons - Mobile Stack */}
          <div className="flex flex-col gap-3 sm:gap-4 justify-center items-center px-4">
            <Button variant="hero" size="lg" className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 w-full sm:w-auto animate-pulse-glow" asChild>
              <Link to="/register">
                Começar como Atleta
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </Link>
            </Button>
            <Button variant="sport" size="lg" className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 w-full sm:w-auto" asChild>
              <Link to="/register?tab=professional">
                Sou Profissional
                <Users className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </Link>
            </Button>
          </div>

          {/* Feature Cards - Mobile Stack */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-8 md:mt-16 animate-slide-up px-2">
            <Card className="p-4 md:p-6 bg-background/80 backdrop-blur-sm shadow-card-sport hover:shadow-sport transition-all duration-300 hover:-translate-y-2">
              <div className="text-center space-y-3 md:space-y-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-performance rounded-lg flex items-center justify-center mx-auto">
                  <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-secondary-foreground" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold">Controle Total</h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  Monitore sono, alimentação, treinos e recuperação em uma única plataforma
                </p>
              </div>
            </Card>

            <Card className="p-4 md:p-6 bg-background/80 backdrop-blur-sm shadow-card-sport hover:shadow-performance transition-all duration-300 hover:-translate-y-2">
              <div className="text-center space-y-3 md:space-y-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-hero rounded-lg flex items-center justify-center mx-auto">
                  <Users className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold">Profissionais Conectados</h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  Trabalhe com nutricionistas, fisioterapeutas e treinadores especializados
                </p>
              </div>
            </Card>

            <Card className="p-4 md:p-6 bg-background/80 backdrop-blur-sm shadow-card-sport hover:shadow-sport transition-all duration-300 hover:-translate-y-2">
              <div className="text-center space-y-3 md:space-y-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-energy rounded-lg flex items-center justify-center mx-auto">
                  <Smartphone className="w-5 h-5 md:w-6 md:h-6 text-accent-foreground" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold">Tecnologia Avançada</h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
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