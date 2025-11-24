#!/bin/bash
# Script helper para subir los scripts de Glue a S3
# Uso: ./upload-glue-scripts.sh <bucket-name>
# Ejemplo: ./upload-glue-scripts.sh ai-youth-glue-scripts-123456789-us-east-1

BUCKET_NAME=$1

if [ -z "$BUCKET_NAME" ]; then
    echo "Error: Debes proporcionar el nombre del bucket"
    echo "Uso: ./upload-glue-scripts.sh <bucket-name>"
    echo ""
    echo "El nombre del bucket se puede obtener del output del stack ETLStack:"
    echo "  cdk deploy ETLStack"
    exit 1
fi

echo "Subiendo scripts de Glue a s3://${BUCKET_NAME}/scripts/..."

# Crear el prefijo scripts/ si no existe
aws s3api put-object --bucket "$BUCKET_NAME" --key scripts/ --content-length 0 2>/dev/null || true

# Subir los scripts
aws s3 cp cleaning_job.py "s3://${BUCKET_NAME}/scripts/cleaning_job.py"
aws s3 cp aggregation_job.py "s3://${BUCKET_NAME}/scripts/aggregation_job.py"

echo "Scripts subidos exitosamente!"
echo ""
echo "Los Glue Jobs ahora pueden ejecutarse. Verifica en AWS Console:"
echo "  - Glue Job: raw-to-cleaned-job"
echo "  - Glue Job: cleaned-to-curated-job"

