import React from "react";
import { DatePicker, Space, Card } from "antd";
import dayjs from "dayjs";
import { useAnalyticsDate } from "@/contexts/AnalyticsDateContext";

const { RangePicker } = DatePicker;

const DateRangePicker: React.FC = () => {
  const { dateRange, updateDateRange } = useAnalyticsDate();

  const handleDateChange = (dates: any) => {
    if (dates && dates[0] && dates[1]) {
      const newStartDate = dates[0].format("YYYY-MM-DD");
      const newEndDate = dates[1].format("YYYY-MM-DD");
      updateDateRange(newStartDate, newEndDate);
    }
  };

  return (
    <Card style={{ marginBottom: "24px" }}>
      <Space>
        <span>기간 선택:</span>
        <RangePicker
          value={[dayjs(dateRange.startDate), dayjs(dateRange.endDate)]}
          onChange={handleDateChange}
          format="YYYY-MM-DD"
          allowClear={false}
        />
      </Space>
    </Card>
  );
};

export default DateRangePicker;
