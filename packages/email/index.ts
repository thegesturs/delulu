import { Resend } from "resend";
import { keys } from "./keys";

export const resend = new Resend(keys().RESEND_TOKEN);

export { ContactTemplate } from "./templates/contact";
export { MagicLinkEmail } from "./templates/magic-link";
export { ResetPasswordEmail } from "./templates/reset-password";
// Export all email templates
export { VerifyEmail } from "./templates/verify-email";
export { VerifyOTP } from "./templates/verify-otp";
