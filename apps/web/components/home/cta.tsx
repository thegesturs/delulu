import { Button } from "@delulu/design-system/components/ui/button";
import { ArrowRight, Github } from "lucide-react";
import Link from "next/link";
import Balancer from "react-wrap-balancer";

const CTA = () => (
  <section className="relative border-t px-4 py-24 md:px-8">
    <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border bg-card px-6 py-16 text-center shadow-xl md:px-12">
      <p className="font-medium text-primary text-sm">Your calendar is ready</p>
      <h2 className="mx-auto mt-4 max-w-3xl font-bold text-4xl tracking-tight md:text-6xl">
        <Balancer>Give your agent something useful to do.</Balancer>
      </h2>
      <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-8">
        Connect an agent to the hosted service in minutes, or deploy the
        open-source stack on infrastructure you control.
      </p>
      <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="https://docs.delulu.social/getting-started/agent-setup/">
            Connect your agent
            <ArrowRight aria-hidden="true" className="ml-2 size-4" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="https://github.com/thegesturs/delulu">
            <Github aria-hidden="true" className="mr-2 size-4" />
            Self-host Delulu
          </Link>
        </Button>
      </div>
      <p className="mt-5 text-muted-foreground text-xs">
        Hosted plans from $4.99/month · Community self-hosting under AGPL-3.0
      </p>
    </div>
  </section>
);

export default CTA;
