import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface AthleteDataRecord {
  id: string;
  data_type: string;
  data: any;
  recorded_at: string;
  created_at: string;
}

interface ProcessedMetrics {
  sleep: number;
  heartRate: number;
  calories: number;
  water: number;
  training: number;
  recovery: number;
}

interface WeeklyData {
  day: string;
  calories: number;
  water: number;
  training: number;
}

interface PerformanceData {
  date: string;
  score: number;
  sleep: number;
  training: number;
}

export const useAthleteData = () => {
  const { user } = useAuth();
  const [athleteData, setAthleteData] = useState<AthleteDataRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [todaysMetrics, setTodaysMetrics] = useState<ProcessedMetrics>({
    sleep: 0,
    heartRate: 0,
    calories: 0,
    water: 0,
    training: 0,
    recovery: 0
  });
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);

  const fetchAthleteData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('athlete_data')
        .select('*')
        .eq('athlete_id', user.id)
        .order('recorded_at', { ascending: false });

      if (error) {
        console.error('Error fetching athlete data:', error);
        return;
      }

      setAthleteData(data || []);
      processData(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const processData = (data: AthleteDataRecord[]) => {
    // Process today's metrics
    const today = new Date().toDateString();
    const todayData = data.filter(record => 
      new Date(record.recorded_at).toDateString() === today
    );

    const processedToday: ProcessedMetrics = {
      sleep: getLatestValue(todayData, 'sleep') || 0,
      heartRate: getLatestValue(todayData, 'heart_rate') || 0,
      calories: getLatestValue(todayData, 'calories') || 0,
      water: getLatestValue(todayData, 'water') || 0,
      training: getLatestValue(todayData, 'training_duration') || 0,
      recovery: getLatestValue(todayData, 'recovery_score') || 0
    };

    setTodaysMetrics(processedToday);

    // Process weekly data
    const weeklyProcessed = processWeeklyData(data);
    setWeeklyData(weeklyProcessed);

    // Process performance data
    const performanceProcessed = processPerformanceData(data);
    setPerformanceData(performanceProcessed);
  };

  const getLatestValue = (data: AthleteDataRecord[], type: string): number => {
    const records = data
      .filter(record => record.data_type === type)
      .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());
    
    if (records.length === 0) return 0;
    
    const latestRecord = records[0];
    return typeof latestRecord.data === 'object' ? latestRecord.data.value || 0 : latestRecord.data || 0;
  };

  const processWeeklyData = (data: AthleteDataRecord[]): WeeklyData[] => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const weeklyData: WeeklyData[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayName = days[date.getDay()];
      const dateString = date.toDateString();

      const dayData = data.filter(record => 
        new Date(record.recorded_at).toDateString() === dateString
      );

      weeklyData.push({
        day: dayName,
        calories: getLatestValue(dayData, 'calories'),
        water: getLatestValue(dayData, 'water'),
        training: getLatestValue(dayData, 'training_duration')
      });
    }

    return weeklyData;
  };

  const processPerformanceData = (data: AthleteDataRecord[]): PerformanceData[] => {
    const performanceData: PerformanceData[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toDateString();
      const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;

      const dayData = data.filter(record => 
        new Date(record.recorded_at).toDateString() === dateString
      );

      const sleep = getLatestValue(dayData, 'sleep');
      const training = getLatestValue(dayData, 'training_duration') / 60; // Convert to hours
      const recovery = getLatestValue(dayData, 'recovery_score');
      
      // Calculate performance score based on available metrics
      let score = 0;
      let factors = 0;
      
      if (sleep > 0) {
        score += (sleep / 8) * 30; // Sleep contributes 30%
        factors++;
      }
      if (training > 0) {
        score += Math.min(training / 2, 1) * 40; // Training contributes 40%
        factors++;
      }
      if (recovery > 0) {
        score += (recovery / 100) * 30; // Recovery contributes 30%
        factors++;
      }
      
      // If no data, show 0, otherwise calculate average
      const finalScore = factors > 0 ? Math.round(score / factors * 100) : 0;

      performanceData.push({
        date: formattedDate,
        score: finalScore,
        sleep: sleep,
        training: training * 10 // Scale for chart display
      });
    }

    return performanceData;
  };

  useEffect(() => {
    fetchAthleteData();
  }, [user?.id]);

  return {
    athleteData,
    loading,
    todaysMetrics,
    weeklyData,
    performanceData,
    refetch: fetchAthleteData
  };
};