"use client";

import { Input } from "@delulu/design-system/components/ui/input";
import { motion } from "motion/react";
import { useState } from "react";
import { useOnboardingStore } from "@/store/onboarding";

const surveyOptions = [
  { value: "social_media", label: "Social Media (Instagram, TikTok, etc.)" },
  { value: "word_of_mouth", label: "Word of Mouth / Friend referral" },
  { value: "search_engine", label: "Search Engine (Google, etc.)" },
  { value: "youtube", label: "YouTube / Content creator" },
  { value: "blog", label: "Blog / Article" },
  { value: "other", label: "Other" },
] as const;

export function SurveyStep() {
  const surveyAnswer = useOnboardingStore((s) => s.surveyAnswer);
  const setSurveyAnswer = useOnboardingStore((s) => s.setSurveyAnswer);
  const [otherText, setOtherText] = useState("");

  const handleSelect = (value: string) => {
    if (value === "other") {
      setSurveyAnswer(otherText ? `other: ${otherText}` : "other");
    } else {
      setSurveyAnswer(value);
    }
  };

  const selectedValue = surveyAnswer?.startsWith("other")
    ? "other"
    : surveyAnswer;

  return (
    <div className="space-y-8 text-center">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <h1 className="font-bold text-3xl text-foreground tracking-tight sm:text-4xl">
          How did you hear about Delulu Social?
        </h1>
        <p className="text-lg text-muted-foreground">
          Help us understand how you found us
        </p>
      </motion.div>

      <div className="mx-auto max-w-md space-y-3">
        {surveyOptions.map((option, index) => (
          <motion.button
            animate={{ opacity: 1, y: 0 }}
            className={`flex w-full items-center rounded-lg border p-4 text-left transition-colors ${
              selectedValue === option.value
                ? "border-primary bg-primary/5 text-foreground"
                : "border-border bg-card text-card-foreground hover:bg-accent/50"
            }`}
            initial={{ opacity: 0, y: 10 }}
            key={option.value}
            onClick={() => handleSelect(option.value)}
            transition={{ delay: index * 0.05, duration: 0.3, ease: "easeOut" }}
            type="button"
          >
            <div
              className={`mr-3 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                selectedValue === option.value
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/30"
              }`}
            >
              {selectedValue === option.value && (
                <div className="h-2 w-2 rounded-full bg-white" />
              )}
            </div>
            <span className="font-medium text-sm">{option.label}</span>
          </motion.button>
        ))}

        {selectedValue === "other" && (
          <motion.div
            animate={{ opacity: 1, height: "auto" }}
            initial={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Input
              autoFocus
              className="mt-2"
              onChange={(e) => {
                setOtherText(e.target.value);
                setSurveyAnswer(
                  e.target.value ? `other: ${e.target.value}` : "other"
                );
              }}
              placeholder="Please specify..."
              value={otherText}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
