# Glue Job: Cleaned to Curated Aggregation
#
# Este script agrega datos desde la zona cleaned y calcula indicadores para la zona curated.
#
# LÓGICA DE AGREGACIÓN A IMPLEMENTAR:
# - Cálculo de indicadores (tasas, porcentajes, promedios)
# - Agregaciones por región, estado, municipio
# - Cálculo de índices compuestos (IADJ, IEED, IPA, etc.)
# - Unión de múltiples fuentes de datos
# - Cálculo de métricas derivadas

import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job
from pyspark.sql.functions import col, sum, avg, count, when, round

args = getResolvedOptions(sys.argv, ['JOB_NAME', 'cleaned_bucket', 'curated_bucket', 'database_name'])

sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init(args['JOB_NAME'], args)

# Leer datos desde cleaned
# NOTA: Ajustar el nombre de la tabla según lo que exista en el catálogo
try:
    cleaned_data = glueContext.create_dynamic_frame.from_catalog(
        database=args['database_name'],
        table_name='enoe_cleaned',  # Tabla creada por el job de limpieza
        transformation_ctx='cleaned_data'
    )
except Exception as e:
    print(f"Error al leer desde catálogo: {e}")
    print("Intentando leer directamente desde S3...")
    # Fallback: leer directamente desde S3
    cleaned_data = glueContext.create_dynamic_frame.from_options(
        connection_type='s3',
        connection_options={
            'paths': [f"s3://{args['cleaned_bucket']}/ENOE/"],
            'recurse': True
        },
        format='parquet',
        transformation_ctx='cleaned_data'
    )

# Convertir a DataFrame de Spark
df = cleaned_data.toDF()

# AQUÍ: Aplicar agregaciones y cálculos de indicadores
# Ejemplo: Calcular tasa de desempleo juvenil por estado
# 
# NOTA: Ajustar estas transformaciones según el esquema real de los datos
# y las variables que se quieran calcular

# Ejemplo de agregación (ajustar columnas según esquema real):
# curated_df = df.filter(col('edad') >= 18).filter(col('edad') <= 30) \
#     .groupBy('estado', 'year', 'month') \
#     .agg(
#         count('*').alias('total_jovenes'),
#         sum(when(col('desempleado') == 1, 1).otherwise(0)).alias('desempleados'),
#         sum(when(col('desempleado') == 0, 1).otherwise(0)).alias('empleados')
#     ) \
#     .withColumn(
#         'tasa_desempleo_juvenil',
#         round((col('desempleados') / col('total_jovenes')) * 100, 2)
#     )

# Por ahora, solo copiamos los datos (stub - implementar lógica real)
curated_df = df

# Convertir de vuelta a DynamicFrame
curated_data = DynamicFrame.fromDF(curated_df, glueContext, 'curated_data')

# Escribir a curated en formato Parquet
glueContext.write_dynamic_frame.from_options(
    frame=curated_data,
    connection_type='s3',
    connection_options={
        'path': f"s3://{args['curated_bucket']}/indicators/",
        'partitionKeys': ['year', 'month', 'estado']  # Particionar por año, mes y estado
    },
    format='parquet',
    transformation_ctx='curated_output'
)

print(f"Indicadores calculados escritos en s3://{args['curated_bucket']}/indicators/")

job.commit()

