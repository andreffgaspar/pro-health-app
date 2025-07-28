import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Calendar,
  Activity,
  Heart,
  Moon,
  Utensils,
  Stethoscope,
  UserMinus,
  TrendingUp,
  Filter,
  Download,
  Eye,
  Trash2,
  Clock,
  ArrowUpDown,
  ChevronRight,
  FileText
} from "lucide-react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AthleteDataRecord {
  id: string;
  data_type: string;
  data: any;
  recorded_at: string;
  created_at: string;
}

interface DataVisualizationProps {
  trigger?: React.ReactNode;
}

const DataVisualization = ({ trigger }: DataVisualizationProps) => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [athleteData, setAthleteData] = useState<AthleteDataRecord[]>([]);
  const [filteredData, setFilteredData] = useState<AthleteDataRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<AthleteDataRecord | null>(null);
  const [showRecordDialog, setShowRecordDialog] = useState(false);

  // Filters
  const [dateFilter, setDateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');

  const dataTypes = [
    { value: 'sleep', label: 'Sono', icon: Moon, color: 'blue' },
    { value: 'nutrition', label: 'Nutrição', icon: Utensils, color: 'orange' },
    { value: 'training', label: 'Treino', icon: Activity, color: 'green' },
    { value: 'physiotherapy', label: 'Fisioterapia', icon: UserMinus, color: 'purple' },
    { value: 'medical', label: 'Médico', icon: Stethoscope, color: 'red' },
    { value: 'vitals', label: 'Vitais', icon: Heart, color: 'pink' }
  ];

  useEffect(() => {
    if (open && user) {
      fetchAthleteData();
    }
  }, [open, user]);

  useEffect(() => {
    applyFilters();
  }, [athleteData, dateFilter, typeFilter, sortBy]);

  const fetchAthleteData = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('athlete_data')
        .select('*')
        .eq('athlete_id', user?.id)
        .order('recorded_at', { ascending: false });

      if (error) throw error;
      
      setAthleteData(data || []);
    } catch (error) {
      console.error('Error fetching athlete data:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...athleteData];

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(record => record.data_type === typeFilter);
    }

    // Filter by date
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.recorded_at);
        return recordDate.toDateString() === filterDate.toDateString();
      });
    }

    // Sort
    filtered.sort((a, b) => {
      const dateA = new Date(a.recorded_at);
      const dateB = new Date(b.recorded_at);
      
      if (sortBy === 'date_desc') return dateB.getTime() - dateA.getTime();
      if (sortBy === 'date_asc') return dateA.getTime() - dateB.getTime();
      if (sortBy === 'type') return a.data_type.localeCompare(b.data_type);
      
      return 0;
    });

    setFilteredData(filtered);
  };

  const deleteRecord = async (recordId: string) => {
    try {
      const { error } = await supabase
        .from('athlete_data')
        .delete()
        .eq('id', recordId);

      if (error) throw error;

      toast({
        title: "Registro removido",
        description: "O registro foi removido com sucesso."
      });

      setAthleteData(prev => prev.filter(record => record.id !== recordId));
    } catch (error) {
      console.error('Error deleting record:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o registro.",
        variant: "destructive"
      });
    }
  };

  const getDataTypeInfo = (type: string) => {
    return dataTypes.find(dt => dt.value === type) || dataTypes[0];
  };

  const formatRecordSummary = (record: AthleteDataRecord) => {
    const { data, data_type } = record;
    
    switch (data_type) {
      case 'sleep':
        return `${data.hours || 0}h de sono • Qualidade: ${data.quality || 'N/A'}`;
      case 'nutrition':
        return `${data.calories || 0} kcal • ${data.protein || 0}g proteína`;
      case 'training':
        return `${data.type || 'Treino'} • ${data.duration || 0} min • ${data.intensity || 'N/A'}`;
      case 'physiotherapy':
        return `${data.sessionType || 'Sessão'} • Dor: ${data.painLevel || 0}/10`;
      case 'medical':
        return `${data.appointmentType || 'Consulta'} • Dr. ${data.doctorName || 'N/A'}`;
      case 'vitals':
        return `FC: ${data.heartRate || 0} bpm • Peso: ${data.weight || 0} kg`;
      default:
        return 'Dados registrados';
    }
  };

  const generateChartData = () => {
    if (typeFilter === 'all') return [];
    
    const relevantData = filteredData
      .filter(record => record.data_type === typeFilter)
      .slice(0, 7)
      .reverse();

    return relevantData.map(record => {
      const date = new Date(record.recorded_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit'
      });

      let value = 0;
      switch (typeFilter) {
        case 'sleep':
          value = parseFloat(record.data.hours) || 0;
          break;
        case 'nutrition':
          value = parseFloat(record.data.calories) || 0;
          break;
        case 'training':
          value = parseFloat(record.data.duration) || 0;
          break;
        case 'vitals':
          value = parseFloat(record.data.heartRate) || 0;
          break;
        default:
          value = Math.random() * 100;
      }

      return { date, value };
    });
  };

  const defaultTrigger = (
    <Button variant="outline" className="gap-2">
      <Eye className="w-4 h-4" />
      Ver Dados Salvos
    </Button>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || defaultTrigger}
        </DialogTrigger>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Visualização de Dados de Performance e Saúde
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="records">Registros</TabsTrigger>
              <TabsTrigger value="analytics">Análises</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {dataTypes.map((type) => {
                  const count = athleteData.filter(record => record.data_type === type.value).length;
                  const Icon = type.icon;
                  
                  return (
                    <Card key={type.value} className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 bg-${type.color}-500/10 rounded-lg flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 text-${type.color}-500`} />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{type.label}</p>
                          <p className="text-lg font-bold">{count} registros</p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Recent Records */}
              <Card>
                <CardHeader>
                  <CardTitle>Registros Recentes</CardTitle>
                  <CardDescription>Últimos 5 dados registrados</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filteredData.slice(0, 5).map((record) => {
                      const typeInfo = getDataTypeInfo(record.data_type);
                      const Icon = typeInfo.icon;
                      
                      return (
                        <div 
                          key={record.id} 
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => {
                            setSelectedRecord(record);
                            setShowRecordDialog(true);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 bg-${typeInfo.color}-500/10 rounded-lg flex items-center justify-center`}>
                              <Icon className={`w-4 h-4 text-${typeInfo.color}-500`} />
                            </div>
                            <div>
                              <p className="font-medium">{typeInfo.label}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatRecordSummary(record)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              {new Date(record.recorded_at).toLocaleDateString('pt-BR')}
                            </p>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="records" className="space-y-4">
              {/* Filters */}
              <Card className="p-4">
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    <span className="text-sm font-medium">Filtros:</span>
                  </div>
                  
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      {dataTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-40"
                  />

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Ordenar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date_desc">Mais recentes</SelectItem>
                      <SelectItem value="date_asc">Mais antigos</SelectItem>
                      <SelectItem value="type">Por tipo</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDateFilter('');
                      setTypeFilter('all');
                      setSortBy('date_desc');
                    }}
                  >
                    Limpar
                  </Button>
                </div>
              </Card>

              {/* Records List */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Todos os Registros</CardTitle>
                      <CardDescription>
                        {filteredData.length} registro(s) encontrado(s)
                      </CardDescription>
                    </div>
                    {filteredData.length > 0 && (
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Exportar
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {loading ? (
                      <div className="text-center py-8">Carregando...</div>
                    ) : filteredData.length > 0 ? (
                      <div className="space-y-3">
                        {filteredData.map((record) => {
                          const typeInfo = getDataTypeInfo(record.data_type);
                          const Icon = typeInfo.icon;
                          
                          return (
                            <div 
                              key={record.id} 
                              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 bg-${typeInfo.color}-500/10 rounded-lg flex items-center justify-center`}>
                                  <Icon className={`w-5 h-5 text-${typeInfo.color}-500`} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium">{typeInfo.label}</h4>
                                    <Badge variant="outline" className="text-xs">
                                      {new Date(record.recorded_at).toLocaleDateString('pt-BR')}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {formatRecordSummary(record)}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {record.data_type === 'medical' && record.data?.attachments && record.data.attachments.length > 0 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={async () => {
                                      const attachment = record.data.attachments[0];
                                      const { data, error } = await supabase.storage
                                        .from('medical-files')
                                        .createSignedUrl(attachment, 60 * 60); // 1 hora de validade
                                      
                                      if (error) {
                                        console.error('Erro ao gerar URL:', error);
                                        return;
                                      }
                                      
                                      window.open(data.signedUrl, '_blank');
                                    }}
                                    title="Visualizar arquivo anexado"
                                  >
                                    <FileText className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedRecord(record);
                                    setShowRecordDialog(true);
                                  }}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteRecord(record.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhum registro encontrado</p>
                        <p className="text-sm">Comece registrando seus dados de performance e saúde</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              {/* Chart */}
              {typeFilter !== 'all' && generateChartData().length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Evolução - {getDataTypeInfo(typeFilter).label}</CardTitle>
                    <CardDescription>
                      Últimos 7 registros
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={generateChartData()}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke="hsl(var(--primary))" 
                          fill="hsl(var(--primary))" 
                          fillOpacity={0.2}
                          strokeWidth={3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Analytics Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Resumo Analítico</CardTitle>
                  <CardDescription>Estatísticas dos seus dados</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Análises avançadas em desenvolvimento</p>
                    <p className="text-sm">Em breve você terá insights detalhados sobre seus dados</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Record Details Dialog */}
      <Dialog open={showRecordDialog} onOpenChange={setShowRecordDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedRecord && (
                <div className="flex items-center gap-2">
                  {(() => {
                    const typeInfo = getDataTypeInfo(selectedRecord.data_type);
                    const Icon = typeInfo.icon;
                    return <Icon className={`w-5 h-5 text-${typeInfo.color}-500`} />;
                  })()}
                  Detalhes - {selectedRecord && getDataTypeInfo(selectedRecord.data_type).label}
                </div>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedRecord && (
            <div className="space-y-4">
              {/* Record info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Data do Registro</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedRecord.recorded_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Tipo</p>
                  <p className="text-sm text-muted-foreground">
                    {getDataTypeInfo(selectedRecord.data_type).label}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Data details */}
              <div className="space-y-3">
                <h4 className="font-medium">Dados Registrados</h4>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <pre className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(selectedRecord.data, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DataVisualization;