// src/services/bigquery.ts

import { BigQuery } from '@google-cloud/bigquery';

export const bigqueryClient = new BigQuery({
  projectId: process.env.BIGQUERY_PROJECT_ID,
  keyFilename: process.env.GOOGLE_BIGQUERY_APPLICATION_CREDENTIALS!,
});

console.log('BigQuery client initialized.');
console.log(`📊 BigQuery Project ID: ${process.env.BIGQUERY_PROJECT_ID}`);
console.log(`📊 Credentials file: ${process.env.GOOGLE_BIGQUERY_APPLICATION_CREDENTIALS}`);
