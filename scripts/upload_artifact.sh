#!/usr/bin/env bash
# upload_artifact.sh
# Uploads dist/build.zip to S3 at artifacts/{COMMIT_SHA}/build.zip.
# Requires: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION, S3_BUCKET
# Usage: COMMIT_SHA=<sha> S3_BUCKET=<bucket> bash scripts/upload_artifact.sh

set -euo pipefail

if [ -z "${COMMIT_SHA:-}" ]; then
  echo "ERROR: COMMIT_SHA is not set." >&2
  exit 1
fi

if [ -z "${S3_BUCKET:-}" ]; then
  echo "ERROR: S3_BUCKET is not set." >&2
  exit 1
fi

if [ ! -f dist/build.zip ]; then
  echo "ERROR: dist/build.zip not found. Run build_artifact.sh first." >&2
  exit 1
fi

S3_KEY="artifacts/${COMMIT_SHA}/build.zip"

echo "Uploading dist/build.zip to s3://${S3_BUCKET}/${S3_KEY} ..."

# --no-progress keeps CI logs clean
# This is an additive PUT; no existing objects are deleted.
aws s3 cp dist/build.zip "s3://${S3_BUCKET}/${S3_KEY}" --no-progress

echo "Upload complete: s3://${S3_BUCKET}/${S3_KEY}"
