export interface MetricJob {
  name: string; // 작업 이름 (로그용)
  sqlFile?: string; // 실행할 SQL 파일 이름
  destinationTable: string; // 결과를 저장할 테이블
  getQueryParams?: () => Record<string, string>; // 쿼리 파라미터를 동적으로 생성하는 함수
  writeDisposition?: 'WRITE_APPEND' | 'MERGE'; // 쿼리 실행 방식
  type?: 'sql' | 'mongodb_sync'; // 작업 타입
  collection?: string; // MongoDB 컬렉션 이름 (mongodb_sync 타입일 때)
}
