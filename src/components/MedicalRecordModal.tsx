import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Stethoscope, Save } from "lucide-react";

interface MedicalRecordModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  session: any;
}

const MedicalRecordModal = ({ isOpen, onOpenChange, session }: MedicalRecordModalProps) => {
  const [medicalData, setMedicalData] = useState({
    chiefComplaint: '',
    historyOfPresentIllness: '',
    pastMedicalHistory: '',
    allergies: '',
    currentMedications: '',
    vitalSigns: {
      bloodPressure: '',
      heartRate: '',
      temperature: '',
      weight: '',
      height: ''
    },
    physicalExamination: '',
    assessment: '',
    plan: '',
    followUp: ''
  });

  const handleSave = () => {
    // Aqui seria implementada a lógica para salvar no banco
    console.log('Salvando dados médicos:', medicalData);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-blue-500" />
            Prontuário Médico - {session?.title}
          </DialogTitle>
          <DialogDescription>
            Registre os dados da consulta médica e atualize o prontuário do paciente.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[75vh] pr-4">
          <div className="space-y-6">
            {/* Queixa Principal */}
            <div>
              <Label htmlFor="chiefComplaint">Queixa Principal</Label>
              <Textarea
                id="chiefComplaint"
                value={medicalData.chiefComplaint}
                onChange={(e) => setMedicalData({ ...medicalData, chiefComplaint: e.target.value })}
                placeholder="Descreva a queixa principal do paciente..."
                className="min-h-[80px]"
              />
            </div>

            {/* História da Doença Atual */}
            <div>
              <Label htmlFor="historyOfPresentIllness">História da Doença Atual</Label>
              <Textarea
                id="historyOfPresentIllness"
                value={medicalData.historyOfPresentIllness}
                onChange={(e) => setMedicalData({ ...medicalData, historyOfPresentIllness: e.target.value })}
                placeholder="Detalhe a evolução dos sintomas..."
                className="min-h-[100px]"
              />
            </div>

            {/* Antecedentes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pastMedicalHistory">Antecedentes Médicos</Label>
                <Textarea
                  id="pastMedicalHistory"
                  value={medicalData.pastMedicalHistory}
                  onChange={(e) => setMedicalData({ ...medicalData, pastMedicalHistory: e.target.value })}
                  placeholder="Doenças prévias, cirurgias..."
                />
              </div>
              <div>
                <Label htmlFor="allergies">Alergias</Label>
                <Textarea
                  id="allergies"
                  value={medicalData.allergies}
                  onChange={(e) => setMedicalData({ ...medicalData, allergies: e.target.value })}
                  placeholder="Alergias medicamentosas ou alimentares..."
                />
              </div>
            </div>

            {/* Medicações Atuais */}
            <div>
              <Label htmlFor="currentMedications">Medicações em Uso</Label>
              <Textarea
                id="currentMedications"
                value={medicalData.currentMedications}
                onChange={(e) => setMedicalData({ ...medicalData, currentMedications: e.target.value })}
                placeholder="Liste as medicações atuais e dosagens..."
              />
            </div>

            <Separator />

            {/* Sinais Vitais */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Sinais Vitais</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <Label htmlFor="bloodPressure">PA (mmHg)</Label>
                  <Input
                    id="bloodPressure"
                    value={medicalData.vitalSigns.bloodPressure}
                    onChange={(e) => setMedicalData({
                      ...medicalData,
                      vitalSigns: { ...medicalData.vitalSigns, bloodPressure: e.target.value }
                    })}
                    placeholder="120/80"
                  />
                </div>
                <div>
                  <Label htmlFor="heartRate">FC (bpm)</Label>
                  <Input
                    id="heartRate"
                    value={medicalData.vitalSigns.heartRate}
                    onChange={(e) => setMedicalData({
                      ...medicalData,
                      vitalSigns: { ...medicalData.vitalSigns, heartRate: e.target.value }
                    })}
                    placeholder="72"
                  />
                </div>
                <div>
                  <Label htmlFor="temperature">Temp (°C)</Label>
                  <Input
                    id="temperature"
                    value={medicalData.vitalSigns.temperature}
                    onChange={(e) => setMedicalData({
                      ...medicalData,
                      vitalSigns: { ...medicalData.vitalSigns, temperature: e.target.value }
                    })}
                    placeholder="36.5"
                  />
                </div>
                <div>
                  <Label htmlFor="weight">Peso (kg)</Label>
                  <Input
                    id="weight"
                    value={medicalData.vitalSigns.weight}
                    onChange={(e) => setMedicalData({
                      ...medicalData,
                      vitalSigns: { ...medicalData.vitalSigns, weight: e.target.value }
                    })}
                    placeholder="70"
                  />
                </div>
                <div>
                  <Label htmlFor="height">Altura (cm)</Label>
                  <Input
                    id="height"
                    value={medicalData.vitalSigns.height}
                    onChange={(e) => setMedicalData({
                      ...medicalData,
                      vitalSigns: { ...medicalData.vitalSigns, height: e.target.value }
                    })}
                    placeholder="170"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Exame Físico */}
            <div>
              <Label htmlFor="physicalExamination">Exame Físico</Label>
              <Textarea
                id="physicalExamination"
                value={medicalData.physicalExamination}
                onChange={(e) => setMedicalData({ ...medicalData, physicalExamination: e.target.value })}
                placeholder="Descreva os achados do exame físico..."
                className="min-h-[120px]"
              />
            </div>

            {/* Avaliação/Diagnóstico */}
            <div>
              <Label htmlFor="assessment">Avaliação/Diagnóstico</Label>
              <Textarea
                id="assessment"
                value={medicalData.assessment}
                onChange={(e) => setMedicalData({ ...medicalData, assessment: e.target.value })}
                placeholder="Hipóteses diagnósticas e avaliação clínica..."
                className="min-h-[80px]"
              />
            </div>

            {/* Plano de Tratamento */}
            <div>
              <Label htmlFor="plan">Plano de Tratamento</Label>
              <Textarea
                id="plan"
                value={medicalData.plan}
                onChange={(e) => setMedicalData({ ...medicalData, plan: e.target.value })}
                placeholder="Prescrições, exames solicitados, orientações..."
                className="min-h-[100px]"
              />
            </div>

            {/* Seguimento */}
            <div>
              <Label htmlFor="followUp">Seguimento</Label>
              <Textarea
                id="followUp"
                value={medicalData.followUp}
                onChange={(e) => setMedicalData({ ...medicalData, followUp: e.target.value })}
                placeholder="Próxima consulta, retorno, observações..."
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                Salvar Prontuário
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

export default MedicalRecordModal;