import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@delulu/design-system/components/ui/accordion";

export interface FaqItem {
  question: string;
  answer: string;
}

export function ToolFaq({ items }: { items: FaqItem[] }) {
  return (
    <Accordion className="w-full" collapsible type="single">
      {items.map((item, idx) => (
        <AccordionItem key={item.question} value={`item-${idx}`}>
          <AccordionTrigger>{item.question}</AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-6">
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
