import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

/**
 * Stack que define la infraestructura de ingesta de datos:
 * - Lambda functions para descargar datos de fuentes externas
 * - EventBridge rules para ejecutar las Lambdas periódicamente
 * 
 * PATRÓN: Para añadir una nueva fuente de datos:
 * 1. Crear una nueva Lambda function (similar a enoeIngestionLambda)
 * 2. Crear una nueva regla de EventBridge que la ejecute
 * 3. Asegurarse de que la Lambda tenga permisos para escribir en el bucket raw
 */
export class IngestionStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: IngestionStackProps) {
    super(scope, id, props);

    // ============================================
    // LAMBDA DE INGESTA - ENOE (Ejemplo)
    // ============================================

    // Rol IAM para la Lambda de ingesta
    const ingestionRole = new iam.Role(this, 'IngestionLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Permisos para escribir en el bucket raw
    props.rawBucket.grantWrite(ingestionRole);

    // Lambda de ingesta de ENOE
    // Esta Lambda descarga datos desde una URL configurable y los sube al bucket raw
    const enoeIngestionLambda = new lambda.Function(this, 'EnoeIngestionLambda', {
      functionName: 'enoe-ingestion',
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../services/ingestion')),
      role: ingestionRole,
      timeout: cdk.Duration.minutes(15),
      memorySize: 512,
      environment: {
        RAW_BUCKET_NAME: props.rawBucket.bucketName,
        // URL de ejemplo - en producción, usar URLs reales de INEGI o configurarlas via Secrets Manager
        SOURCE_URL: process.env.ENOE_SOURCE_URL || 'https://www.inegi.org.mx/contenidos/programas/enoe/15ymas/datos/microdatos/enoe_n_2024_t1_csv.zip',
      },
    });

    // ============================================
    // EVENTBRIDGE RULE - Programación de ingesta
    // ============================================

    // Regla de EventBridge que ejecuta la Lambda de ingesta diariamente
    // Por defecto: todos los días a las 2:00 AM UTC
    // PATRÓN: Ajustar el cron según la frecuencia de actualización de cada fuente
    const ingestionSchedule = new events.Rule(this, 'EnoeIngestionSchedule', {
      ruleName: 'enoe-ingestion-schedule',
      description: 'Scheduled trigger for ENOE data ingestion',
      schedule: events.Schedule.cron({
        hour: '2',
        minute: '0',
        // Ajustar timezone según necesidad
      }),
    });

    // Conectar la regla con la Lambda
    ingestionSchedule.addTarget(new targets.LambdaFunction(enoeIngestionLambda));

    // ============================================
    // PATRÓN PARA AÑADIR MÁS FUENTES
    // ============================================
    // 
    // Ejemplo para añadir ingesta de ENDUTIH:
    // 
    // const endutihIngestionLambda = new lambda.Function(this, 'EndutihIngestionLambda', {
    //   functionName: 'endutih-ingestion',
    //   runtime: lambda.Runtime.PYTHON_3_11,
    //   handler: 'index.handler',
    //   code: lambda.Code.fromAsset(path.join(__dirname, '../../services/ingestion-endutih')),
    //   role: ingestionRole,
    //   environment: {
    //     RAW_BUCKET_NAME: props.rawBucket.bucketName,
    //     SOURCE_URL: 'https://...',
    //   },
    // });
    //
    // const endutihSchedule = new events.Rule(this, 'EndutihIngestionSchedule', {
    //   schedule: events.Schedule.cron({ hour: '3', minute: '0' }),
    // });
    // endutihSchedule.addTarget(new targets.LambdaFunction(endutihIngestionLambda));

    // ============================================
    // OUTPUTS
    // ============================================

    new cdk.CfnOutput(this, 'EnoeIngestionLambdaArn', {
      value: enoeIngestionLambda.functionArn,
      description: 'ARN of the ENOE ingestion Lambda function',
    });
  }
}

/**
 * Props para el IngestionStack
 */
export interface IngestionStackProps extends cdk.StackProps {
  rawBucket: s3.Bucket;
}

