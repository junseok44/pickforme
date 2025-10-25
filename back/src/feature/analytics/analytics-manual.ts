import 'env';

import { handleFoundationEtlJobs, handleSummaryEtlJobs } from './analytics.handlers';

// 수동 실행 시 특정 날짜 지정 가능
const targetDate = process.argv[2]; // 첫 번째 인자로 날짜 전달 (예: npm run analytics-manual 2024-01-15)

console.log(
  `🚀 수동 ETL 실행 시작${targetDate ? ` - 대상 날짜: ${targetDate}` : ' - 기본 날짜 (3일 전)'}`
);

// Foundation ETL 실행
void handleFoundationEtlJobs(targetDate)
  .then(() => {
    console.log('✅ Foundation ETL 완료');

    // Summary ETL 실행
    return handleSummaryEtlJobs(targetDate);
  })
  .then(() => {
    console.log('✅ Summary ETL 완료');
    console.log('🎉 전체 ETL 파이프라인 완료');
  })
  .catch((error) => {
    console.error('❌ ETL 실행 실패:', error);
    process.exit(1);
  });
