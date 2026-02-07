"use client";

import { useUser } from "@delulu/auth";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useOnboarding } from "@/hooks/use-onboarding";

export function FeatureTour() {
  const { user } = useUser();
  const router = useRouter();
  const { handleCompleteTour } = useOnboarding();

  useEffect(() => {
    // Check if user should see the tour
    const metadata = user?.publicMetadata as {
      onboardingComplete?: boolean;
      tourCompleted?: boolean;
      tourDismissed?: boolean;
    };

    const shouldShowTour =
      metadata?.onboardingComplete &&
      !metadata?.tourCompleted &&
      !metadata?.tourDismissed;

    if (shouldShowTour) {
      // Small delay to ensure DOM is ready
      const timeoutId = setTimeout(() => {
        startTour();
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [user, startTour]);

  const startTour = () => {
    let currentStepIndex = 0;

    const driverObj = driver({
      showProgress: true,
      showButtons: ["next", "previous", "close"],
      steps: [
        {
          element: '[data-tour="dashboard-stats"]',
          popover: {
            title: "Dashboard Overview",
            description:
              "Track your social media performance at a glance. See total posts, published content, scheduled items, and more.",
            side: "bottom",
            align: "center",
          },
        },
        {
          element: '[data-tour="create-post"]',
          popover: {
            title: "Create Post Button",
            description:
              "Start creating content for multiple platforms at once. Save time by posting to all your accounts simultaneously.",
            side: "right",
            align: "start",
          },
        },
        {
          element: '[data-tour="posts-nav"]',
          popover: {
            title: "Posts Management",
            description:
              "View, edit, and manage all your posts in one place. See drafts, scheduled posts, and published content.",
            side: "right",
            align: "start",
          },
        },
        {
          element: '[data-tour="calendar-nav"]',
          popover: {
            title: "Calendar View",
            description:
              "Visualize your content schedule and plan ahead. See when posts are going live across all platforms.",
            side: "right",
            align: "start",
          },
        },
        {
          element: '[data-tour="accounts-nav"]',
          popover: {
            title: "Connected Accounts",
            description:
              "Manage your connected social media accounts and access tokens. Add or remove platforms anytime.",
            side: "right",
            align: "start",
          },
        },
        {
          popover: {
            title: "You're All Set!",
            description:
              "Ready to start creating amazing content? Click the button below to create your first post.",
          },
        },
      ],
      onNextClick: () => {
        currentStepIndex++;
        driverObj.moveNext();
      },
      onPrevClick: () => {
        currentStepIndex--;
        driverObj.movePrevious();
      },
      onDestroyStarted: () => {
        if (currentStepIndex >= 5) {
          // Tour was completed
          handleCompleteTour(false);
          router.push("/post");
        } else {
          // Tour was dismissed
          handleCompleteTour(true);
        }
        driverObj.destroy();
      },
    });

    driverObj.drive();
  };

  // This component doesn't render anything
  return null;
}

// Hook to manually start the tour (for restart functionality)
export function useFeatureTour() {
  const router = useRouter();

  const startTour = () => {
    let currentStepIndex = 0;

    const driverObj = driver({
      showProgress: true,
      showButtons: ["next", "previous", "close"],
      steps: [
        {
          element: '[data-tour="dashboard-stats"]',
          popover: {
            title: "Dashboard Overview",
            description: "Track your social media performance at a glance.",
            side: "bottom",
            align: "center",
          },
        },
        {
          element: '[data-tour="create-post"]',
          popover: {
            title: "Create Post Button",
            description:
              "Start creating content for multiple platforms at once.",
            side: "right",
            align: "start",
          },
        },
        {
          element: '[data-tour="posts-nav"]',
          popover: {
            title: "Posts Management",
            description: "View, edit, and manage all your posts in one place.",
            side: "right",
            align: "start",
          },
        },
        {
          element: '[data-tour="calendar-nav"]',
          popover: {
            title: "Calendar View",
            description: "Visualize your content schedule and plan ahead.",
            side: "right",
            align: "start",
          },
        },
        {
          element: '[data-tour="accounts-nav"]',
          popover: {
            title: "Connected Accounts",
            description: "Manage your connected social media accounts.",
            side: "right",
            align: "start",
          },
        },
        {
          popover: {
            title: "You're All Set!",
            description: "Ready to start creating amazing content?",
          },
        },
      ],
      onNextClick: () => {
        currentStepIndex++;
        driverObj.moveNext();
      },
      onPrevClick: () => {
        currentStepIndex--;
        driverObj.movePrevious();
      },
      onDestroyStarted: () => {
        if (currentStepIndex >= 5) {
          router.push("/post");
        }
        driverObj.destroy();
      },
    });

    driverObj.drive();
  };

  return { startTour };
}
