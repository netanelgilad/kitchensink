import {
  defineService,
  implementService,
  type ServiceFactoryConfig,
} from "@wix/services-definitions";
import { redirects } from "@wix/redirects";
import { availabilityCalendar } from "@wix/bookings";
import { SignalsServiceDefinition } from "@wix/services-definitions/core-services/signals";
import { BookingsServiceDefinition } from "./bookings-service";
import type { Signal } from "../Signal";

export enum CheckoutStatus {
  IDLE = "IDLE",
  REDIRECTING = "REDIRECTING",
  ERROR = "ERROR",
}

export enum CheckoutErrorCode {
  NO_SLOT_SELECTED = "NO_SLOT_SELECTED",
  REDIRECT_CREATION_FAILED = "REDIRECT_CREATION_FAILED",
  NAVIGATION_FAILED = "NAVIGATION_FAILED",
}

export interface CheckoutState {
  status: CheckoutStatus;
  errorCode: CheckoutErrorCode | null;
  isProcessing: boolean;
}

export const CheckoutServiceDefinition = defineService<{
  checkoutState: Signal<CheckoutState>;
  proceedToCheckout: () => Promise<void>;
  getStatus: () => CheckoutStatus;
  getErrorCode: () => CheckoutErrorCode | null;
  isProcessing: () => boolean;
}>("checkout");

export const CheckoutService = implementService.withConfig<{
  returnUrl: string;
  timezone: string;
}>()(CheckoutServiceDefinition, ({ getService, config }) => {
  const signalsService = getService(SignalsServiceDefinition);
  const bookingsService = getService(BookingsServiceDefinition);

  const initialState: CheckoutState = {
    status: CheckoutStatus.IDLE,
    errorCode: null,
    isProcessing: false,
  };

  const checkoutState: Signal<CheckoutState> = signalsService.signal(
    initialState as any
  );

  const updateState = (updates: Partial<CheckoutState>) => {
    const currentState = checkoutState.get();
    checkoutState.set({ ...currentState, ...updates });
  };

  const proceedToCheckout = async () => {
    const selectedSlot = bookingsService.getSelectedSlot();
    
    if (!selectedSlot) {
      updateState({
        status: CheckoutStatus.ERROR,
        errorCode: CheckoutErrorCode.NO_SLOT_SELECTED,
        isProcessing: false,
      });
      throw new Error("No slot selected for checkout");
    }

    updateState({
      status: CheckoutStatus.REDIRECTING,
      errorCode: null,
      isProcessing: true,
    });

    try {
      const redirectResponse = await redirects.createRedirectSession({
        bookingsCheckout: {
          slotAvailability: selectedSlot,
          timezone: config.timezone,
        },
        callbacks: {
          postFlowUrl: config.returnUrl,
        },
      });

      // Navigate to the checkout URL
      if (typeof window !== 'undefined') {
        window.location.href = redirectResponse.redirectSession!.fullUrl!;
      } else {
        throw new Error("Window object not available");
      }

    } catch (error) {
      updateState({
        status: CheckoutStatus.ERROR,
        errorCode: CheckoutErrorCode.REDIRECT_CREATION_FAILED,
        isProcessing: false,
      });
      throw error;
    }
  };

  const getStatus = () => checkoutState.get().status;
  const getErrorCode = () => checkoutState.get().errorCode;
  const isProcessing = () => checkoutState.get().isProcessing;

  return {
    checkoutState,
    proceedToCheckout,
    getStatus,
    getErrorCode,
    isProcessing,
  };
});

export async function loadCheckoutServiceConfig(
  returnUrl: string
): Promise<ServiceFactoryConfig<typeof CheckoutService>> {
  // Get the system timezone
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  return {
    returnUrl,
    timezone,
  };
} 