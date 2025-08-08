import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, X } from "lucide-react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ChartDataPoint {
  date: string;
  [key: string]: number | string;
}

interface EnhancedPerformanceChartProps {
  selectedDataTypes: string[];
  onDataTypeRemove: (dataType: string) => void;
}

const dataTypeConfig = {
  steps: { label: "Passos", color: "#3b82f6", unit: "passos" },
  calories: { label: "Calorias", color: "#f59e0b", unit: "kcal" },
  heart_rate: { label: "Freq. Cardíaca", color: "#ef4444", unit: "bpm" },
  sleep: { label: "Sono", color: "#8b5cf6", unit: "horas" },
  water: { label: "Água", color: "#06b6d4", unit: "ml" },
  weight: { label: "Peso", color: "#eab308", unit: "kg" },
  height: { label: "Altura", color: "#22c55e", unit: "cm" },
  activity: { label: "Atividade", color: "#6366f1", unit: "min" },
  distance: { label: "Distância", color: "#14b8a6", unit: "m" }
};

export function EnhancedPerformanceChart({ selectedDataTypes, onDataTypeRemove }: EnhancedPerformanceChartProps) {
  const { user } = useAuth();
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("7");
  const [chartType, setChartType] = useState<"line" | "area">("area");

  const fetchChartData = async () => {
    if (!user || selectedDataTypes.length === 0) {
      setChartData([]);
      return;
    }

    setLoading(true);
    try {
      const days = parseInt(selectedPeriod);
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('athlete_data')
        .select('data_type, data, recorded_at')
        .eq('athlete_id', user.id)
        .in('data_type', selectedDataTypes)
        .gte('recorded_at', startDate.toISOString())
        .order('recorded_at', { ascending: true });

      if (error) {
        console.error('Error fetching chart data:', error);
        return;
      }

      // Group data by date and data type
      const dataByDate: Record<string, Record<string, number[]>> = {};

      data.forEach(record => {
        const date = new Date(record.recorded_at).toISOString().split('T')[0];
        const dataType = record.data_type;
        const value = typeof record.data === 'object' && record.data 
          ? (record.data as any).value || 0 
          : 0;

        if (!dataByDate[date]) {
          dataByDate[date] = {};
        }
        if (!dataByDate[date][dataType]) {
          dataByDate[date][dataType] = [];
        }
        dataByDate[date][dataType].push(value);
      });

      // Create chart data points with averages
      const chartPoints: ChartDataPoint[] = [];
      const sortedDates = Object.keys(dataByDate).sort();

      sortedDates.forEach(date => {
        const point: ChartDataPoint = { date };
        
        selectedDataTypes.forEach(dataType => {
          const values = dataByDate[date]?.[dataType] || [];
          if (values.length > 0) {
            // Calculate average for the day
            const average = values.reduce((sum, val) => sum + val, 0) / values.length;
            point[dataType] = Math.round(average * 100) / 100; // Round to 2 decimal places
          } else {
            point[dataType] = 0;
          }
        });

        chartPoints.push(point);
      });

      setChartData(chartPoints);
    } catch (error) {
      console.error('Error processing chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, [user, selectedDataTypes, selectedPeriod]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-sm mb-2">
            {formatDate(label)}
          </p>
          {payload.map((entry: any, index: number) => {
            const config = dataTypeConfig[entry.dataKey as keyof typeof dataTypeConfig];
            return (
              <div key={index} className="flex items-center gap-2 text-xs">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span>{config?.label}: {entry.value} {config?.unit}</span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Gráfico de Performance
            </CardTitle>
            <CardDescription>
              Acompanhe suas métricas nos últimos {selectedPeriod} dias
            </CardDescription>
          </div>
        </div>
        
        {/* Selected data types */}
        {selectedDataTypes.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedDataTypes.map(dataType => {
              const config = dataTypeConfig[dataType as keyof typeof dataTypeConfig];
              return (
                <Badge key={dataType} variant="secondary" className="flex items-center gap-1">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: config?.color }}
                  />
                  {config?.label}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => onDataTypeRemove(dataType)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              );
            })}
          </div>
        )}

        <div className="flex gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Período:</label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 dias</SelectItem>
                <SelectItem value="7">7 dias</SelectItem>
                <SelectItem value="14">14 dias</SelectItem>
                <SelectItem value="30">30 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Tipo:</label>
            <Select value={chartType} onValueChange={(value: "line" | "area") => setChartType(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="area">Área</SelectItem>
                <SelectItem value="line">Linha</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Carregando dados...</p>
            </div>
          </div>
        ) : selectedDataTypes.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">Selecione tipos de dados para visualizar</p>
              <p className="text-sm text-muted-foreground">
                Clique nos indicadores de dados para adicioná-los ao gráfico
              </p>
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">Nenhum dado encontrado</p>
              <p className="text-sm text-muted-foreground">
                Tente ajustar o período ou sincronizar mais dados
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            {chartType === "area" ? (
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                {selectedDataTypes.map((dataType, index) => {
                  const config = dataTypeConfig[dataType as keyof typeof dataTypeConfig];
                  return (
                    <Area
                      key={dataType}
                      type="monotone"
                      dataKey={dataType}
                      stroke={config?.color}
                      fill={config?.color}
                      fillOpacity={0.1 + (index * 0.1)}
                      strokeWidth={2}
                    />
                  );
                })}
              </AreaChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                {selectedDataTypes.map(dataType => {
                  const config = dataTypeConfig[dataType as keyof typeof dataTypeConfig];
                  return (
                    <Line
                      key={dataType}
                      type="monotone"
                      dataKey={dataType}
                      stroke={config?.color}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  );
                })}
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}