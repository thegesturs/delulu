/**
 * Design System Icons
 * Icon wrapper components for navigation and layout
 */

import type { ComponentType } from 'react';
import { Icon } from '../providers/icon';
import {
  Home as HomeIcon,
  Calendar as CalendarIcon,
  File as FileIcon,
  Network as NetworkIcon,
  Settings as SettingsIcon,
  CreditCard as CreditCardIcon,
  Pencil as PencilIcon,
  ConnectIcon,
  AiChat02Icon,
} from '@hugeicons-pro/core-solid-rounded';

// Create wrapped components for navigation icons
export const Home: ComponentType<{ className?: string }> = (props) => (
  <Icon icon={HomeIcon} size={14} {...props} />
);

export const Calendar: ComponentType<{ className?: string }> = (props) => (
  <Icon icon={CalendarIcon} size={14} {...props} />
);

export const Draft: ComponentType<{ className?: string }> = (props) => (
  <Icon icon={FileIcon} size={14} {...props} />
);

export const Network: ComponentType<{ className?: string }> = (props) => (
  <Icon icon={ConnectIcon} size={14} {...props} />
);

export const Settings: ComponentType<{ className?: string }> = (props) => (
  <Icon icon={SettingsIcon} size={14} {...props} />
);

export const CreditCard: ComponentType<{ className?: string }> = (props) => (
  <Icon icon={CreditCardIcon} size={14} {...props} />
);

export const Pencil: ComponentType<{ className?: string }> = (props) => (
  <Icon icon={PencilIcon} size={14} {...props} />
);

export const Robot: ComponentType<{ className?: string }> = (props) => (
  <Icon icon={AiChat02Icon} size={14} {...props} />
);
