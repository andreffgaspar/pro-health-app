import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Apple, Save } from "lucide-react";

interface NutritionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  session: any;
}

const NutritionModal = ({ isOpen, onOpenChange, session }: NutritionModalProps) => {
  const [nutritionData, setNutritionData] = useState({
    // Anamnese
    currentWeight: '',
    targetWeight: '',
    height: '',
    bodyFat: '',
    activityLevel: '',
    dietaryRestrictions: '',
    allergies: '',
    medicalConditions: '',
    currentDiet: '',
    eatingHabits: '',
    hydration: '',
    supplements: '',
    
    // Objetivos
    goals: '',
    timeframe: '',
    
    // Prescrição
    dailyCalories: '',
    macroDistribution: {
      carbs: '',
      proteins: '',
      fats: ''
    },
    mealPlan: '',
    supplementPrescription: '',
    recommendations: '',
    followUpNotes: ''
  });

  const handleSave = () => {
    console.log('Salvando dados nutricionais:', nutritionData);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Apple className="w-5 h-5 text-green-500" />
            Consulta Nutricional - {session?.title}
          </DialogTitle>
          <DialogDescription>
            Realize a anamnese nutricional e prescreva o plano alimentar.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[75vh] pr-4">
          <div className="space-y-6">
            {/* Dados Antropométricos */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Dados Antropométricos</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="currentWeight">Peso Atual (kg)</Label>
                  <Input
                    id="currentWeight"
                    value={nutritionData.currentWeight}
                    onChange={(e) => setNutritionData({ ...nutritionData, currentWeight: e.target.value })}
                    placeholder="70"
                    type="number"
                    step="0.1"
                  />
                </div>
                <div>
                  <Label htmlFor="targetWeight">Peso Meta (kg)</Label>
                  <Input
                    id="targetWeight"
                    value={nutritionData.targetWeight}
                    onChange={(e) => setNutritionData({ ...nutritionData, targetWeight: e.target.value })}
                    placeholder="65"
                    type="number"
                    step="0.1"
                  />
                </div>
                <div>
                  <Label htmlFor="height">Altura (cm)</Label>
                  <Input
                    id="height"
                    value={nutritionData.height}
                    onChange={(e) => setNutritionData({ ...nutritionData, height: e.target.value })}
                    placeholder="170"
                    type="number"
                  />
                </div>
                <div>
                  <Label htmlFor="bodyFat">% Gordura</Label>
                  <Input
                    id="bodyFat"
                    value={nutritionData.bodyFat}
                    onChange={(e) => setNutritionData({ ...nutritionData, bodyFat: e.target.value })}
                    placeholder="15"
                    type="number"
                    step="0.1"
                  />
                </div>
              </div>
            </div>

            {/* Nível de Atividade */}
            <div>
              <Label htmlFor="activityLevel">Nível de Atividade Física</Label>
              <Select 
                value={nutritionData.activityLevel} 
                onValueChange={(value) => setNutritionData({ ...nutritionData, activityLevel: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o nível de atividade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">Sedentário</SelectItem>
                  <SelectItem value="light">Atividade Leve</SelectItem>
                  <SelectItem value="moderate">Atividade Moderada</SelectItem>
                  <SelectItem value="intense">Atividade Intensa</SelectItem>
                  <SelectItem value="very-intense">Muito Intenso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Anamnese Alimentar */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Anamnese Alimentar</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="currentDiet">Dieta Atual</Label>
                  <Textarea
                    id="currentDiet"
                    value={nutritionData.currentDiet}
                    onChange={(e) => setNutritionData({ ...nutritionData, currentDiet: e.target.value })}
                    placeholder="Descreva a alimentação atual do paciente..."
                    className="min-h-[80px]"
                  />
                </div>

                <div>
                  <Label htmlFor="eatingHabits">Hábitos Alimentares</Label>
                  <Textarea
                    id="eatingHabits"
                    value={nutritionData.eatingHabits}
                    onChange={(e) => setNutritionData({ ...nutritionData, eatingHabits: e.target.value })}
                    placeholder="Horários das refeições, preferências, aversões..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dietaryRestrictions">Restrições Alimentares</Label>
                    <Textarea
                      id="dietaryRestrictions"
                      value={nutritionData.dietaryRestrictions}
                      onChange={(e) => setNutritionData({ ...nutritionData, dietaryRestrictions: e.target.value })}
                      placeholder="Vegetarianismo, intolerâncias..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="allergies">Alergias Alimentares</Label>
                    <Textarea
                      id="allergies"
                      value={nutritionData.allergies}
                      onChange={(e) => setNutritionData({ ...nutritionData, allergies: e.target.value })}
                      placeholder="Liste as alergias conhecidas..."
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="hydration">Hidratação</Label>
                  <Input
                    id="hydration"
                    value={nutritionData.hydration}
                    onChange={(e) => setNutritionData({ ...nutritionData, hydration: e.target.value })}
                    placeholder="Quantidade de água consumida por dia"
                  />
                </div>

                <div>
                  <Label htmlFor="supplements">Suplementos Atuais</Label>
                  <Textarea
                    id="supplements"
                    value={nutritionData.supplements}
                    onChange={(e) => setNutritionData({ ...nutritionData, supplements: e.target.value })}
                    placeholder="Liste os suplementos em uso..."
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Condições Médicas */}
            <div>
              <Label htmlFor="medicalConditions">Condições Médicas</Label>
              <Textarea
                id="medicalConditions"
                value={nutritionData.medicalConditions}
                onChange={(e) => setNutritionData({ ...nutritionData, medicalConditions: e.target.value })}
                placeholder="Diabetes, hipertensão, dislipidemia..."
              />
            </div>

            <Separator />

            {/* Objetivos */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Objetivos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="goals">Metas Nutricionais</Label>
                  <Textarea
                    id="goals"
                    value={nutritionData.goals}
                    onChange={(e) => setNutritionData({ ...nutritionData, goals: e.target.value })}
                    placeholder="Perda de peso, ganho de massa muscular..."
                  />
                </div>
                <div>
                  <Label htmlFor="timeframe">Prazo</Label>
                  <Input
                    id="timeframe"
                    value={nutritionData.timeframe}
                    onChange={(e) => setNutritionData({ ...nutritionData, timeframe: e.target.value })}
                    placeholder="6 meses"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Prescrição Nutricional */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Prescrição Nutricional</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="dailyCalories">Calorias Diárias (kcal)</Label>
                  <Input
                    id="dailyCalories"
                    value={nutritionData.dailyCalories}
                    onChange={(e) => setNutritionData({ ...nutritionData, dailyCalories: e.target.value })}
                    placeholder="2000"
                    type="number"
                  />
                </div>

                <div>
                  <h4 className="font-medium mb-2">Distribuição de Macronutrientes (%)</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="carbs">Carboidratos</Label>
                      <Input
                        id="carbs"
                        value={nutritionData.macroDistribution.carbs}
                        onChange={(e) => setNutritionData({
                          ...nutritionData,
                          macroDistribution: { ...nutritionData.macroDistribution, carbs: e.target.value }
                        })}
                        placeholder="50"
                        type="number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="proteins">Proteínas</Label>
                      <Input
                        id="proteins"
                        value={nutritionData.macroDistribution.proteins}
                        onChange={(e) => setNutritionData({
                          ...nutritionData,
                          macroDistribution: { ...nutritionData.macroDistribution, proteins: e.target.value }
                        })}
                        placeholder="25"
                        type="number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fats">Gorduras</Label>
                      <Input
                        id="fats"
                        value={nutritionData.macroDistribution.fats}
                        onChange={(e) => setNutritionData({
                          ...nutritionData,
                          macroDistribution: { ...nutritionData.macroDistribution, fats: e.target.value }
                        })}
                        placeholder="25"
                        type="number"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="mealPlan">Plano Alimentar</Label>
                  <Textarea
                    id="mealPlan"
                    value={nutritionData.mealPlan}
                    onChange={(e) => setNutritionData({ ...nutritionData, mealPlan: e.target.value })}
                    placeholder="Detalhe o plano alimentar com horários e porções..."
                    className="min-h-[120px]"
                  />
                </div>

                <div>
                  <Label htmlFor="supplementPrescription">Prescrição de Suplementos</Label>
                  <Textarea
                    id="supplementPrescription"
                    value={nutritionData.supplementPrescription}
                    onChange={(e) => setNutritionData({ ...nutritionData, supplementPrescription: e.target.value })}
                    placeholder="Suplementos recomendados e dosagens..."
                  />
                </div>

                <div>
                  <Label htmlFor="recommendations">Recomendações Gerais</Label>
                  <Textarea
                    id="recommendations"
                    value={nutritionData.recommendations}
                    onChange={(e) => setNutritionData({ ...nutritionData, recommendations: e.target.value })}
                    placeholder="Orientações sobre preparo de alimentos, timing nutricional..."
                  />
                </div>

                <div>
                  <Label htmlFor="followUpNotes">Observações para Retorno</Label>
                  <Textarea
                    id="followUpNotes"
                    value={nutritionData.followUpNotes}
                    onChange={(e) => setNutritionData({ ...nutritionData, followUpNotes: e.target.value })}
                    placeholder="Pontos a acompanhar no próximo retorno..."
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                Salvar Consulta
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default NutritionModal;