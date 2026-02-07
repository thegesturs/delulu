import { createMetadata } from "@delulu/seo/metadata";
import type { Metadata } from "next";
import { ContactForm } from "./components/contact-form";

export const metadata: Metadata = createMetadata({
  title: "Contact Us",
  description:
    "Get in touch with the Delulu Social team. Have questions about our social media management platform? Need support? We're here to help you succeed with your social media strategy.",
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_WEB_URL || "https://delulu.social"}/contact`,
  },
});

const Contact = () => {
  return <ContactForm />;
};

export default Contact;
