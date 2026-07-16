# YouTube trimmer Lambda — container image so we can bundle yt-dlp + ffmpeg,
# which cannot run on Cloudflare Workers. Built for the Lambda's architecture
# (arm64/Graviton by default). Binaries are selected from TARGETARCH so the
# same Dockerfile works whether it's built native on Apple Silicon or on x86.
FROM public.ecr.aws/lambda/nodejs:20

# Archive tools for extracting the ffmpeg build.
RUN dnf install -y tar xz && dnf clean all

# Provided automatically by BuildKit/buildx: "amd64" or "arm64".
ARG TARGETARCH

# Static ffmpeg + ffprobe (BtbN GPL build), arch-matched. yt-dlp shells out to
# these for --download-sections and muxing.
RUN case "${TARGETARCH}" in \
      amd64) FF_ARCH=linux64 ;; \
      arm64) FF_ARCH=linuxarm64 ;; \
      *) echo "unsupported TARGETARCH: ${TARGETARCH}" >&2; exit 1 ;; \
    esac \
  && curl -fsSL "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-${FF_ARCH}-gpl.tar.xz" -o /tmp/ffmpeg.tar.xz \
  && mkdir -p /tmp/ff && tar -xJf /tmp/ffmpeg.tar.xz -C /tmp/ff --strip-components=1 \
  && cp /tmp/ff/bin/ffmpeg /tmp/ff/bin/ffprobe /usr/local/bin/ \
  && chmod +x /usr/local/bin/ffmpeg /usr/local/bin/ffprobe \
  && rm -rf /tmp/ff /tmp/ffmpeg.tar.xz

# yt-dlp standalone binary (self-contained, no Python install needed), arch-matched.
# Pinned by "latest" release; rebuild the image to update.
RUN case "${TARGETARCH}" in \
      amd64) YTDLP=yt-dlp_linux ;; \
      arm64) YTDLP=yt-dlp_linux_aarch64 ;; \
      *) echo "unsupported TARGETARCH: ${TARGETARCH}" >&2; exit 1 ;; \
    esac \
  && curl -fsSL "https://github.com/yt-dlp/yt-dlp/releases/latest/download/${YTDLP}" -o /usr/local/bin/yt-dlp \
  && chmod +x /usr/local/bin/yt-dlp

COPY index.mjs ${LAMBDA_TASK_ROOT}/

CMD ["index.handler"]
