// src/features/analytics/analytics.service.ts

import fs from 'fs/promises';
import path from 'path';
import { bigqueryClient } from './bigquery/bigquery-client';
import { MetricJob } from './types/types';
import { TABLE_SCHEMAS } from './bigquery/table-schemas';
import { log } from '../../utils/logger/logger';

const PROJECT_ID = process.env.BIGQUERY_PROJECT_ID;
const RAW_DATASET = process.env.GA4_DATASET_RAW_ID; // 원본 GA4 데이터셋
const FOUNDATION_DATASET = process.env.GA4_DATASET_FOUNDATION_ID; // 중간 데이터셋 이름으로 변경

async function updateTableSchema(datasetId: string, tableName: string) {
  try {
    const dataset = bigqueryClient.dataset(datasetId, {
      location: 'asia-northeast3',
    });

    const table = dataset.table(tableName);
    const [exists] = await table.exists();

    if (!exists) {
      console.log(`Table ${datasetId}.${tableName} does not exist, skipping schema update`);
      return;
    }

    // 현재 테이블 스키마 가져오기
    const [metadata] = await table.getMetadata();
    const currentSchema = metadata.schema?.fields || [];
    const currentFieldNames = new Set(currentSchema.map((field: any) => field.name));

    // 새로운 스키마 정의
    const newSchema = TABLE_SCHEMAS[tableName];
    if (!newSchema) {
      console.log(`No schema definition found for table: ${tableName}`);
      return;
    }

    // 추가할 필드들 찾기
    const fieldsToAdd = newSchema.filter((field) => !currentFieldNames.has(field.name));

    if (fieldsToAdd.length === 0) {
      console.log(`✅ Table ${datasetId}.${tableName} schema is up to date`);
      return;
    }

    console.log(
      `🔄 Adding ${fieldsToAdd.length} new fields to ${datasetId}.${tableName}:`,
      fieldsToAdd.map((f) => f.name)
    );

    // ALTER TABLE 쿼리 생성
    const alterQueries = fieldsToAdd.map((field) => {
      const fieldType =
        field.type === 'FLOAT'
          ? 'FLOAT64'
          : field.type === 'INTEGER'
            ? 'INT64'
            : field.type === 'STRING'
              ? 'STRING'
              : field.type === 'DATE'
                ? 'DATE'
                : field.type === 'TIMESTAMP'
                  ? 'TIMESTAMP'
                  : field.type === 'BOOLEAN'
                    ? 'BOOL'
                    : field.type === 'JSON'
                      ? 'JSON'
                      : field.type;

      return `ADD COLUMN ${field.name} ${fieldType}`;
    });

    const alterQuery = `ALTER TABLE \`${PROJECT_ID}.${datasetId}.${tableName}\` ${alterQueries.join(', ')}`;

    console.log(`[DEBUG] ALTER TABLE query: ${alterQuery}`);

    // ALTER TABLE 실행
    const [queryJob] = await bigqueryClient.createQueryJob({
      query: alterQuery,
    });

    await queryJob.getQueryResults();
    console.log(`✅ Successfully updated schema for ${datasetId}.${tableName}`);
  } catch (error) {
    console.error(`❌ Failed to update schema for ${datasetId}.${tableName}:`, error);
    throw error;
  }
}

// 테이블 자동 생성 함수
async function ensureTableExists(datasetId: string, tableName: string) {
  try {
    const dataset = bigqueryClient.dataset(datasetId, {
      location: 'asia-northeast3',
    });

    const table = dataset.table(tableName);
    const [exists] = await table.exists();

    if (!exists) {
      const schema = TABLE_SCHEMAS[tableName];
      if (!schema) {
        throw new Error(`Schema not found for table: ${tableName}`);
      }

      await table.create({
        schema: schema,
        location: 'asia-northeast3',
      });
      console.log(`✅ Table ${datasetId}.${tableName} created automatically`);
    } else {
      await updateTableSchema(datasetId, tableName);
    }
  } catch (error) {
    console.error(`❌ Failed to create table ${datasetId}.${tableName}:`, error);
    throw error;
  }
}

