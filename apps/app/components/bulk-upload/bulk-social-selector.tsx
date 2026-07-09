"use client";

import { api } from "@delulu/database/convex/_generated/api";
import { Badge } from "@delulu/design-system/components/ui/badge";
import { useQuery } from "convex-helpers/react/cache";
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from "motion/react";
import { IoCheckmarkCircle } from "react-icons/io5";
import { SocialIcon } from "@/components/post/sidebar/social-icon";
import type { SelectedProvider } from "./bulk-upload-reducer";

interface BulkSocialSelectorProps {
  selectedProviders: SelectedProvider[];
  onToggle: (provider: SelectedProvider) => void;
}

export function BulkSocialSelector({
  selectedProviders,
  onToggle,
}: BulkSocialSelectorProps) {
  const socialProviders = useQuery(api.social_providers.getConnectedAccounts);

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-medium text-sm">Select Social Networks</h3>
      <MotionConfig transition={{ duration: 0.4, type: "spring", bounce: 0.2 }}>
        <motion.div className="grid grid-cols-1 gap-1">
          <LayoutGroup>
            <AnimatePresence initial={false} mode="popLayout">
              {socialProviders?.map((account) => {
                const isSelected = selectedProviders.some(
                  (p) => p.socialId === account._id
                );
                return (
                  <motion.div
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    initial={{ opacity: 0 }}
                    key={account._id}
                    layout="position"
                  >
                    <motion.div layout>
                      <Badge
                        className="w-full cursor-pointer text-xs transition-colors duration-200"
                        onClick={() =>
                          onToggle({
                            socialId: account._id,
                            name: account.fullName ?? account.username,
                            socialType: account.socialType,
                          })
                        }
                        size="lg"
                        variant={isSelected ? "blue" : "outline"}
                      >
                        <motion.div className="flex w-full items-center gap-2" layout>
                          <SocialIcon type={account.socialType} />
                          <motion.span className="flex-1 text-left" layout>
                            {(account.fullName ?? account.username).length > 15
                              ? (account.fullName ?? account.username).slice(0, 15) + "..."
                              : (account.fullName ?? account.username)}
                          </motion.span>
                          {isSelected && (
                            <motion.span
                              animate={{ scale: 1 }}
                              className="ml-1"
                              initial={{ scale: 0 }}
                            >
                              <IoCheckmarkCircle className="h-4 w-4" />
                            </motion.span>
                          )}
                        </motion.div>
                      </Badge>
                    </motion.div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </LayoutGroup>
        </motion.div>
      </MotionConfig>
      {socialProviders?.length === 0 && (
        <p className="text-muted-foreground text-xs">
          No connected accounts. Connect a social account first.
        </p>
      )}
    </div>
  );
}
