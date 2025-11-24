#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DataLakeStack } from '../lib/data-lake-stack';
import { IngestionStack } from '../lib/ingestion-stack';
import { ETLStack } from '../lib/etl-stack';
import { ApiStack } from '../lib/api-stack';

const app = new cdk.App();

// Stack de Data Lake (S3, Glue Database, Crawler)
const dataLakeStack = new DataLakeStack(app, 'DataLakeStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'Data Lake infrastructure: S3 buckets, Glue Database and Crawler',
});

// Stack de Ingesta (Lambdas de ingesta + EventBridge)
const ingestionStack = new IngestionStack(app, 'IngestionStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  rawBucket: dataLakeStack.rawBucket,
  description: 'Data ingestion infrastructure: Lambda functions and EventBridge rules',
});

// Stack de ETL (Glue Jobs)
const etlStack = new ETLStack(app, 'ETLStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  rawBucket: dataLakeStack.rawBucket,
  cleanedBucket: dataLakeStack.cleanedBucket,
  curatedBucket: dataLakeStack.curatedBucket,
  glueDatabase: dataLakeStack.glueDatabase,
  description: 'ETL infrastructure: Glue Jobs for data transformation',
});

// Stack de API (Lambda backend + API Gateway)
const apiStack = new ApiStack(app, 'ApiStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  curatedBucket: dataLakeStack.curatedBucket,
  glueDatabase: dataLakeStack.glueDatabase,
  description: 'Backend API infrastructure: Lambda function and API Gateway',
});

// Dependencias entre stacks
ingestionStack.addDependency(dataLakeStack);
etlStack.addDependency(dataLakeStack);
apiStack.addDependency(dataLakeStack);

app.synth();

