import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayIntegrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as glue from 'aws-cdk-lib/aws-glue';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

/**
 * Stack que define la infraestructura del Backend API:
 * - Lambda function que servirá como backend API
 * - API Gateway HTTP API para exponer endpoints
 * 
 * PATRÓN: Para conectar con Athena o Redshift:
 * 1. Añadir permisos IAM a la Lambda para consultar Athena/Redshift
 * 2. Usar boto3 (Python) o AWS SDK (Node.js) para ejecutar queries
 * 3. Implementar endpoints que consulten las tablas curated
 * 4. Retornar JSON con los indicadores calculados
 */
export class ApiStack extends cdk.Stack {
  public readonly apiEndpoint: string;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // ============================================
    // LAMBDA BACKEND API
    // ============================================

    // Rol IAM para la Lambda del backend
    const apiRole = new iam.Role(this, 'ApiLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Permisos para leer desde el bucket curated
    props.curatedBucket.grantRead(apiRole);

    // Permisos para consultar Glue Catalog (necesario para Athena)
    apiRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'glue:GetTable',
          'glue:GetTables',
          'glue:GetDatabase',
          'glue:GetPartitions',
        ],
        resources: [
          `arn:aws:glue:${this.region}:${this.account}:catalog`,
          `arn:aws:glue:${this.region}:${this.account}:database/${props.glueDatabase.ref}`,
          `arn:aws:glue:${this.region}:${this.account}:table/${props.glueDatabase.ref}/*`,
        ],
      })
    );

    // Permisos para consultar Athena (cuando se implemente)
    // apiRole.addToPolicy(
    //   new iam.PolicyStatement({
    //     effect: iam.Effect.ALLOW,
    //     actions: [
    //       'athena:StartQueryExecution',
    //       'athena:GetQueryExecution',
    //       'athena:GetQueryResults',
    //       'athena:StopQueryExecution',
    //     ],
    //     resources: ['*'],
    //   })
    // );

    // Lambda del backend API
    const apiLambda = new lambda.Function(this, 'ApiLambda', {
      functionName: 'ai-youth-api',
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../services/backend-api')),
      role: apiRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        CURATED_BUCKET_NAME: props.curatedBucket.bucketName,
        GLUE_DATABASE_NAME: props.glueDatabase.ref,
        AWS_REGION: this.region,
        // En producción, añadir variables para Athena workgroup, etc.
        // ATHENA_WORKGROUP: 'ai-youth-workgroup',
      },
    });

    // ============================================
    // API GATEWAY HTTP API
    // ============================================

    // Integración Lambda para API Gateway
    const lambdaIntegration = new apigatewayIntegrations.HttpLambdaIntegration(
      'LambdaIntegration',
      apiLambda
    );

    // API Gateway HTTP API
    const httpApi = new apigateway.HttpApi(this, 'HttpApi', {
      apiName: 'ai-youth-api',
      description: 'Backend API for AI and Youth data platform',
      corsPreflight: {
        allowOrigins: ['*'], // En producción, restringir a dominios específicos
        allowMethods: [apigateway.CorsHttpMethod.GET, apigateway.CorsHttpMethod.POST],
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    // Endpoint de health check
    httpApi.addRoutes({
      path: '/health',
      methods: [apigateway.HttpMethod.GET],
      integration: lambdaIntegration,
    });

    // Endpoint de ejemplo para obtener indicadores
    // PATRÓN: Añadir más endpoints según necesidad
    // Ejemplo: /api/v1/indicators/tasa-desempleo-juvenil?estado=CDMX&year=2024
    httpApi.addRoutes({
      path: '/api/v1/indicators',
      methods: [apigateway.HttpMethod.GET],
      integration: lambdaIntegration,
    });

    // ============================================
    // OUTPUTS
    // ============================================

    this.apiEndpoint = httpApi.url!;

    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: this.apiEndpoint,
      description: 'URL of the API Gateway HTTP API',
    });

    new cdk.CfnOutput(this, 'ApiLambdaArn', {
      value: apiLambda.functionArn,
      description: 'ARN of the API Lambda function',
    });
  }
}

/**
 * Props para el ApiStack
 */
export interface ApiStackProps extends cdk.StackProps {
  curatedBucket: s3.Bucket;
  glueDatabase: glue.CfnDatabase;
}

