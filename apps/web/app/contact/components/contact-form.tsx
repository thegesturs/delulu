'use client';

import { Button } from '@delulu/design-system/components/ui/button';
import { Input } from '@delulu/design-system/components/ui/input';
import { Label } from '@delulu/design-system/components/ui/label';
import { Textarea } from '@delulu/design-system/components/ui/textarea';
import type { Dictionary } from '@delulu/internationalization';
import { Check, MoveRight } from 'lucide-react';
import { useState } from 'react';
import { contact } from '../actions/contact';

type ContactFormProps = {
  dictionary: Dictionary;
};

export const ContactForm = ({ dictionary }: ContactFormProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData);
    await contact(
      `${data.firstname} ${data.lastname}`,
      data.email as string,
      data.message as string
    );
  };

  return (
    <div className="w-full py-20 lg:py-40">
      <div className="container mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <h4 className="max-w-xl text-left font-regular text-3xl tracking-tighter md:text-5xl">
                  {dictionary.web.contact.meta.title}
                </h4>
                <p className="max-w-sm text-left text-lg text-muted-foreground leading-relaxed tracking-tight">
                  {dictionary.web.contact.meta.description}
                </p>
              </div>
            </div>
            {dictionary.web.contact.hero.benefits.map((benefit, index) => (
              <div
                className="flex flex-row items-start gap-6 text-left"
                key={index}
              >
                <Check className="mt-2 h-4 w-4 text-primary" />
                <div className="flex flex-col gap-1">
                  <p>{benefit.title}</p>
                  <p className="text-muted-foreground text-sm">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex w-[350px] items-center justify-center sm:w-[450px] lg:w-[550px] ">
            <form
              className="flex w-full flex-col gap-4 rounded-md border p-8"
              onSubmit={handleSubmit}
            >
              <p>{dictionary.web.contact.hero.form.title}</p>

              <div className="grid w-full items-center gap-1">
                <Label htmlFor="firstname">First Name</Label>
                <Input id="firstname" type="text" />
              </div>
              <div className="grid w-full items-center gap-1">
                <Label htmlFor="lastname">Last Name</Label>
                <Input id="lastname" type="text" />
              </div>
              <div className="grid w-full items-center gap-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" />
              </div>
              <div className="grid w-full items-center gap-1">
                <Label htmlFor="picture">Message</Label>
                <Textarea id="picture" />
              </div>

              <Button
                className="w-full gap-4"
                type="submit"
                onClick={() => setIsLoading(true)}
              >
                {dictionary.web.contact.hero.form.cta}{' '}
                <MoveRight className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
