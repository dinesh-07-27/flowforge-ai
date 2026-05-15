#!/usr/bin/env python3
"""
FlowForge AI - AWS Infrastructure Setup Script
Bootstraps EC2, RDS, and S3 resources using Boto3 SDK.
This is the setup script you run ONCE to provision your AWS infra.
"""

import boto3
import json

AWS_REGION = "ap-south-1"  # Mumbai - closest to India

ec2 = boto3.client("ec2", region_name=AWS_REGION)
s3  = boto3.client("s3",  region_name=AWS_REGION)
rds = boto3.client("rds", region_name=AWS_REGION)

BUCKET_NAME = "flowforge-ai-documents"

def create_s3_bucket():
    print(f"Creating S3 bucket: {BUCKET_NAME}")
    try:
        s3.create_bucket(
            Bucket=BUCKET_NAME,
            CreateBucketConfiguration={"LocationConstraint": AWS_REGION}
        )
        # Block all public access — private bucket only
        s3.put_public_access_block(
            Bucket=BUCKET_NAME,
            PublicAccessBlockConfiguration={
                "BlockPublicAcls": True,
                "IgnorePublicAcls": True,
                "BlockPublicPolicy": True,
                "RestrictPublicBuckets": True
            }
        )
        print(f"S3 bucket '{BUCKET_NAME}' created and secured.")
    except s3.exceptions.BucketAlreadyExists:
        print("Bucket already exists, skipping.")


def create_rds_instance():
    print("Creating RDS PostgreSQL instance...")
    try:
        rds.create_db_instance(
            DBInstanceIdentifier="flowforge-ai-db",
            DBInstanceClass="db.t3.micro",  # Free tier eligible
            Engine="postgres",
            EngineVersion="15.4",
            MasterUsername="postgres",
            MasterUserPassword="YOUR_SECURE_PASSWORD_HERE",  # Replace before running
            DBName="flowforge",
            AllocatedStorage=20,
            StorageType="gp2",
            MultiAZ=False,
            PubliclyAccessible=False,  # Never expose DB to the internet
            BackupRetentionPeriod=7,
            Tags=[{"Key": "Project", "Value": "FlowForgeAI"}]
        )
        print("RDS instance creation initiated (takes ~5 minutes to become available).")
    except rds.exceptions.DBInstanceAlreadyExistsFault:
        print("RDS instance already exists, skipping.")


if __name__ == "__main__":
    print("=== FlowForge AI - AWS Infrastructure Bootstrap ===\n")
    create_s3_bucket()
    create_rds_instance()
    print("\n=== Done! Update your .env with RDS endpoint before deploying. ===")
