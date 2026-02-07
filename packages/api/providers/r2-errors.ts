// R2-specific error classes
export abstract class R2Error extends Error {
  abstract readonly code: string;
  readonly provider = "R2";

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class R2UploadError extends R2Error {
  readonly code = "R2_UPLOAD_ERROR";
}

export class R2DownloadError extends R2Error {
  readonly code = "R2_DOWNLOAD_ERROR";
}

export class R2ConfigError extends R2Error {
  readonly code = "R2_CONFIG_ERROR";
}
