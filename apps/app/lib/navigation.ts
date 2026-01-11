import {
  Calendar,
  Draft,
  Home,
  Network,
} from '@delulu/design-system/icons';
import { CreditCard } from 'lucide-react';

export const navigationItems = [
  {
    title: 'Dashboard',
    url: '/',
    icon: Home,
    dataTour: undefined, // Stats will be marked separately
  },
  {
    title: 'Posts',
    url: '/posts',
    icon: Draft,
    dataTour: 'posts-nav',
  },
  {
    title: 'Calendar',
    url: '/calendar',
    icon: Calendar,
    dataTour: 'calendar-nav',
  },
  {
    title: 'Connected Accounts',
    url: '/socials',
    icon: Network,
    dataTour: 'accounts-nav',
  },
  {
    title: 'Billing',
    url: '/billing',
    icon: CreditCard,
    dataTour: undefined,
  },
];
