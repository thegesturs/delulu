import { Resend } from "resend";
import { keys } from "./keys";

/** Contact-form transport; product lifecycle mail is dispatched by the API. */
export const resend = new Resend(keys().RESEND_TOKEN);

export { ContactTemplate } from "./templates/contact";
