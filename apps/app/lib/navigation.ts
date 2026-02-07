import {
  Calendar,
  CreditCard,
  Draft,
  Home,
  Network,
  Robot,
} from "@delulu/design-system/icons";

export const navigationItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
    dataTour: undefined, // Stats will be marked separately
  },
  {
    title: "Posts",
    url: "/posts",
    icon: Draft,
    dataTour: "posts-nav",
  },
  {
    title: "Calendar",
    url: "/calendar",
    icon: Calendar,
    dataTour: "calendar-nav",
  },
  {
    title: "Connected Accounts",
    url: "/socials",
    icon: Network,
    dataTour: "accounts-nav",
  },
  {
    title: "Automations",
    url: "/automations",
    icon: Robot,
    dataTour: "automations-nav",
  },
  {
    title: "Billing",
    url: "/billing",
    icon: CreditCard,
    dataTour: undefined,
  },
];
