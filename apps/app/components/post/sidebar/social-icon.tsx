import { cn } from '@delulu/design-system/lib/utils';
import { type SocialType, SocialTypes } from '@delulu/validators/post';
import Image from 'next/image';
import { AiFillYoutube } from 'react-icons/ai';
import { AiOutlineTwitter } from 'react-icons/ai';
import {
  FaFacebook,
  FaGithub,
  FaInstagram,
  FaLinkedinIn,
} from 'react-icons/fa';

interface SocialIconProps {
  type: SocialType | 'DEFAULT';
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-7 w-7',
};

export const SocialIcon = ({ type, className, size }: SocialIconProps) => {
  const sizeClass = size ? sizeClasses[size] : '';

  if (type === SocialTypes.TWITTER) {
    return <AiOutlineTwitter className={cn('h-3 w-3', className, sizeClass)} />;
  }
  if (type === SocialTypes.LINKEDIN) {
    return <FaLinkedinIn className={cn('h-3 w-3', className, sizeClass)} />;
  }
  if (type === SocialTypes.YOUTUBE) {
    return <AiFillYoutube className={cn('h-3 w-3', className, sizeClass)} />;
  }
  if (type === SocialTypes.LENS) {
    return <Image src="/lens.svg" width={30} height={30} alt="lens" />;
  }
  if (type === SocialTypes.GITHUB) {
    return <FaGithub className={cn('h-3 w-3', className, sizeClass)} />;
  }
  if (type === SocialTypes.INSTAGRAM) {
    return <FaInstagram className={cn('h-3 w-3', className, sizeClass)} />;
  }
  if (type === SocialTypes.FACEBOOK) {
    return <FaFacebook className={cn('h-3 w-3', className, sizeClass)} />;
  }
  return null;
};
