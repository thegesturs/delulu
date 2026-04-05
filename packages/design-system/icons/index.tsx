/**
 * Design System Icons
 * Icon wrapper components for navigation and layout
 */

import {
  AiMail01Icon,
  Calendar as CalendarIcon,
  CheckmarkBadge01Icon,
  ConnectIcon,
  CreditCard as CreditCardIcon,
  File as FileIcon,
  Gift as GiftIcon,
  Home as HomeIcon,
  Key01Icon,
  Pencil as PencilIcon,
  Settings as SettingsIcon,
} from "@hugeicons-pro/core-solid-rounded";
import type { ComponentType } from "react";
import { Icon } from "../providers/icon";

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
  <Icon icon={AiMail01Icon} size={14} {...props} />
);

export const Affiliate: ComponentType<{ className?: string }> = (props) => (
  <Icon icon={GiftIcon} size={14} {...props} />
);

export const ReviewBadge: ComponentType<{ className?: string }> = (props) => (
  <Icon icon={CheckmarkBadge01Icon} size={14} {...props} />
);

export const ApiKey: ComponentType<{ className?: string }> = (props) => (
  <Icon icon={Key01Icon} size={14} {...props} />
);
