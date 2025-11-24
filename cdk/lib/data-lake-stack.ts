import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as glue from 'aws-cdk-lib/aws-glue';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

/**
 * Stack que define la infraestructura del Data Lake:
 * - Buckets S3 para zonas raw, cleaned y curated
 * - Glue Database para el catálogo de datos
 * - Glue Crawler básico para inferir esquemas desde la zona raw
 */
export class DataLakeStack extends cdk.Stack {
  public readonly rawBucket: s3.Bucket;
  public readonly cleanedBucket: s3.Bucket;
  public readonly curatedBucket: s3.Bucket;
  public readonly glueDatabase: glue.CfnDatabase;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ============================================
    // BUCKETS S3 - Zonas del Data Lake
    // ============================================

    // Bucket para zona RAW (aterrizaje de datos sin procesar)
    // IMPORTANTE: En producción, cambiar RemovalPolicy a RETAIN
    this.rawBucket = new s3.Bucket(this, 'RawBucket', {
      bucketName: `ai-youth-data-raw-${this.account}-${this.region}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Cambiar a RETAIN en producción
      autoDeleteObjects: true, // Solo para desarrollo
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    // Bucket para zona CLEANED (datos normalizados y limpios)
    this.cleanedBucket = new s3.Bucket(this, 'CleanedBucket', {
      bucketName: `ai-youth-data-cleaned-${this.account}-${this.region}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Cambiar a RETAIN en producción
      autoDeleteObjects: true, // Solo para desarrollo
    });

    // Bucket para zona CURATED (datos agregados y listos para análisis)
    this.curatedBucket = new s3.Bucket(this, 'CuratedBucket', {
      bucketName: `ai-youth-data-curated-${this.account}-${this.region}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Cambiar a RETAIN en producción
      autoDeleteObjects: true, // Solo para desarrollo
    });

    // ============================================
    // GLUE DATABASE
    // ============================================

    // Base de datos en Glue Catalog para organizar las tablas
    this.glueDatabase = new glue.CfnDatabase(this, 'GlueDatabase', {
      catalogId: this.account,
      databaseInput: {
        name: 'ia_youth_data_lake',
        description: 'Database for AI and Youth data lake tables',
      },
    });

    // ============================================
    // GLUE CRAWLER
    // ============================================

    // Rol IAM para el Crawler
    const crawlerRole = new iam.Role(this, 'GlueCrawlerRole', {
      assumedBy: new iam.ServicePrincipal('glue.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSGlueServiceRole'),
      ],
    });

    // Permisos para leer desde el bucket raw
    this.rawBucket.grantRead(crawlerRole);
    // Permisos para escribir en el Glue Catalog
    crawlerRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'glue:CreateTable',
          'glue:UpdateTable',
          'glue:DeleteTable',
          'glue:GetTable',
          'glue:GetTables',
          'glue:GetDatabase',
        ],
        resources: [
          `arn:aws:glue:${this.region}:${this.account}:catalog`,
          `arn:aws:glue:${this.region}:${this.account}:database/${this.glueDatabase.ref}`,
          `arn:aws:glue:${this.region}:${this.account}:table/${this.glueDatabase.ref}/*`,
        ],
      })
    );

    // Crawler básico que infiere esquemas desde la zona raw
    // Este crawler escanea el bucket raw y crea tablas en el Glue Catalog
    // PATRÓN: Para añadir más crawlers por fuente (ENOE, ENDUTIH, ANUIES, etc.),
    // crear nuevos CfnCrawler apuntando a prefijos específicos dentro del bucket raw
    const crawler = new glue.CfnCrawler(this, 'RawDataCrawler', {
      name: 'raw-data-crawler',
      role: crawlerRole.roleArn,
      databaseName: this.glueDatabase.ref,
      targets: {
        s3Targets: [
          {
            path: `s3://${this.rawBucket.bucketName}/ENOE/`,
            exclusions: ['**/_SUCCESS', '**/_temporary/**'],
          },
          // AQUÍ SE PUEDEN AÑADIR MÁS TARGETS:
          // { path: `s3://${this.rawBucket.bucketName}/ENDUTIH/` },
          // { path: `s3://${this.rawBucket.bucketName}/ANUIES/` },
        ],
      },
      schemaChangePolicy: {
        updateBehavior: 'UPDATE_IN_DATABASE',
        deleteBehavior: 'LOG',
      },
      recrawlPolicy: {
        recrawlBehavior: 'CRAWL_NEW_FOLDERS_ONLY',
      },
    });

    // El crawler depende de la base de datos
    crawler.addDependency(this.glueDatabase);

    // ============================================
    // OUTPUTS
    // ============================================

    new cdk.CfnOutput(this, 'RawBucketName', {
      value: this.rawBucket.bucketName,
      description: 'Name of the raw data S3 bucket',
    });

    new cdk.CfnOutput(this, 'CleanedBucketName', {
      value: this.cleanedBucket.bucketName,
      description: 'Name of the cleaned data S3 bucket',
    });

    new cdk.CfnOutput(this, 'CuratedBucketName', {
      value: this.curatedBucket.bucketName,
      description: 'Name of the curated data S3 bucket',
    });

    new cdk.CfnOutput(this, 'GlueDatabaseName', {
      value: this.glueDatabase.ref,
      description: 'Name of the Glue database',
    });
  }
}

