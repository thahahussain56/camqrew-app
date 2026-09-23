import { useSafeStripe as useStripe } from '../utils/stripeWrapper';
import { Alert } from 'react-native';

export const usePayment = () => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const handlePayment = async (amount: number, description: string): Promise<boolean> => {
    try {
      // 1. In a real app, you would make a fetch() request to your Node.js backend to get a PaymentIntent client secret.
      // const response = await fetch('https://your-api.com/create-payment-intent', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ amount, description }),
      // });
      // const { clientSecret } = await response.json();
      
      // MOCK: Generate a fake token or use a test one if you have a backend.
      // Since we don't have a backend to sign the Stripe Intent, we will simulate the success UI.
      // When keys are added, uncomment the real `initPaymentSheet` below.
      
      /*
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Camqrew India',
        paymentIntentClientSecret: clientSecret, // From backend
        allowsDelayedPaymentMethods: true,
        defaultBillingDetails: {
          name: 'Camqrew User',
        }
      });

      if (initError) {
        Alert.alert('Payment Setup Error', initError.message);
        return false;
      }

      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        Alert.alert('Payment Failed', presentError.message);
        return false;
      }
      */

      // Simulated Delay for demo purposes without backend
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return true;

    } catch (e: any) {
      console.warn(e);
      Alert.alert('Error', 'Something went wrong with the payment gateway.');
      return false;
    }
  };

  return { handlePayment };
};
