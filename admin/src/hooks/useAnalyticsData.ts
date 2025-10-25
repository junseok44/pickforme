import { useState, useEffect, useCallback, useRef } from "react";
import axios from "@/utils/axios";
import { useAnalyticsDate } from "@/contexts/AnalyticsDateContext";

interface UseAnalyticsDataOptions {
  endpoint: string;
  extractTodayData?: (trendData: any[]) => any;
}

export const useAnalyticsData = ({
  endpoint,
  extractTodayData,
}: UseAnalyticsDataOptions) => {
  const { dateRange, updateDateRange } = useAnalyticsDate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todayStats, setTodayStats] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>([]);

  // extractTodayData를 ref로 저장하여 무한 렌더링 방지
  const extractTodayDataRef = useRef(extractTodayData);
  extractTodayDataRef.current = extractTodayData;

  // 데이터 로드
  const loadData = useCallback(
    async (startDate: string, endDate: string) => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(endpoint, {
          params: { startDate, endDate },
        });
        console.log("🚀 ~ loadData ~ response:", response.data);

        if (response.data.success) {
          const data = response.data.data;
          setTrendData(data);

          // 오늘 데이터 추출
          if (extractTodayDataRef.current) {
            const todayData = extractTodayDataRef.current(data);
            setTodayStats(todayData);
          } else if (data.length > 0) {
            // 기본적으로 마지막 요소를 오늘 데이터로 사용
            setTodayStats(data[data.length - 1]);
          }
        }
      } catch (err) {
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
        console.error("Analytics data load error:", err);
      } finally {
        setLoading(false);
      }
    },
    [endpoint]
  );

  // 날짜 변경 핸들러
  const handleDateChange = (newStartDate: string, newEndDate: string) => {
    updateDateRange(newStartDate, newEndDate);
    loadData(newStartDate, newEndDate);
  };

  // 날짜 범위가 변경될 때마다 데이터 로드
  useEffect(() => {
    loadData(dateRange.startDate, dateRange.endDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange.startDate, dateRange.endDate]);

  return {
    loading,
    error,
    todayStats,
    trendData,
    dateRange,
    handleDateChange,
    reloadData: () => loadData(dateRange.startDate, dateRange.endDate),
  };
};
