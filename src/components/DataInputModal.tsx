import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Moon, 
  Utensils, 
  Activity, 
  Heart, 
  Droplets,
  Clock,
  Target,
  Save
} from "lucide-react";

interface DataInputModalProps {
  trigger?: React.ReactNode;
}

const DataInputModal = ({ trigger }: DataInputModalProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  // State for form data
  const [sleepData, setSleepData] = useState({
    hours: "",
    quality: "",
    bedTime: "",
    wakeTime: ""
  });

  const [nutritionData, setNutritionData] = useState({
    calories: "",
    water: "",
    meals: "",
    supplements: ""
  });

  const [trainingData, setTrainingData] = useState({
    duration: "",
    intensity: "",
    type: "",
    rpe: "",
    notes: ""
  });

  const [vitalData, setVitalData] = useState({
    restingHR: "",
    weight: "",
    bodyFat: "",
    mood: "",
    energy: ""
  });

  const handleSaveData = (dataType: string) => {
    // Simulate data saving
    toast({
      title: "Dados salvos com sucesso!",
      description: `Seus dados de ${dataType} foram registrados.`,
    });
  };

  const defaultTrigger = (
    <Button variant="hero" className="gap-2">
      <Plus className="w-4 h-4" />
      Registrar Dados
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Registrar Dados de Performance
          </DialogTitle>
          <DialogDescription>
            Adicione suas métricas diárias para acompanhar sua evolução
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="sleep" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sleep" className="gap-2">
              <Moon className="w-4 h-4" />
              Sono
            </TabsTrigger>
            <TabsTrigger value="nutrition" className="gap-2">
              <Utensils className="w-4 h-4" />
              Nutrição
            </TabsTrigger>
            <TabsTrigger value="training" className="gap-2">
              <Activity className="w-4 h-4" />
              Treino
            </TabsTrigger>
            <TabsTrigger value="vitals" className="gap-2">
              <Heart className="w-4 h-4" />
              Dados Vitais
            </TabsTrigger>
          </TabsList>

          {/* Sleep Tab */}
          <TabsContent value="sleep">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Moon className="w-5 h-5 text-blue-500" />
                  Dados do Sono
                </CardTitle>
                <CardDescription>
                  Registre informações sobre sua qualidade de sono
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sleep-hours">Horas de Sono</Label>
                    <Input
                      id="sleep-hours"
                      type="number"
                      step="0.5"
                      min="0"
                      max="12"
                      placeholder="8.5"
                      value={sleepData.hours}
                      onChange={(e) => setSleepData({...sleepData, hours: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Qualidade do Sono</Label>
                    <Select value={sleepData.quality} onValueChange={(value) => setSleepData({...sleepData, quality: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Avalie de 1 a 5" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Muito Ruim</SelectItem>
                        <SelectItem value="2">2 - Ruim</SelectItem>
                        <SelectItem value="3">3 - Regular</SelectItem>
                        <SelectItem value="4">4 - Bom</SelectItem>
                        <SelectItem value="5">5 - Excelente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bed-time">Hora de Dormir</Label>
                    <Input
                      id="bed-time"
                      type="time"
                      value={sleepData.bedTime}
                      onChange={(e) => setSleepData({...sleepData, bedTime: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wake-time">Hora de Acordar</Label>
                    <Input
                      id="wake-time"
                      type="time"
                      value={sleepData.wakeTime}
                      onChange={(e) => setSleepData({...sleepData, wakeTime: e.target.value})}
                    />
                  </div>
                </div>
                
                <Button onClick={() => handleSaveData("sono")} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Dados do Sono
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Nutrition Tab */}
          <TabsContent value="nutrition">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-orange-500" />
                  Dados Nutricionais
                </CardTitle>
                <CardDescription>
                  Registre sua alimentação e hidratação
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="calories">Calorias Consumidas</Label>
                    <Input
                      id="calories"
                      type="number"
                      placeholder="2250"
                      value={nutritionData.calories}
                      onChange={(e) => setNutritionData({...nutritionData, calories: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="water">Água (Litros)</Label>
                    <Input
                      id="water"
                      type="number"
                      step="0.1"
                      placeholder="3.2"
                      value={nutritionData.water}
                      onChange={(e) => setNutritionData({...nutritionData, water: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meals">Refeições</Label>
                  <Textarea
                    id="meals"
                    placeholder="Descreva suas principais refeições..."
                    value={nutritionData.meals}
                    onChange={(e) => setNutritionData({...nutritionData, meals: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplements">Suplementos</Label>
                  <Input
                    id="supplements"
                    placeholder="Whey, Creatina, Vitaminas..."
                    value={nutritionData.supplements}
                    onChange={(e) => setNutritionData({...nutritionData, supplements: e.target.value})}
                  />
                </div>
                
                <Button onClick={() => handleSaveData("nutrição")} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Dados Nutricionais
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Training Tab */}
          <TabsContent value="training">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-500" />
                  Dados do Treino
                </CardTitle>
                <CardDescription>
                  Registre informações sobre sua sessão de treino
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duração (minutos)</Label>
                    <Input
                      id="duration"
                      type="number"
                      placeholder="90"
                      value={trainingData.duration}
                      onChange={(e) => setTrainingData({...trainingData, duration: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Intensidade</Label>
                    <Select value={trainingData.intensity} onValueChange={(value) => setTrainingData({...trainingData, intensity: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a intensidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baixa">Baixa</SelectItem>
                        <SelectItem value="moderada">Moderada</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="maxima">Máxima</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo de Treino</Label>
                    <Input
                      id="type"
                      placeholder="Cardio, Força, Técnico..."
                      value={trainingData.type}
                      onChange={(e) => setTrainingData({...trainingData, type: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>RPE (1-10)</Label>
                    <Select value={trainingData.rpe} onValueChange={(value) => setTrainingData({...trainingData, rpe: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Percepção de esforço" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({length: 10}, (_, i) => (
                          <SelectItem key={i+1} value={String(i+1)}>{i+1} - {
                            i < 2 ? "Muito Fácil" :
                            i < 4 ? "Fácil" :
                            i < 6 ? "Moderado" :
                            i < 8 ? "Difícil" : "Máximo"
                          }</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    placeholder="Como se sentiu durante o treino, lesões, pontos de atenção..."
                    value={trainingData.notes}
                    onChange={(e) => setTrainingData({...trainingData, notes: e.target.value})}
                  />
                </div>
                
                <Button onClick={() => handleSaveData("treino")} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Dados do Treino
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vitals Tab */}
          <TabsContent value="vitals">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  Dados Vitais
                </CardTitle>
                <CardDescription>
                  Registre seus indicadores de saúde
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="resting-hr">FC Repouso (bpm)</Label>
                    <Input
                      id="resting-hr"
                      type="number"
                      placeholder="65"
                      value={vitalData.restingHR}
                      onChange={(e) => setVitalData({...vitalData, restingHR: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="weight">Peso (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      placeholder="75.5"
                      value={vitalData.weight}
                      onChange={(e) => setVitalData({...vitalData, weight: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="body-fat">% Gordura</Label>
                    <Input
                      id="body-fat"
                      type="number"
                      step="0.1"
                      placeholder="12.5"
                      value={vitalData.bodyFat}
                      onChange={(e) => setVitalData({...vitalData, bodyFat: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Humor/Bem-estar</Label>
                    <Select value={vitalData.mood} onValueChange={(value) => setVitalData({...vitalData, mood: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Como se sente hoje?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">😢 Muito Ruim</SelectItem>
                        <SelectItem value="2">😟 Ruim</SelectItem>
                        <SelectItem value="3">😐 Regular</SelectItem>
                        <SelectItem value="4">😊 Bom</SelectItem>
                        <SelectItem value="5">😄 Excelente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Nível de Energia</Label>
                    <Select value={vitalData.energy} onValueChange={(value) => setVitalData({...vitalData, energy: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seu nível de energia hoje" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Muito Baixo</SelectItem>
                        <SelectItem value="2">2 - Baixo</SelectItem>
                        <SelectItem value="3">3 - Moderado</SelectItem>
                        <SelectItem value="4">4 - Alto</SelectItem>
                        <SelectItem value="5">5 - Muito Alto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button onClick={() => handleSaveData("dados vitais")} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Dados Vitais
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default DataInputModal;