import { AutomationPatch, AutomationWrite } from "@delulu/contracts";
import { Schema } from "effect";

export const decodeAutomationWrite = Schema.decodeUnknownSync(AutomationWrite);
export const decodeAutomationPatch = Schema.decodeUnknownSync(AutomationPatch);
