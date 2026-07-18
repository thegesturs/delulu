import { Button } from "@delulu/design-system/components/ui/button";
import { ArrowRight, Github } from "lucide-react";
import Balancer from "react-wrap-balancer";
import { LANDING_LINKS } from "@/lib/landing-links";
import { ProductPreview } from "./product-preview";
import { TrackedLandingLink } from "./tracked-landing-link";

const CTA = () => (
  <section className="border-t px-4 py-24 md:px-6 lg:py-32">
    <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-primary text-primary-foreground shadow-2xl">
      <div className="px-6 pt-14 text-center md:px-12 md:pt-20">
        <p className="font-mono font-semibold text-xs uppercase tracking-[0.2em] opacity-70">
          Your calendar is ready
        </p>
        <h2 className="mx-auto mt-5 max-w-4xl font-semibold text-4xl tracking-[-0.05em] md:text-6xl">
          <Balancer>Give your agent something useful to do.</Balancer>
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 opacity-75">
          Connect an agent to the hosted service in minutes, or deploy the
          open-source stack on infrastructure you control.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild className="h-12 px-6" size="lg" variant="secondary">
            <TrackedLandingLink
              destination="agent_setup"
              href={LANDING_LINKS.agentSetup}
              surface="final_cta"
            >
              Connect your agent
              <ArrowRight aria-hidden="true" className="ml-2 size-4" />
            </TrackedLandingLink>
          </Button>
          <TrackedLandingLink
            className="flex min-h-12 items-center justify-center rounded-lg px-6 font-medium outline-none ring-1 ring-primary-foreground/30 transition-colors hover:bg-primary-foreground/10 focus-visible:ring-2 focus-visible:ring-primary-foreground"
            destination="source"
            href={LANDING_LINKS.source}
            surface="final_cta"
          >
            <Github aria-hidden="true" className="mr-2 size-4" />
            Self-host Delulu
          </TrackedLandingLink>
        </div>
        <p className="mt-5 text-xs opacity-65">
          Hosted plans from $4.99/month · Community self-hosting under AGPL-3.0
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-6xl translate-y-8 px-4 md:translate-y-12 md:px-8">
        <ProductPreview
          className="rounded-t-[1.5rem] rounded-b-none shadow-2xl ring-primary-foreground/20"
          crop="full"
          label="The Delulu workspace ready for an agent"
          sizes="(min-width: 1024px) 72vw, 92vw"
        />
      </div>
    </div>
  </section>
);

export default CTA;
