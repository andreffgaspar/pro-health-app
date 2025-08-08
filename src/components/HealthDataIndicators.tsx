import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Heart, Moon, Droplets, Zap, Scale, Ruler, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface DataTypeCount {
  dataType: string;
  count: number;
  lastRecorded?: string;
}

interface HealthDataIndicatorsProps {
  onDataTypeSelect?: (dataType: string) => void;
  selectedDataTypes?: string[];
}

const dataTypeConfig = {
  steps: { icon: Activity, label: "Passos", color: "bg-blue-500/10 text-blue-500" },
  calories: { icon: Zap, label: "Calorias", color: "bg-orange-500/10 text-orange-500" },
  heart_rate: { icon: Heart, label: "Freq. Cardíaca", color: "bg-red-500/10 text-red-500" },
  sleep: { icon: Moon, label: "Sono", color: "bg-purple-500/10 text-purple-500" },
  water: { icon: Droplets, label: "Água", color: "bg-cyan-500/10 text-cyan-500" },
  weight: { icon: Scale, label: "Peso", color: "bg-yellow-500/10 text-yellow-500" },
  height: { icon: Ruler, label: "Altura", color: "bg-green-500/10 text-green-500" },
  activity: { icon: Target, label: "Atividade", color: "bg-indigo-500/10 text-indigo-500" },
  distance: { icon: Activity, label: "Distância", color: "bg-teal-500/10 text-teal-500" }
};

export function HealthDataIndicators({ onDataTypeSelect, selectedDataTypes = [] }: HealthDataIndicatorsProps) {
  const { user } = useAuth();
  const [dataTypeCounts, setDataTypeCounts] = useState<DataTypeCount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDataTypeCounts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('athlete_data')
        .select('data_type, created_at')
        .eq('athlete_id', user.id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching data type counts:', error);
        return;
      }

      // Group by data type and count
      const counts = data.reduce((acc, record) => {
        const dataType = record.data_type;
        if (!acc[dataType]) {
          acc[dataType] = { count: 0, lastRecorded: record.created_at };
        }
        acc[dataType].count += 1;
        return acc;
      }, {} as Record<string, { count: number; lastRecorded: string }>);

      const formattedCounts = Object.entries(counts).map(([dataType, info]) => ({
        dataType,
        count: info.count,
        lastRecorded: info.lastRecorded
      }));

      setDataTypeCounts(formattedCounts);
    } catch (error) {
      console.error('Error fetching data type counts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataTypeCounts();
  }, [user]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dados Registrados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-20">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (dataTypeCounts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dados Registrados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>Nenhum dado registrado nos últimos 30 dias</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Agora mesmo';
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Ontem';
    return `${diffInDays} dias atrás`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados Registrados</CardTitle>
        <p className="text-sm text-muted-foreground">
          Últimos 30 dias • Clique para adicionar ao gráfico
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {dataTypeCounts.map(({ dataType, count, lastRecorded }) => {
            const config = dataTypeConfig[dataType as keyof typeof dataTypeConfig];
            if (!config) return null;

            const Icon = config.icon;
            const isSelected = selectedDataTypes.includes(dataType);

            return (
              <div
                key={dataType}
                className={`
                  p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md
                  ${isSelected 
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                    : 'border-border hover:border-primary/50'
                  }
                `}
                onClick={() => onDataTypeSelect?.(dataType)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{config.label}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <Badge variant="secondary" className="text-xs">
                    {count} registros
                  </Badge>
                  {lastRecorded && (
                    <p className="text-xs text-muted-foreground">
                      {formatDate(lastRecorded)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}