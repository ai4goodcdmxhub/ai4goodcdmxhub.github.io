"""
Lambda function para ingesta de datos ENOE (Encuesta Nacional de Ocupación y Empleo)
desde INEGI hacia el bucket S3 raw.

Esta función:
1. Descarga un archivo desde una URL configurable (SOURCE_URL)
2. Lo sube al bucket raw bajo el prefijo ENOE/YYYY-MM-DD/

PATRÓN: Para añadir ingesta de otras fuentes (ENDUTIH, ANUIES, etc.):
1. Crear nuevas funciones Lambda similares
2. Ajustar el prefijo de destino según la fuente
3. Implementar lógica específica de descarga/descompresión si es necesario
"""

import os
import json
import urllib.request
import urllib.error
from datetime import datetime
import boto3
from botocore.exceptions import ClientError

# Cliente S3
s3_client = boto3.client('s3')

# Variables de entorno
RAW_BUCKET_NAME = os.environ.get('RAW_BUCKET_NAME')
SOURCE_URL = os.environ.get('SOURCE_URL', '')


def handler(event, context):
    """
    Handler principal de la Lambda de ingesta.
    
    Args:
        event: Evento de EventBridge (o invocación manual)
        context: Contexto de Lambda
    
    Returns:
        dict: Respuesta con status y detalles de la operación
    """
    try:
        # Validar variables de entorno
        if not RAW_BUCKET_NAME:
            raise ValueError('RAW_BUCKET_NAME no está configurado')
        
        if not SOURCE_URL:
            raise ValueError('SOURCE_URL no está configurada')
        
        # Obtener fecha actual para el prefijo
        today = datetime.now()
        date_prefix = today.strftime('%Y-%m-%d')
        
        # Nombre del archivo en S3
        # Extraer nombre del archivo de la URL o usar un nombre por defecto
        source_filename = SOURCE_URL.split('/')[-1] or 'enoe_data.zip'
        s3_key = f'ENOE/{date_prefix}/{source_filename}'
        
        print(f'Descargando desde: {SOURCE_URL}')
        print(f'Subiendo a: s3://{RAW_BUCKET_NAME}/{s3_key}')
        
        # Descargar archivo desde la URL
        # NOTA: Para archivos grandes, considerar usar streaming
        with urllib.request.urlopen(SOURCE_URL) as response:
            file_content = response.read()
        
        # Subir a S3
        s3_client.put_object(
            Bucket=RAW_BUCKET_NAME,
            Key=s3_key,
            Body=file_content,
            Metadata={
                'source_url': SOURCE_URL,
                'ingestion_date': today.isoformat(),
                'source': 'ENOE',
            }
        )
        
        print(f'Archivo subido exitosamente: {s3_key}')
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Ingesta completada exitosamente',
                's3_bucket': RAW_BUCKET_NAME,
                's3_key': s3_key,
                'source_url': SOURCE_URL,
                'ingestion_date': today.isoformat(),
            })
        }
    
    except urllib.error.URLError as e:
        error_msg = f'Error al descargar desde {SOURCE_URL}: {str(e)}'
        print(error_msg)
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Error de descarga',
                'message': error_msg,
            })
        }
    
    except ClientError as e:
        error_msg = f'Error al subir a S3: {str(e)}'
        print(error_msg)
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Error de S3',
                'message': error_msg,
            })
        }
    
    except Exception as e:
        error_msg = f'Error inesperado: {str(e)}'
        print(error_msg)
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Error inesperado',
                'message': error_msg,
            })
        }

