import React, { createContext, useContext, useState, ReactNode } from "react";

interface DateRange {
  startDate: string;
  endDate: string;
}

interface AnalyticsDateContextType {
  dateRange: DateRange;
  setDateRange: (dateRange: DateRange) => void;
  updateDateRange: (startDate: string, endDate: string) => void;
}

const AnalyticsDateContext = createContext<
  AnalyticsDateContextType | undefined
>(undefined);

interface AnalyticsDateProviderProps {
  children: ReactNode;
}

export const AnalyticsDateProvider: React.FC<AnalyticsDateProviderProps> = ({
  children,
}) => {
  // 기본 날짜 범위 계산 (어제부터 6일 전까지, 총 7일)
  const getDefaultDateRange = (): DateRange => {
    const today = new Date();
    // analytics가 일일 통계를 조회하므로 어제 날짜를 기준으로 계산
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    // 어제부터 6일 전까지 (총 7일)
    const sixDaysAgo = new Date(yesterday);
    sixDaysAgo.setDate(yesterday.getDate() - 6);

    return {
      endDate: yesterday.toISOString().split("T")[0],
      startDate: sixDaysAgo.toISOString().split("T")[0],
    };
  };

  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());

  const updateDateRange = (startDate: string, endDate: string) => {
    setDateRange({ startDate, endDate });
  };

  return (
    <AnalyticsDateContext.Provider
      value={{ dateRange, setDateRange, updateDateRange }}
    >
      {children}
    </AnalyticsDateContext.Provider>
  );
};

export const useAnalyticsDate = (): AnalyticsDateContextType => {
  const context = useContext(AnalyticsDateContext);
  if (context === undefined) {
    throw new Error(
      "useAnalyticsDate must be used within an AnalyticsDateProvider"
    );
  }
  return context;
};