// [변경] destinationDataset을 인자로 받도록 유지 (핸들러에서 제어)
export const runEtlJob = async (
  job: MetricJob,
  destinationDataset: string,
  targetDate?: string
) => {
  const queryParams = job.getQueryParams ? job.getQueryParams() : {};

  // targetDate가 제공되면 해당 날짜를 사용, 아니면 job의 기본값 사용
  if (targetDate) {
    queryParams.target_date = targetDate;
  }

  const jobDateForLog = queryParams.target_date || new Date().toISOString().split('T')[0];

  console.log(`[START] Running ETL job: ${job.name} for ${jobDateForLog}`);
  console.log(
    `[DEBUG] Environment variables: PROJECT_ID=${PROJECT_ID}, RAW_DATASET=${RAW_DATASET}, FOUNDATION_DATASET=${FOUNDATION_DATASET}`
  );

  try {
    // 테이블 자동 생성
    await ensureTableExists(destinationDataset, job.destinationTable);

    const queryPath = path.join(__dirname, `./queries/${job.sqlFile}`);
    const sqlTemplate = await fs.readFile(queryPath, 'utf-8');

    // 동적으로 테이블 경로 생성
    const destinationTablePath = `\`${PROJECT_ID}.${destinationDataset}.${job.destinationTable}\``;
    const rawEventsTablePath = `\`${PROJECT_ID}.${RAW_DATASET}.events_*\``;
    const foundationDatasetPath = `\`${PROJECT_ID}.${FOUNDATION_DATASET}\``; // foundation 테이블들을 참조할 때 사용

    // SQL 템플릿의 플레이스홀더 치환
    const sqlBody = sqlTemplate
      .replace(/{{- GA4_EVENTS_TABLE -}}/g, rawEventsTablePath)
      .replace(/{{- FOUNDATION_DATASET -}}/g, foundationDatasetPath)
      .replace(/{{- DESTINATION_TABLE -}}/g, destinationTablePath); // MERGE문에서 목적지 테이블을 참조할 때 사용

    let finalQuery = '';
    const disposition = job.writeDisposition || 'WRITE_APPEND'; // 기본값은 INSERT

    // [개선] Job에 정의된 writeDisposition에 따라 최종 쿼리 생성
    if (disposition === 'MERGE') {
      finalQuery = sqlBody; // MERGE문은 SQL 파일에 완성된 형태로 작성
    } else {
      // 'WRITE_APPEND' (기본값)
      finalQuery = `INSERT INTO ${destinationTablePath} ${sqlBody}`;
    }

    // 디버깅을 위한 로그 추가
    console.log(`[DEBUG] destinationTablePath: ${destinationTablePath}`);
    console.log(`[DEBUG] finalQuery: ${finalQuery.substring(0, 200)}...`);

    const [queryJob] = await bigqueryClient.createQueryJob({
      query: finalQuery,
      params: queryParams,
    });
    await queryJob.getQueryResults();
    console.log(`[SUCCESS] ETL job: ${job.name} completed.`);
  } catch (error) {
    console.error(`[FAIL] ETL job: ${job.name} failed. Details:`, error);
    throw error;
  }
};

/**
 * BigQuery 데이터 가용성 체크
 * 특정 날짜의 데이터가 있는지 확인 (기본값: 1일 전)
 */
export const checkDataAvailability = async (targetDate?: string): Promise<boolean> => {
  try {
    const checkDate =
      targetDate ||
      (() => {
        const date = new Date();
        date.setDate(date.getDate() - 1);

        return date.toISOString().split('T')[0];
      })();

    // checkDate를 YYYYMMDD 형식으로 변환 (2025-10-10 -> 20251010)
    const tableSuffix = checkDate.replace(/-/g, '');

    const query = `
      SELECT COUNT(*) as count
      FROM \`${PROJECT_ID}.${RAW_DATASET}.events_*\`
      WHERE _TABLE_SUFFIX = @tableSuffix
    `;

    const [rows] = await bigqueryClient.query({
      query,
      params: { tableSuffix },
    });

    const count = rows[0]?.count || 0;

    void log.info(
      `데이터 가용성 체크 완료 - KST ${checkDate} 이벤트 수: ${count}`,
      'ANALYTICS',
      'LOW',
      {
        count,
        checkDate,
        rawDataset: RAW_DATASET,
      }
    );

    return count > 0;
  } catch (error) {
    void log.error('데이터 가용성 체크 실패', 'ANALYTICS', 'MEDIUM', {
      error: error instanceof Error ? error.message : 'Unknown error',
      targetDate,
      rawDataset: RAW_DATASET,
    });
    return false;
  }
};
