import React from 'react';
import { NativeModules } from 'react-native';

let StripeProviderComponent: React.ComponentType<any> = ({ children }) => <>{children}</>;
let useStripeHook = () => ({
  initPaymentSheet: async () => ({ error: null }),
  presentPaymentSheet: async () => ({ error: null }),
  confirmPayment: async () => ({ error: null }),
});

try {
  // Check if native Stripe module is actually linked in the runtime binary (won't be in Expo Go)
  const isLinked = Boolean(
    NativeModules.StripeSdk || 
    (globalThis as any)?.__turboModuleProxy?.('StripeSdk')
  );
  if (isLinked) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const StripePkg = require('@stripe/stripe-react-native');
    if (StripePkg?.StripeProvider) {
      StripeProviderComponent = StripePkg.StripeProvider;
    }
    if (StripePkg?.useStripe) {
      useStripeHook = StripePkg.useStripe;
    }
  }
} catch {
  // Running in Expo Go, fallback provider is used
}

export const SafeStripeProvider = StripeProviderComponent;
export const useSafeStripe = useStripeHook;
