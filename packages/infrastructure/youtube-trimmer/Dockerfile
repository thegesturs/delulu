# YouTube trimmer Lambda — container image so we can bundle yt-dlp + ffmpeg,
# which cannot run on Cloudflare Workers. Build for linux/amd64 (Lambda x86_64).
FROM public.ecr.aws/lambda/nodejs:20

# Archive tools for extracting the ffmpeg build.
RUN dnf install -y tar xz && dnf clean all

# Static ffmpeg + ffprobe (BtbN linux64 GPL build). yt-dlp shells out to these
# for --download-sections and muxing.
RUN curl -fsSL "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz" -o /tmp/ffmpeg.tar.xz \
  && mkdir -p /tmp/ff && tar -xJf /tmp/ffmpeg.tar.xz -C /tmp/ff --strip-components=1 \
  && cp /tmp/ff/bin/ffmpeg /tmp/ff/bin/ffprobe /usr/local/bin/ \
  && chmod +x /usr/local/bin/ffmpeg /usr/local/bin/ffprobe \
  && rm -rf /tmp/ff /tmp/ffmpeg.tar.xz

# yt-dlp standalone linux binary (self-contained, no Python install needed).
# Pinned by "latest" release; bump the image to update.
RUN curl -fsSL "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux" -o /usr/local/bin/yt-dlp \
  && chmod +x /usr/local/bin/yt-dlp

COPY index.mjs ${LAMBDA_TASK_ROOT}/

CMD ["index.handler"]
