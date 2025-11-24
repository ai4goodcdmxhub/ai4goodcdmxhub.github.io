import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as glue from 'aws-cdk-lib/aws-glue';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

/**
 * Stack que define la infraestructura de ETL:
 * - Glue Jobs para transformar datos desde raw → cleaned
 * - Glue Jobs para agregar datos desde cleaned → curated
 * 
 * PATRÓN: Para añadir lógica de limpieza real:
 * 1. Crear scripts Python/Scala en S3 (o usar inline scripts)
 * 2. Actualizar los Glue Jobs para apuntar a esos scripts
 * 3. Implementar lógica de normalización (fechas, categorías, nulos, duplicados)
 */
export class ETLStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ETLStackProps) {
    super(scope, id, props);

    // ============================================
    // ROL IAM PARA GLUE JOBS
    // ============================================

    const glueJobRole = new iam.Role(this, 'GlueJobRole', {
      assumedBy: new iam.ServicePrincipal('glue.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSGlueServiceRole'),
      ],
    });

    // Permisos para leer desde raw y cleaned
    props.rawBucket.grantRead(glueJobRole);
    props.cleanedBucket.grantReadWrite(glueJobRole);
    props.curatedBucket.grantReadWrite(glueJobRole);

    // Permisos para acceder al Glue Catalog
    glueJobRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'glue:GetTable',
          'glue:GetTables',
          'glue:GetDatabase',
          'glue:CreateTable',
          'glue:UpdateTable',
        ],
        resources: [
          `arn:aws:glue:${this.region}:${this.account}:catalog`,
          `arn:aws:glue:${this.region}:${this.account}:database/${props.glueDatabase.ref}`,
          `arn:aws:glue:${this.region}:${this.account}:table/${props.glueDatabase.ref}/*`,
        ],
      })
    );

    // ============================================
    // GLUE JOB 1: LIMPIEZA (Raw → Cleaned)
    // ============================================

    // Script de ejemplo para el Glue Job de limpieza
    // En producción, este script debería estar en S3 o generarse dinámicamente
    const cleaningScript = `
# Glue Job: Raw to Cleaned Transformation
# 
# AQUÍ SE DEBE IMPLEMENTAR LA LÓGICA DE LIMPIEZA:
# - Normalización de fechas (formato estándar)
# - Estandarización de categorías (valores únicos, sin duplicados)
# - Manejo de valores nulos (imputación o eliminación según reglas de negocio)
# - Eliminación de duplicados
# - Validación de rangos y tipos de datos
# - Conversión a formato Parquet para optimización

import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job

args = getResolvedOptions(sys.argv, ['JOB_NAME', 'raw_bucket', 'cleaned_bucket', 'database_name'])

sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init(args['JOB_NAME'], args)

# Leer datos desde raw (ejemplo: tabla ENOE)
datasource = glueContext.create_dynamic_frame.from_catalog(
    database=args['database_name'],
    table_name='enoe_raw',  # Nombre de tabla inferida por el Crawler
    transformation_ctx='datasource'
)

# AQUÍ: Aplicar transformaciones de limpieza
# cleaned_data = ApplyMapping.apply(
#     frame=datasource,
#     mappings=[...],
#     transformation_ctx='cleaned_data'
# )

# Por ahora, solo copiamos los datos (stub)
cleaned_data = datasource

# Escribir a cleaned en formato Parquet
glueContext.write_dynamic_frame.from_options(
    frame=cleaned_data,
    connection_type='s3',
    connection_options={
        'path': f"s3://{args['cleaned_bucket']}/ENOE/",
        'partitionKeys': ['year', 'month']  # Particionar por año y mes
    },
    format='parquet',
    transformation_ctx='cleaned_output'
)

job.commit()
`;

    // Bucket temporal para almacenar scripts de Glue (o usar inline)
    // En producción, crear un bucket dedicado para scripts
    const scriptsBucket = new s3.Bucket(this, 'GlueScriptsBucket', {
      bucketName: `ai-youth-glue-scripts-${this.account}-${this.region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    scriptsBucket.grantRead(glueJobRole);

    // Glue Job de limpieza: Raw → Cleaned
    const cleaningJob = new glue.CfnJob(this, 'CleaningJob', {
      name: 'raw-to-cleaned-job',
      role: glueJobRole.roleArn,
      command: {
        name: 'glueetl',
        scriptLocation: `s3://${scriptsBucket.bucketName}/scripts/cleaning_job.py`,
        pythonVersion: '3',
      },
      defaultArguments: {
        '--raw_bucket': props.rawBucket.bucketName,
        '--cleaned_bucket': props.cleanedBucket.bucketName,
        '--database_name': props.glueDatabase.ref,
        '--TempDir': `s3://${scriptsBucket.bucketName}/temp/`,
        '--enable-metrics': 'true',
        '--enable-continuous-cloudwatch-log': 'true',
      },
      glueVersion: '4.0',
      maxRetries: 2,
      timeout: 60, // minutos
      allocatedCapacity: 2, // DPU (Data Processing Units)
      // En producción, considerar usar maxCapacity en lugar de allocatedCapacity
    });

    // ============================================
    // GLUE JOB 2: AGREGACIÓN (Cleaned → Curated)
    // ============================================

    const aggregationScript = `
# Glue Job: Cleaned to Curated Aggregation
#
# AQUÍ SE DEBE IMPLEMENTAR LA LÓGICA DE AGREGACIÓN:
# - Cálculo de indicadores (tasas, porcentajes, promedios)
# - Agregaciones por región, estado, municipio
# - Cálculo de índices compuestos (IADJ, IEED, IPA, etc.)
# - Unión de múltiples fuentes de datos

import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job

args = getResolvedOptions(sys.argv, ['JOB_NAME', 'cleaned_bucket', 'curated_bucket', 'database_name'])

sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init(args['JOB_NAME'], args)

# Leer datos desde cleaned
cleaned_data = glueContext.create_dynamic_frame.from_catalog(
    database=args['database_name'],
    table_name='enoe_cleaned',
    transformation_ctx='cleaned_data'
)

# AQUÍ: Aplicar agregaciones y cálculos de indicadores
# Ejemplo: Calcular tasa de desempleo juvenil por estado
# curated_data = cleaned_data.groupBy('estado', 'year', 'month').agg(
#     (sum('desempleados') / sum('poblacion_activa')) * 100 as 'tasa_desempleo'
# )

# Por ahora, solo copiamos los datos (stub)
curated_data = cleaned_data

# Escribir a curated en formato Parquet
glueContext.write_dynamic_frame.from_options(
    frame=curated_data,
    connection_type='s3',
    connection_options={
        'path': f"s3://{args['curated_bucket']}/indicators/",
        'partitionKeys': ['year', 'month', 'estado']
    },
    format='parquet',
    transformation_ctx='curated_output'
)

job.commit()
`;

    // Glue Job de agregación: Cleaned → Curated
    const aggregationJob = new glue.CfnJob(this, 'AggregationJob', {
      name: 'cleaned-to-curated-job',
      role: glueJobRole.roleArn,
      command: {
        name: 'glueetl',
        scriptLocation: `s3://${scriptsBucket.bucketName}/scripts/aggregation_job.py`,
        pythonVersion: '3',
      },
      defaultArguments: {
        '--cleaned_bucket': props.cleanedBucket.bucketName,
        '--curated_bucket': props.curatedBucket.bucketName,
        '--database_name': props.glueDatabase.ref,
        '--TempDir': `s3://${scriptsBucket.bucketName}/temp/`,
        '--enable-metrics': 'true',
        '--enable-continuous-cloudwatch-log': 'true',
      },
      glueVersion: '4.0',
      maxRetries: 2,
      timeout: 60,
      allocatedCapacity: 2,
    });

    // Subir los scripts a S3 (en producción, hacerlo via CI/CD)
    // Por ahora, los scripts están como strings inline
    // NOTA: En un setup real, estos scripts deberían estar en archivos .py
    // y subirse a S3 durante el despliegue

    // ============================================
    // PATRÓN PARA ORQUESTACIÓN
    // ============================================
    //
    // Para orquestar múltiples Glue Jobs en secuencia, se puede usar:
    // 1. Glue Workflows (aws-glue-alpha)
    // 2. Step Functions
    // 3. EventBridge para disparar Jobs después de que otros terminen
    //
    // Ejemplo con Glue Workflow:
    // const workflow = new glue.CfnWorkflow(this, 'ETLWorkflow', {
    //   name: 'etl-workflow',
    // });
    // workflow.addDependency(cleaningJob);
    // workflow.addDependency(aggregationJob);

    // ============================================
    // OUTPUTS
    // ============================================

    new cdk.CfnOutput(this, 'CleaningJobName', {
      value: cleaningJob.ref,
      description: 'Name of the cleaning Glue Job',
    });

    new cdk.CfnOutput(this, 'AggregationJobName', {
      value: aggregationJob.ref,
      description: 'Name of the aggregation Glue Job',
    });
  }
}

/**
 * Props para el ETLStack
 */
export interface ETLStackProps extends cdk.StackProps {
  rawBucket: s3.Bucket;
  cleanedBucket: s3.Bucket;
  curatedBucket: s3.Bucket;
  glueDatabase: glue.CfnDatabase;
}

