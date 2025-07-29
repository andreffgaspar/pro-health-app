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
import { Heart, Plus, Trash2, Save, Calendar } from "lucide-react";

interface Treatment {
  id: string;
  technique: string;
  area: string;
  duration: string;
  intensity: string;
  observations: string;
}

interface PhysiotherapyModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  session: any;
  onEditSchedule?: (session: any) => void;
}

const PhysiotherapyModal = ({ isOpen, onOpenChange, session, onEditSchedule }: PhysiotherapyModalProps) => {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [physiotherapyData, setPhysiotherapyData] = useState({
    // Avaliação
    chiefComplaint: '',
    painLevel: '',
    painLocation: '',
    symptomHistory: '',
    previousTreatments: '',
    
    // Exame Físico
    posturalAssessment: '',
    rangeOfMotion: '',
    muscleStrength: '',
    functionalTests: '',
    palpation: '',
    specialTests: '',
    
    // Diagnóstico
    clinicalDiagnosis: '',
    functionalDiagnosis: '',
    
    // Objetivos
    shortTermGoals: '',
    longTermGoals: '',
    
    // Observações
    evolutionNotes: '',
    homeExercises: '',
    recommendations: '',
    nextSession: ''
  });

  const addTreatment = () => {
    const newTreatment: Treatment = {
      id: Date.now().toString(),
      technique: '',
      area: '',
      duration: '',
      intensity: '',
      observations: ''
    };
    setTreatments([...treatments, newTreatment]);
  };

  const updateTreatment = (id: string, field: keyof Treatment, value: string) => {
    setTreatments(treatments.map(tr => 
      tr.id === id ? { ...tr, [field]: value } : tr
    ));
  };

  const removeTreatment = (id: string) => {
    setTreatments(treatments.filter(tr => tr.id !== id));
  };

  const handleSave = () => {
    console.log('Salvando dados de fisioterapia:', { physiotherapyData, treatments });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              Atendimento Fisioterapêutico - {session?.title}
            </div>
            {onEditSchedule && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onEditSchedule(session)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Editar Agendamento
              </Button>
            )}
          </DialogTitle>
          <DialogDescription>
            Realize a avaliação fisioterapêutica e registre os tratamentos aplicados.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[75vh] pr-4">
          <div className="space-y-6">
            {/* Queixa Principal */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Avaliação Inicial</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="chiefComplaint">Queixa Principal</Label>
                  <Textarea
                    id="chiefComplaint"
                    value={physiotherapyData.chiefComplaint}
                    onChange={(e) => setPhysiotherapyData({ ...physiotherapyData, chiefComplaint: e.target.value })}
                    placeholder="Descreva a queixa principal do paciente..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="painLevel">Nível de Dor (0-10)</Label>
                    <Input
                      id="painLevel"
                      value={physiotherapyData.painLevel}
                      onChange={(e) => setPhysiotherapyData({ ...physiotherapyData, painLevel: e.target.value })}
                      placeholder="7"
                      type="number"
                      min="0"
                      max="10"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="painLocation">Localização da Dor</Label>
                    <Input
                      id="painLocation"
                      value={physiotherapyData.painLocation}
                      onChange={(e) => setPhysiotherapyData({ ...physiotherapyData, painLocation: e.target.value })}
                      placeholder="Lombar, cervical, joelho direito..."
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="symptomHistory">História dos Sintomas</Label>
                  <Textarea
                    id="symptomHistory"
                    value={physiotherapyData.symptomHistory}
                    onChange={(e) => setPhysiotherapyData({ ...physiotherapyData, symptomHistory: e.target.value })}
                    placeholder="Início dos sintomas, fatores desencadeantes, evolução..."
                  />
                </div>

                <div>
                  <Label htmlFor="previousTreatments">Tratamentos Anteriores</Label>
                  <Textarea
                    id="previousTreatments"
                    value={physiotherapyData.previousTreatments}
                    onChange={(e) => setPhysiotherapyData({ ...physiotherapyData, previousTreatments: e.target.value })}
                    placeholder="Fisioterapia, medicamentos, cirurgias anteriores..."
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Exame Físico */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Exame Físico</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="posturalAssessment">Avaliação Postural</Label>
                  <Textarea
                    id="posturalAssessment"
                    value={physiotherapyData.posturalAssessment}
                    onChange={(e) => setPhysiotherapyData({ ...physiotherapyData, posturalAssessment: e.target.value })}
                    placeholder="Observações sobre postura estática e dinâmica..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rangeOfMotion">Amplitude de Movimento</Label>
                    <Textarea
                      id="rangeOfMotion"
                      value={physiotherapyData.rangeOfMotion}
                      onChange={(e) => setPhysiotherapyData({ ...physiotherapyData, rangeOfMotion: e.target.value })}
                      placeholder="Limitações, compensações..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="muscleStrength">Força Muscular</Label>
                    <Textarea
                      id="muscleStrength"
                      value={physiotherapyData.muscleStrength}
                      onChange={(e) => setPhysiotherapyData({ ...physiotherapyData, muscleStrength: e.target.value })}
                      placeholder="Graus de força, desequilíbrios..."
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="functionalTests">Testes Funcionais</Label>
                  <Textarea
                    id="functionalTests"
                    value={physiotherapyData.functionalTests}
                    onChange={(e) => setPhysiotherapyData({ ...physiotherapyData, functionalTests: e.target.value })}
                    placeholder="Resultados de testes específicos aplicados..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="palpation">Palpação</Label>
                    <Textarea
                      id="palpation"
                      value={physiotherapyData.palpation}
                      onChange={(e) => setPhysiotherapyData({ ...physiotherapyData, palpation: e.target.value })}
                      placeholder="Pontos dolorosos, tensões, temperatura..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="specialTests">Testes Especiais</Label>
                    <Textarea
                      id="specialTests"
                      value={physiotherapyData.specialTests}
                      onChange={(e) => setPhysiotherapyData({ ...physiotherapyData, specialTests: e.target.value })}
                      placeholder="Testes ortopédicos específicos..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Diagnóstico */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Diagnóstico Fisioterapêutico</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clinicalDiagnosis">Diagnóstico Clínico</Label>
                  <Textarea
                    id="clinicalDiagnosis"
                    value={physiotherapyData.clinicalDiagnosis}
                    onChange={(e) => setPhysiotherapyData({ ...physiotherapyData, clinicalDiagnosis: e.target.value })}
                    placeholder="Diagnóstico baseado na avaliação..."
                  />
                </div>
                <div>
                  <Label htmlFor="functionalDiagnosis">Diagnóstico Funcional</Label>
                  <Textarea
                    id="functionalDiagnosis"
                    value={physiotherapyData.functionalDiagnosis}
                    onChange={(e) => setPhysiotherapyData({ ...physiotherapyData, functionalDiagnosis: e.target.value })}
                    placeholder="Limitações funcionais identificadas..."
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Objetivos */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Objetivos do Tratamento</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shortTermGoals">Objetivos Curto Prazo</Label>
                  <Textarea
                    id="shortTermGoals"
                    value={physiotherapyData.shortTermGoals}
                    onChange={(e) => setPhysiotherapyData({ ...physiotherapyData, shortTermGoals: e.target.value })}
                    placeholder="Metas para as próximas 2-4 semanas..."
                  />
                </div>
                <div>
                  <Label htmlFor="longTermGoals">Objetivos Longo Prazo</Label>
                  <Textarea
                    id="longTermGoals"
                    value={physiotherapyData.longTermGoals}
                    onChange={(e) => setPhysiotherapyData({ ...physiotherapyData, longTermGoals: e.target.value })}
                    placeholder="Metas finais do tratamento..."
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Tratamentos Aplicados */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Tratamentos Aplicados</h3>
                <Button onClick={addTreatment} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Tratamento
                </Button>
              </div>

              <div className="space-y-4">
                {treatments.map((treatment, index) => (
                  <div key={treatment.id} className="p-4 border rounded-lg bg-muted/20">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline">Tratamento {index + 1}</Badge>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => removeTreatment(treatment.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label htmlFor={`technique-${treatment.id}`}>Técnica</Label>
                        <Select 
                          value={treatment.technique} 
                          onValueChange={(value) => updateTreatment(treatment.id, 'technique', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a técnica" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manual-therapy">Terapia Manual</SelectItem>
                            <SelectItem value="electrotherapy">Eletroterapia</SelectItem>
                            <SelectItem value="ultrasound">Ultrassom</SelectItem>
                            <SelectItem value="laser">Laserterapia</SelectItem>
                            <SelectItem value="tens">TENS</SelectItem>
                            <SelectItem value="exercises">Exercícios</SelectItem>
                            <SelectItem value="stretching">Alongamentos</SelectItem>
                            <SelectItem value="heat-therapy">Termoterapia</SelectItem>
                            <SelectItem value="cold-therapy">Crioterapia</SelectItem>
                            <SelectItem value="massage">Massagem</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor={`area-${treatment.id}`}>Área Tratada</Label>
                        <Input
                          id={`area-${treatment.id}`}
                          value={treatment.area}
                          onChange={(e) => updateTreatment(treatment.id, 'area', e.target.value)}
                          placeholder="Ex: Lombar, Cervical, Joelho D"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label htmlFor={`duration-${treatment.id}`}>Duração</Label>
                        <Input
                          id={`duration-${treatment.id}`}
                          value={treatment.duration}
                          onChange={(e) => updateTreatment(treatment.id, 'duration', e.target.value)}
                          placeholder="15 min"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`intensity-${treatment.id}`}>Intensidade</Label>
                        <Select 
                          value={treatment.intensity} 
                          onValueChange={(value) => updateTreatment(treatment.id, 'intensity', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a intensidade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Baixa</SelectItem>
                            <SelectItem value="moderate">Moderada</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor={`observations-${treatment.id}`}>Observações</Label>
                      <Textarea
                        id={`observations-${treatment.id}`}
                        value={treatment.observations}
                        onChange={(e) => updateTreatment(treatment.id, 'observations', e.target.value)}
                        placeholder="Resposta do paciente, ajustes realizados..."
                        rows={2}
                      />
                    </div>
                  </div>
                ))}

                {treatments.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum tratamento registrado</p>
                    <p className="text-sm">Clique em "Adicionar Tratamento" para começar</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Exercícios e Orientações */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Orientações e Cuidados</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="homeExercises">Exercícios Domiciliares</Label>
                  <Textarea
                    id="homeExercises"
                    value={physiotherapyData.homeExercises}
                    onChange={(e) => setPhysiotherapyData({ ...physiotherapyData, homeExercises: e.target.value })}
                    placeholder="Exercícios para realizar em casa..."
                  />
                </div>

                <div>
                  <Label htmlFor="recommendations">Recomendações Gerais</Label>
                  <Textarea
                    id="recommendations"
                    value={physiotherapyData.recommendations}
                    onChange={(e) => setPhysiotherapyData({ ...physiotherapyData, recommendations: e.target.value })}
                    placeholder="Cuidados posturais, atividades a evitar..."
                  />
                </div>

                <div>
                  <Label htmlFor="evolutionNotes">Evolução do Quadro</Label>
                  <Textarea
                    id="evolutionNotes"
                    value={physiotherapyData.evolutionNotes}
                    onChange={(e) => setPhysiotherapyData({ ...physiotherapyData, evolutionNotes: e.target.value })}
                    placeholder="Melhoras observadas, resposta ao tratamento..."
                  />
                </div>

                <div>
                  <Label htmlFor="nextSession">Próxima Sessão</Label>
                  <Textarea
                    id="nextSession"
                    value={physiotherapyData.nextSession}
                    onChange={(e) => setPhysiotherapyData({ ...physiotherapyData, nextSession: e.target.value })}
                    placeholder="Planejamento para a próxima sessão..."
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                Salvar Atendimento
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

export default PhysiotherapyModal;