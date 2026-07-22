import type { DeploymentMode } from "@delulu/contracts";
import { Context, Layer } from "effect";

export interface DeploymentOptions {
  readonly mode: DeploymentMode;
  readonly publishTransport: "sqs" | "postgres";
  readonly registrationEnabled: boolean;
  readonly version: string;
  readonly communityApiRatePerMinute: number;
}

export class DeploymentConfig extends Context.Service<
  DeploymentConfig,
  DeploymentOptions
>()("@delulu/services/DeploymentConfig") {
  static layer(options: DeploymentOptions) {
    return Layer.succeed(DeploymentConfig, DeploymentConfig.of(options));
  }
}
