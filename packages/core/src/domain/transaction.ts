import { Effect, Schema } from "effect";
import { Model } from "effect/unstable/schema";
import { TransactionId, UserId } from "../kernel/ids";
import {
  BigIntValue,
  domainErrorFields,
  entityFields,
  JsonObject,
  repository,
} from "./shared";

export class Transaction extends Model.Class<Transaction>("Transaction")({
  ...entityFields(TransactionId),
  billingOwnerUserId: UserId,
  providerTransactionId: Schema.String,
  amountMinor: BigIntValue,
  currency: Schema.String,
  status: Schema.String,
  metadata: JsonObject,
}) {}
export class TransactionError extends Schema.TaggedErrorClass<TransactionError>()(
  "TransactionError",
  domainErrorFields
) {}
export const makeTransactionRepository = Effect.fn("makeTransactionRepository")(
  () => repository(Transaction, "id", "transactions", "TransactionRepository")
);
