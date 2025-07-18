import { Resend } from 'resend';
import { keys } from './keys';

export const resend = new Resend(keys().RESEND_TOKEN);

// Export all email templates
export { VerifyEmail } from './templates/verify-email';
export { MagicLinkEmail } from './templates/magic-link';
export { VerifyOTP } from './templates/verify-otp';
export { ResetPasswordEmail } from './templates/reset-password';
export { ContactTemplate } from './templates/contact';
