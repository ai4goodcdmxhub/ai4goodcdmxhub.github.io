# Glue Job: Raw to Cleaned Transformation
# 
# Este script transforma datos desde la zona raw hacia la zona cleaned.
# 
# LÓGICA DE LIMPIEZA A IMPLEMENTAR:
# - Normalización de fechas (formato estándar ISO 8601)
# - Estandarización de categorías (valores únicos, sin duplicados)
# - Manejo de valores nulos (imputación o eliminación según reglas de negocio)
# - Eliminación de duplicados basada en claves primarias
# - Validación de rangos y tipos de datos
# - Conversión a formato Parquet para optimización

import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job
from pyspark.sql.functions import col, to_date, when, isnan, isnull

args = getResolvedOptions(sys.argv, ['JOB_NAME', 'raw_bucket', 'cleaned_bucket', 'database_name'])

sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init(args['JOB_NAME'], args)

# Leer datos desde raw (ejemplo: tabla ENOE inferida por el Crawler)
# NOTA: Ajustar el nombre de la tabla según lo que el Crawler haya inferido
try:
    datasource = glueContext.create_dynamic_frame.from_catalog(
        database=args['database_name'],
        table_name='enoe_raw',  # Nombre de tabla inferida por el Crawler
        transformation_ctx='datasource'
    )
except Exception as e:
    print(f"Error al leer desde catálogo: {e}")
    print("Intentando leer directamente desde S3...")
    # Fallback: leer directamente desde S3 si la tabla no existe aún
    datasource = glueContext.create_dynamic_frame.from_options(
        connection_type='s3',
        connection_options={
            'paths': [f"s3://{args['raw_bucket']}/ENOE/"],
            'recurse': True
        },
        format='csv',
        format_options={
            'withHeader': True,
            'separator': ','
        },
        transformation_ctx='datasource'
    )

# Convertir a DataFrame de Spark para facilitar transformaciones
df = datasource.toDF()

# AQUÍ: Aplicar transformaciones de limpieza
# Ejemplo de transformaciones (ajustar según esquema real):

# 1. Normalización de fechas (si existe columna de fecha)
# if 'fecha' in df.columns:
#     df = df.withColumn('fecha_normalizada', to_date(col('fecha'), 'yyyy-MM-dd'))

# 2. Estandarización de categorías (ejemplo: normalizar valores de estado)
# df = df.withColumn('estado', upper(trim(col('estado'))))

# 3. Manejo de nulos (ejemplo: reemplazar con valor por defecto o eliminar)
# df = df.na.fill({'columna_numerica': 0})
# df = df.na.drop(subset=['columna_requerida'])

# 4. Eliminación de duplicados
# df = df.dropDuplicates(['id', 'fecha'])  # Ajustar columnas según clave primaria

# 5. Validación de rangos (ejemplo: valores entre 0 y 100)
# df = df.filter((col('porcentaje') >= 0) & (col('porcentaje') <= 100))

# Por ahora, solo copiamos los datos (stub - implementar lógica real)
cleaned_df = df

# Convertir de vuelta a DynamicFrame
cleaned_data = DynamicFrame.fromDF(cleaned_df, glueContext, 'cleaned_data')

# Escribir a cleaned en formato Parquet (optimizado para consultas)
glueContext.write_dynamic_frame.from_options(
    frame=cleaned_data,
    connection_type='s3',
    connection_options={
        'path': f"s3://{args['cleaned_bucket']}/ENOE/",
        'partitionKeys': ['year', 'month']  # Particionar por año y mes (ajustar según datos)
    },
    format='parquet',
    transformation_ctx='cleaned_output'
)

print(f"Datos limpiados escritos en s3://{args['cleaned_bucket']}/ENOE/")

job.commit()

