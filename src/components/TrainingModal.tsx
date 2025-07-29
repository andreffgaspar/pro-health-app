import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Plus, Trash2, Save, Calendar } from "lucide-react";

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight: string;
  restTime: string;
  notes: string;
}

interface TrainingModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  session: any;
  onEditSchedule?: (session: any) => void;
}

const TrainingModal = ({ isOpen, onOpenChange, session, onEditSchedule }: TrainingModalProps) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [trainingData, setTrainingData] = useState({
    objective: '',
    warmUp: '',
    coolDown: '',
    generalNotes: '',
    intensity: '',
    duration: ''
  });

  const addExercise = () => {
    const newExercise: Exercise = {
      id: Date.now().toString(),
      name: '',
      sets: 3,
      reps: '',
      weight: '',
      restTime: '',
      notes: ''
    };
    setExercises([...exercises, newExercise]);
  };

  const updateExercise = (id: string, field: keyof Exercise, value: any) => {
    setExercises(exercises.map(ex => 
      ex.id === id ? { ...ex, [field]: value } : ex
    ));
  };

  const removeExercise = (id: string) => {
    setExercises(exercises.filter(ex => ex.id !== id));
  };

  const handleSave = () => {
    console.log('Salvando dados do treino:', { trainingData, exercises });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-orange-500" />
            Plano de Treinamento - {session?.title}
          </DialogTitle>
          <DialogDescription>
            Configure os exercícios e detalhes do treino para o atleta.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[75vh] pr-4">
          <div className="space-y-6">
            {/* Dados Gerais do Treino */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="objective">Objetivo do Treino</Label>
                <Select 
                  value={trainingData.objective} 
                  onValueChange={(value) => setTrainingData({ ...trainingData, objective: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o objetivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strength">Força</SelectItem>
                    <SelectItem value="endurance">Resistência</SelectItem>
                    <SelectItem value="hypertrophy">Hipertrofia</SelectItem>
                    <SelectItem value="power">Potência</SelectItem>
                    <SelectItem value="conditioning">Condicionamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="intensity">Intensidade</Label>
                <Select 
                  value={trainingData.intensity} 
                  onValueChange={(value) => setTrainingData({ ...trainingData, intensity: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a intensidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="moderate">Moderada</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="very-high">Muito Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="duration">Duração Estimada (minutos)</Label>
              <Input
                id="duration"
                value={trainingData.duration}
                onChange={(e) => setTrainingData({ ...trainingData, duration: e.target.value })}
                placeholder="60"
                type="number"
              />
            </div>

            {/* Aquecimento */}
            <div>
              <Label htmlFor="warmUp">Aquecimento</Label>
              <Textarea
                id="warmUp"
                value={trainingData.warmUp}
                onChange={(e) => setTrainingData({ ...trainingData, warmUp: e.target.value })}
                placeholder="Descreva os exercícios de aquecimento..."
              />
            </div>

            <Separator />

            {/* Lista de Exercícios */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Exercícios</h3>
                <Button onClick={addExercise} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Exercício
                </Button>
              </div>

              <div className="space-y-4">
                {exercises.map((exercise, index) => (
                  <div key={exercise.id} className="p-4 border rounded-lg bg-muted/20">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline">Exercício {index + 1}</Badge>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => removeExercise(exercise.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="md:col-span-2">
                        <Label htmlFor={`exercise-name-${exercise.id}`}>Nome do Exercício</Label>
                        <Input
                          id={`exercise-name-${exercise.id}`}
                          value={exercise.name}
                          onChange={(e) => updateExercise(exercise.id, 'name', e.target.value)}
                          placeholder="Ex: Agachamento livre"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`exercise-sets-${exercise.id}`}>Séries</Label>
                        <Input
                          id={`exercise-sets-${exercise.id}`}
                          type="number"
                          value={exercise.sets}
                          onChange={(e) => updateExercise(exercise.id, 'sets', parseInt(e.target.value) || 0)}
                          placeholder="3"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`exercise-reps-${exercise.id}`}>Repetições</Label>
                        <Input
                          id={`exercise-reps-${exercise.id}`}
                          value={exercise.reps}
                          onChange={(e) => updateExercise(exercise.id, 'reps', e.target.value)}
                          placeholder="12 ou 30s"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`exercise-weight-${exercise.id}`}>Carga</Label>
                        <Input
                          id={`exercise-weight-${exercise.id}`}
                          value={exercise.weight}
                          onChange={(e) => updateExercise(exercise.id, 'weight', e.target.value)}
                          placeholder="80kg ou peso corporal"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`exercise-rest-${exercise.id}`}>Descanso</Label>
                        <Input
                          id={`exercise-rest-${exercise.id}`}
                          value={exercise.restTime}
                          onChange={(e) => updateExercise(exercise.id, 'restTime', e.target.value)}
                          placeholder="90s"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor={`exercise-notes-${exercise.id}`}>Observações</Label>
                      <Textarea
                        id={`exercise-notes-${exercise.id}`}
                        value={exercise.notes}
                        onChange={(e) => updateExercise(exercise.id, 'notes', e.target.value)}
                        placeholder="Técnica, progressão, cuidados especiais..."
                        rows={2}
                      />
                    </div>
                  </div>
                ))}

                {exercises.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum exercício adicionado</p>
                    <p className="text-sm">Clique em "Adicionar Exercício" para começar</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Volta à Calma */}
            <div>
              <Label htmlFor="coolDown">Volta à Calma</Label>
              <Textarea
                id="coolDown"
                value={trainingData.coolDown}
                onChange={(e) => setTrainingData({ ...trainingData, coolDown: e.target.value })}
                placeholder="Exercícios de alongamento e relaxamento..."
              />
            </div>

            {/* Observações Gerais */}
            <div>
              <Label htmlFor="generalNotes">Observações Gerais</Label>
              <Textarea
                id="generalNotes"
                value={trainingData.generalNotes}
                onChange={(e) => setTrainingData({ ...trainingData, generalNotes: e.target.value })}
                placeholder="Orientações gerais, progressões, cuidados especiais..."
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                Salvar Treino
              </Button>
              {onEditSchedule && (
                <Button 
                  variant="outline" 
                  onClick={() => onEditSchedule(session)}
                  className="flex-1"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Editar Agendamento
                </Button>
              )}
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

export default TrainingModal;