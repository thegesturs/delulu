import { SignUp } from "@delulu/auth";
import { redirect } from "next/navigation";

export default async function Page() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";
  const registrationEnabled = await fetch(`${apiUrl}/v1/instance`, {
    cache: "no-store",
  })
    .then(async (response) => {
      if (!response.ok) {
        return true;
      }
      const instance = (await response.json()) as {
        registrationEnabled?: boolean;
      };
      return instance.registrationEnabled !== false;
    })
    .catch(() => true);
  if (!registrationEnabled) {
    redirect("/sign-in?registration=disabled");
  }
  return <SignUp />;
}
