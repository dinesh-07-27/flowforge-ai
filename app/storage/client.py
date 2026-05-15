import boto3
from botocore.client import Config
from app.core.config import settings
import uuid
import io

class StorageClient:
    def __init__(self):
        # In a real app, these come from settings. 
        # Hardcoding MinIO defaults for the local environment
        self.endpoint_url = "http://minio:9000"
        self.access_key = "minioadmin"
        self.secret_key = "minioadmin"
        self.bucket_name = "flowforge-documents"
        
        self.s3 = boto3.client(
            's3',
            endpoint_url=self.endpoint_url,
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            config=Config(signature_version='s3v4'),
            region_name='us-east-1'
        )
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self):
        try:
            self.s3.head_bucket(Bucket=self.bucket_name)
        except Exception:
            try:
                self.s3.create_bucket(Bucket=self.bucket_name)
            except Exception as e:
                pass # Bucket might exist or minio isn't up yet

    def upload_file(self, file_content: bytes, filename: str, content_type: str) -> str:
        unique_filename = f"{uuid.uuid4()}-{filename}"
        
        self.s3.upload_fileobj(
            io.BytesIO(file_content),
            self.bucket_name,
            unique_filename,
            ExtraArgs={'ContentType': content_type}
        )
        return f"s3://{self.bucket_name}/{unique_filename}"
        
    def get_file_url(self, object_key: str, expiration=3600) -> str:
        # Generate presigned URL for frontend download
        return self.s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': self.bucket_name, 'Key': object_key},
            ExpiresIn=expiration
        )

storage_client = StorageClient()
