'use client';

/**
 * Checkout Button Component
 *
 * A reusable button that initiates a Dodo Payments checkout session
 */

import { api } from '@delulu/database/convex/_generated/api';
import { Button } from '@delulu/design-system/components/ui/button';
import { useAction } from 'convex/react';
import { Icon } from '@delulu/design-system/providers/icon';
import { ArrowRight01Icon, CreditCardIcon } from '@hugeicons-pro/core-solid-rounded';
import { useState } from 'react';
import { toast } from 'sonner';

interface CheckoutButtonProps
  extends Omit<React.ComponentProps<'button'>, 'onClick' | 'disabled'> {
  productId: string;
  returnUrl?: string;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
  children?: React.ReactNode;
}

export function CheckoutButton({
  productId,
  returnUrl,
  onSuccess,
  onError,
  children,
  ...buttonProps
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const createCheckout = useAction(api.subscriptions.createCheckoutSession);

  const handleCheckout = async () => {
    try {
      setIsLoading(true);

      const { checkout_url } = await createCheckout({
        productId,
        returnUrl:
          returnUrl || `${window.location.origin}/billing?success=true`,
      });

      // Call success callback before redirect
      onSuccess?.();

      // Redirect to Dodo checkout
      window.location.href = checkout_url;
    } catch (error) {
      console.error('Checkout failed:', error);
      const err = error instanceof Error ? error : new Error('Checkout failed');

      // Call error callback
      onError?.(err);

      toast.error('Failed to start checkout. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleCheckout} disabled={isLoading} {...buttonProps}>
      {isLoading ? (
        'Loading...'
      ) : (
        <>
          {children || (
            <>
              <Icon icon={CreditCardIcon} size={16} className="mr-2" />
              Checkout
            </>
          )}
        </>
      )}
    </Button>
  );
}

/**
 * Quick upgrade button for plan changes
 */
interface UpgradeButtonProps extends Omit<CheckoutButtonProps, 'children'> {
  planName: string;
}

export function UpgradeButton({ planName, ...props }: UpgradeButtonProps) {
  return (
    <CheckoutButton {...props}>
      Upgrade to {planName}
      <Icon icon={ArrowRight01Icon} size={16} className="ml-2" />
    </CheckoutButton>
  );
}

/**
 * Subscription button with icon
 */
export function SubscribeButton(props: CheckoutButtonProps) {
  return (
    <CheckoutButton {...props}>
      {props.children || (
        <>
          Start Subscription
          <Icon icon={ArrowRight01Icon} size={16} className="ml-2" />
        </>
      )}
    </CheckoutButton>
  );
}
