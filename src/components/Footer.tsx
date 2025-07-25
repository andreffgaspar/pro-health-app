import { Activity, Mail, Phone, MapPin, Instagram, Linkedin, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";

const Footer = () => {
  const footerSections = [
    {
      title: "Produto",
      links: [
        { label: "Para Atletas", href: "#atletas" },
        { label: "Para Profissionais", href: "#profissionais" },
        { label: "Planos e Preços", href: "#planos" },
        { label: "Integrações", href: "#" }
      ]
    },
    {
      title: "Empresa",
      links: [
        { label: "Sobre Nós", href: "#" },
        { label: "Pro Soccer App", href: "#" },
        { label: "Carreiras", href: "#" },
        { label: "Imprensa", href: "#" }
      ]
    },
    {
      title: "Suporte",
      links: [
        { label: "Central de Ajuda", href: "#" },
        { label: "Documentação", href: "#" },
        { label: "Status", href: "#" },
        { label: "Contato", href: "#" }
      ]
    },
    {
      title: "Legal",
      links: [
        { label: "Privacidade", href: "#" },
        { label: "Termos de Uso", href: "#" },
        { label: "LGPD", href: "#" },
        { label: "Cookies", href: "#" }
      ]
    }
  ];

  const socialLinks = [
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Twitter, href: "#", label: "Twitter" }
  ];

  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-6">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Brand Section */}
            <div className="lg:col-span-4 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center">
                  <Activity className="w-7 h-7 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                    ProSport
                  </h3>
                  <p className="text-sm text-background/70">B2C Platform</p>
                </div>
              </div>
              
              <p className="text-background/80 leading-relaxed">
                A primeira plataforma B2C que conecta atletas e profissionais de saúde, 
                oferecendo gestão completa de performance esportiva baseada na expertise 
                da Pro Soccer App.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-background/80">
                  <Mail className="w-5 h-5" />
                  <span>contato@prosport.com.br</span>
                </div>
                <div className="flex items-center gap-3 text-background/80">
                  <Phone className="w-5 h-5" />
                  <span>+55 (11) 9999-0000</span>
                </div>
                <div className="flex items-center gap-3 text-background/80">
                  <MapPin className="w-5 h-5" />
                  <span>São Paulo, Brasil</span>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex items-center gap-4">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <Button
                      key={social.label}
                      variant="ghost"
                      size="icon"
                      className="text-background hover:text-primary hover:bg-background/10"
                      asChild
                    >
                      <a href={social.href} aria-label={social.label}>
                        <Icon className="w-5 h-5" />
                      </a>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Links Sections */}
            <div className="lg:col-span-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {footerSections.map((section) => (
                  <div key={section.title} className="space-y-4">
                    <h4 className="font-semibold text-background">
                      {section.title}
                    </h4>
                    <ul className="space-y-2">
                      {section.links.map((link) => (
                        <li key={link.label}>
                          <a
                            href={link.href}
                            className="text-background/70 hover:text-primary transition-colors duration-200"
                          >
                            {link.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-background/20 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-background/70 text-sm">
              © 2024 ProSport B2C Platform. Todos os direitos reservados.
            </div>
            
            <div className="flex items-center gap-6 text-sm">
              <span className="text-background/70">Inspirado na</span>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-performance rounded flex items-center justify-center">
                  <Activity className="w-4 h-4 text-secondary-foreground" />
                </div>
                <span className="font-semibold text-background">Pro Soccer App</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;