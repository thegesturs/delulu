import { Context, Effect, Layer } from "effect";

export class FoundationService extends Context.Service<
  FoundationService,
  { readonly readiness: Effect.Effect<"ready"> }
>()("@delulu/services/FoundationService") {
  static readonly layer = Layer.succeed(
    FoundationService,
    FoundationService.of({ readiness: Effect.succeed("ready") })
  );
}
