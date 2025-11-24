"""
Lambda function que actúa como backend API para el dashboard frontend.

Esta función:
1. Expone endpoints HTTP vía API Gateway
2. Consulta datos desde el bucket curated (o Athena/Redshift en el futuro)
3. Retorna indicadores en formato JSON

PATRÓN: Para conectar con Athena:
1. Usar boto3.client('athena') para ejecutar queries
2. Consultar tablas en el Glue Catalog
3. Retornar resultados en formato JSON

PATRÓN: Para añadir nuevos endpoints:
1. Parsear el path y método HTTP desde event
2. Implementar lógica de negocio específica
3. Retornar respuesta en formato estándar
"""

import os
import json
import boto3
from datetime import datetime

# Clientes AWS
s3_client = boto3.client('s3')
glue_client = boto3.client('glue')

# Variables de entorno
CURATED_BUCKET_NAME = os.environ.get('CURATED_BUCKET_NAME')
GLUE_DATABASE_NAME = os.environ.get('GLUE_DATABASE_NAME')
AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')


def handler(event, context):
    """
    Handler principal de la Lambda API.
    
    Args:
        event: Evento de API Gateway
        context: Contexto de Lambda
    
    Returns:
        dict: Respuesta HTTP para API Gateway
    """
    try:
        # Parsear request de API Gateway HTTP API
        request_context = event.get('requestContext', {})
        http_method = request_context.get('http', {}).get('method', 'GET')
        path = request_context.get('http', {}).get('path', '/')
        
        print(f'Request: {http_method} {path}')
        
        # Routing de endpoints
        if path == '/health' or path == '/health/':
            return handle_health()
        elif path.startswith('/api/v1/indicators'):
            return handle_indicators(event)
        else:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                'body': json.dumps({
                    'error': 'Endpoint no encontrado',
                    'path': path,
                })
            }
    
    except Exception as e:
        error_msg = f'Error en el handler: {str(e)}'
        print(error_msg)
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            'body': json.dumps({
                'error': 'Error interno del servidor',
                'message': error_msg,
            })
        }


def handle_health():
    """
    Endpoint de health check.
    
    Returns:
        dict: Respuesta HTTP con status OK
    """
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        'body': json.dumps({
            'status': 'OK',
            'service': 'AI Youth Data Platform API',
            'timestamp': datetime.now().isoformat(),
            'version': '1.0.0',
        })
    }


def handle_indicators(event):
    """
    Endpoint para obtener indicadores.
    
    Por ahora retorna datos dummy. En el futuro:
    - Parsear query parameters (estado, año, etc.)
    - Consultar Athena o Redshift
    - Retornar indicadores reales
    
    Args:
        event: Evento de API Gateway
    
    Returns:
        dict: Respuesta HTTP con indicadores
    """
    # Parsear query parameters
    query_params = event.get('queryStringParameters') or {}
    estado = query_params.get('estado', '')
    year = query_params.get('year', '2024')
    
    # TODO: Implementar consulta real a Athena/Redshift
    # Ejemplo con Athena:
    # athena_client = boto3.client('athena')
    # query = f"""
    #     SELECT 
    #         estado,
    #         year,
    #         tasa_desempleo_juvenil,
    #         porcentaje_stem
    #     FROM {GLUE_DATABASE_NAME}.indicadores_curated
    #     WHERE estado = '{estado}' AND year = {year}
    # """
    # result = execute_athena_query(athena_client, query)
    
    # Por ahora, retornar datos dummy
    dummy_data = {
        'indicadores': [
            {
                'nombre': 'Tasa de Desempleo Juvenil',
                'valor': 12.5,
                'unidad': 'porcentaje',
                'estado': estado or 'CDMX',
                'year': year,
                'fuente': 'ENOE',
            },
            {
                'nombre': 'Porcentaje de Jóvenes en STEM',
                'valor': 28.3,
                'unidad': 'porcentaje',
                'estado': estado or 'CDMX',
                'year': year,
                'fuente': 'ANUIES',
            },
            {
                'nombre': 'Índice de Acceso Digital Juvenil',
                'valor': 0.75,
                'unidad': 'índice (0-1)',
                'estado': estado or 'CDMX',
                'year': year,
                'fuente': 'ENDUTIH',
            },
        ],
        'metadata': {
            'timestamp': datetime.now().isoformat(),
            'filtros_aplicados': {
                'estado': estado or 'todos',
                'year': year,
            },
            'nota': 'Datos de ejemplo. Implementar consulta real a Athena/Redshift.',
        }
    }
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        'body': json.dumps(dummy_data, ensure_ascii=False)
    }


# Función helper para ejecutar queries en Athena (para implementar más adelante)
def execute_athena_query(athena_client, query, workgroup='primary'):
    """
    Ejecuta una query en Athena y retorna los resultados.
    
    Args:
        athena_client: Cliente boto3 de Athena
        query: Query SQL a ejecutar
        workgroup: Workgroup de Athena a usar
    
    Returns:
        list: Lista de resultados
    """
    # TODO: Implementar lógica de ejecución de queries
    # 1. Iniciar query execution
    # 2. Esperar a que termine (polling)
    # 3. Obtener resultados
    # 4. Parsear y retornar
    pass

