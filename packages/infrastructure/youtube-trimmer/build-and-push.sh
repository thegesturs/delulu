#!/usr/bin/env bash
# Build the YouTube trimmer Lambda image (linux/amd64) and push it to ECR.
# Prints the digest-pinned image URI to feed into SST.
#
# Usage:
#   aws sso login --profile delulu_social
#   ./build-and-push.sh            # uses profile delulu_social, region us-east-1
#
# Then:
#   cd packages/infrastructure
#   pnpm sst secret set YoutubeTrimmerImageUri "<printed-uri>" --stage production
#   pnpm sst deploy --stage production
set -euo pipefail

PROFILE="${AWS_PROFILE:-delulu_social}"
REGION="${AWS_REGION:-us-east-1}"
REPO="${ECR_REPO:-delulu-youtube-trimmer}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

ACCOUNT_ID="$(aws sts get-caller-identity --profile "$PROFILE" --query Account --output text)"
REGISTRY="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"
TAG="$(git rev-parse --short HEAD 2>/dev/null || date +%s)"

echo "==> Ensuring ECR repo ${REPO} exists"
aws ecr describe-repositories --repository-names "$REPO" --profile "$PROFILE" --region "$REGION" >/dev/null 2>&1 \
  || aws ecr create-repository --repository-name "$REPO" --profile "$PROFILE" --region "$REGION" >/dev/null

echo "==> Logging in to ECR"
aws ecr get-login-password --profile "$PROFILE" --region "$REGION" \
  | docker login --username AWS --password-stdin "$REGISTRY"

echo "==> Building linux/amd64 image"
docker build --platform linux/amd64 -t "${REGISTRY}/${REPO}:${TAG}" -t "${REGISTRY}/${REPO}:latest" "$SCRIPT_DIR"

echo "==> Pushing"
docker push "${REGISTRY}/${REPO}:${TAG}"
docker push "${REGISTRY}/${REPO}:latest"

DIGEST="$(aws ecr describe-images --repository-name "$REPO" --image-ids imageTag="$TAG" \
  --profile "$PROFILE" --region "$REGION" --query 'imageDetails[0].imageDigest' --output text)"

echo ""
echo "==> Done. Image URI (digest-pinned):"
echo "${REGISTRY}/${REPO}@${DIGEST}"
echo ""
echo "Next:"
echo "  cd packages/infrastructure"
echo "  pnpm sst secret set YoutubeTrimmerImageUri \"${REGISTRY}/${REPO}@${DIGEST}\" --stage production"
echo "  pnpm sst deploy --stage production"
