#!/usr/bin/env bash
# One-shot deploy for the YouTube trimmer Lambda.
#   build image -> push to ECR -> set SST secrets -> sst deploy
# Then prints the two `wrangler secret put` commands to finish on the web app.
#
# Usage:
#   aws sso login --profile delulu_social
#   ./deploy.sh                       # generates a fresh auth secret
#   YOUTUBE_TRIMMER_SECRET=<hex> ./deploy.sh   # reuse an existing secret
#
# Env overrides: AWS_PROFILE, AWS_REGION, STAGE (default production).
set -euo pipefail

PROFILE="${AWS_PROFILE:-delulu_social}"
REGION="${AWS_REGION:-us-east-1}"
REPO="${ECR_REPO:-delulu-youtube-trimmer}"
STAGE="${STAGE:-production}"
SECRET="${YOUTUBE_TRIMMER_SECRET:-$(openssl rand -hex 32)}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA="$(cd "$DIR/.." && pwd)"

echo "==> AWS account"
ACCOUNT="$(aws sts get-caller-identity --profile "$PROFILE" --query Account --output text)"
REGISTRY="${ACCOUNT}.dkr.ecr.${REGION}.amazonaws.com"
TAG="$(git rev-parse --short HEAD 2>/dev/null || date +%s)"

echo "==> Ensuring ECR repo ${REPO}"
aws ecr describe-repositories --repository-names "$REPO" --profile "$PROFILE" --region "$REGION" >/dev/null 2>&1 \
  || aws ecr create-repository --repository-name "$REPO" --profile "$PROFILE" --region "$REGION" >/dev/null

echo "==> Docker login + build + push (linux/amd64)"
aws ecr get-login-password --profile "$PROFILE" --region "$REGION" \
  | docker login --username AWS --password-stdin "$REGISTRY"
docker build --platform linux/amd64 -t "${REGISTRY}/${REPO}:${TAG}" "$DIR"
docker push "${REGISTRY}/${REPO}:${TAG}"

DIGEST="$(aws ecr describe-images --repository-name "$REPO" --image-ids imageTag="$TAG" \
  --profile "$PROFILE" --region "$REGION" --query 'imageDetails[0].imageDigest' --output text)"
IMAGE_URI="${REGISTRY}/${REPO}@${DIGEST}"
echo "==> Image: ${IMAGE_URI}"

echo "==> Setting SST secrets + deploying (stage: ${STAGE})"
cd "$INFRA"
pnpm sst secret set YoutubeTrimmerImageUri   "$IMAGE_URI" --stage "$STAGE"
pnpm sst secret set YoutubeTrimmerAuthSecret "$SECRET"    --stage "$STAGE"
pnpm sst deploy --stage "$STAGE"

cat <<EOF

==================================================================
Lambda deployed. Finish by wiring the web app (delulu-social-landing):

  cd apps/web
  wrangler secret put YOUTUBE_TRIMMER_URL
    # paste the YoutubeTrimmerApiEndpoint printed just above
  wrangler secret put YOUTUBE_TRIMMER_SECRET
    # paste: ${SECRET}

Then redeploy the web app (merges to main auto-deploy).
==================================================================
EOF
