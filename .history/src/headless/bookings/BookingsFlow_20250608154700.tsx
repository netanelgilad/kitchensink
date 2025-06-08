import type { ServiceAPI } from "@wix/services-definitions";
import { useService } from "@wix/services-manager-react";
import { BookingsServiceDefinition, BookingStatus as BookingStatusEnum, BookingErrorCode } from "./bookings-service";
import { CheckoutServiceDefinition, CheckoutStatus as CheckoutStatusEnum, CheckoutErrorCode } from "./checkout-service";
import { services, availabilityCalendar } from "@wix/bookings";

/**
 * Props for ServicesList headless component
 */
export interface ServicesListProps {
  /** Render prop function that receives services data */
  children: (props: ServicesListRenderProps) => React.ReactNode;
}

/**
 * Render props for ServicesList component
 */
export interface ServicesListRenderProps {
  /** List of available services */
  services: services.Service[];
  /** Whether services are currently loading */
  isLoading: boolean;
  /** Error code if loading failed */
  errorCode: BookingErrorCode | null;
  /** Function to load services */
  loadServices: (serviceType?: services.ServiceType) => Promise<void>;
  /** Function to select a service */
  selectService: (service: services.Service) => void;
  /** Currently selected service */
  selectedService: services.Service | null;
}

/**
 * Headless component for displaying and managing services list
 */
const ServicesList = (props: ServicesListProps) => {
  const bookingsService = useService(
    BookingsServiceDefinition
  ) as ServiceAPI<typeof BookingsServiceDefinition>;

  const state = bookingsService.bookingState.get();
  const isLoading = state.status === BookingStatusEnum.LOADING_SERVICES;

  return props.children({
    services: state.services,
    isLoading,
    errorCode: state.errorCode,
    loadServices: bookingsService.loadServices,
    selectService: bookingsService.selectService,
    selectedService: state.selectedService,
  });
};

/**
 * Props for AvailabilitySlots headless component
 */
export interface AvailabilitySlotsProps {
  /** Render prop function that receives availability data */
  children: (props: AvailabilitySlotsRenderProps) => React.ReactNode;
}

/**
 * Render props for AvailabilitySlots component
 */
export interface AvailabilitySlotsRenderProps {
  /** List of available slots */
  slots: availabilityCalendar.SlotAvailability[];
  /** Whether slots are currently loading */
  isLoading: boolean;
  /** Error code if loading failed */
  errorCode: BookingErrorCode | null;
  /** Function to load availability for date range */
  loadAvailability: (startDate: Date, endDate: Date) => Promise<void>;
  /** Function to select a slot */
  selectSlot: (slot: availabilityCalendar.SlotAvailability) => void;
  /** Currently selected slot */
  selectedSlot: availabilityCalendar.SlotAvailability | null;
  /** Current date range being queried */
  dateRange: { startDate: Date; endDate: Date };
  /** Whether a service is selected */
  hasSelectedService: boolean;
  /** Selected service */
  selectedService: services.Service | null;
}

/**
 * Headless component for displaying and managing availability slots
 */
const AvailabilitySlots = (props: AvailabilitySlotsProps) => {
  const bookingsService = useService(
    BookingsServiceDefinition
  ) as ServiceAPI<typeof BookingsServiceDefinition>;

  const state = bookingsService.bookingState.get();
  const isLoading = state.status === BookingStatus.LOADING_AVAILABILITY;

  return props.children({
    slots: state.availableSlots,
    isLoading,
    errorCode: state.errorCode,
    loadAvailability: bookingsService.loadAvailability,
    selectSlot: bookingsService.selectSlot,
    selectedSlot: state.selectedSlot,
    dateRange: state.dateRange,
    hasSelectedService: Boolean(state.selectedService),
    selectedService: state.selectedService,
  });
};

/**
 * Props for BookingCheckout headless component
 */
export interface BookingCheckoutProps {
  /** Render prop function that receives checkout data */
  children: (props: BookingCheckoutRenderProps) => React.ReactNode;
}

/**
 * Render props for BookingCheckout component
 */
export interface BookingCheckoutRenderProps {
  /** Function to proceed to checkout */
  proceedToCheckout: () => Promise<void>;
  /** Whether checkout is currently processing */
  isProcessing: boolean;
  /** Checkout status */
  status: CheckoutStatus;
  /** Error code if checkout failed */
  errorCode: CheckoutErrorCode | null;
  /** Whether user can proceed to checkout */
  canProceed: boolean;
  /** Selected service for checkout */
  selectedService: services.Service | null;
  /** Selected slot for checkout */
  selectedSlot: availabilityCalendar.SlotAvailability | null;
}

/**
 * Headless component for managing booking checkout
 */
const BookingCheckout = (props: BookingCheckoutProps) => {
  const bookingsService = useService(
    BookingsServiceDefinition
  ) as ServiceAPI<typeof BookingsServiceDefinition>;
  
  const checkoutService = useService(
    CheckoutServiceDefinition
  ) as ServiceAPI<typeof CheckoutServiceDefinition>;

  const checkoutState = checkoutService.checkoutState.get();
  const canProceed = bookingsService.canProceedToBooking();
  const selectedService = bookingsService.getSelectedService();
  const selectedSlot = bookingsService.getSelectedSlot();

  return props.children({
    proceedToCheckout: checkoutService.proceedToCheckout,
    isProcessing: checkoutState.isProcessing,
    status: checkoutState.status,
    errorCode: checkoutState.errorCode,
    canProceed,
    selectedService,
    selectedSlot,
  });
};

/**
 * Props for BookingStatus headless component
 */
export interface BookingStatusProps {
  /** Render prop function that receives booking status data */
  children: (props: BookingStatusRenderProps) => React.ReactNode;
}

/**
 * Render props for BookingStatus component
 */
export interface BookingStatusRenderProps {
  /** Current booking status */
  status: BookingStatus;
  /** Current checkout status */
  checkoutStatus: CheckoutStatus;
  /** Whether any operation is loading */
  isLoading: boolean;
  /** Booking error code */
  bookingErrorCode: BookingErrorCode | null;
  /** Checkout error code */
  checkoutErrorCode: CheckoutErrorCode | null;
  /** Function to clear selection and start over */
  clearSelection: () => void;
  /** Current step in the booking process */
  currentStep: 'select-service' | 'select-slot' | 'checkout' | 'error';
}

/**
 * Headless component for tracking overall booking status
 */
const BookingStatus = (props: BookingStatusProps) => {
  const bookingsService = useService(
    BookingsServiceDefinition
  ) as ServiceAPI<typeof BookingsServiceDefinition>;
  
  const checkoutService = useService(
    CheckoutServiceDefinition
  ) as ServiceAPI<typeof CheckoutServiceDefinition>;

  const bookingState = bookingsService.bookingState.get();
  const checkoutState = checkoutService.checkoutState.get();
  const isLoading = bookingsService.isLoading() || checkoutService.isProcessing();

  // Determine current step
  let currentStep: 'select-service' | 'select-slot' | 'checkout' | 'error';
  if (bookingState.status === BookingStatus.ERROR || checkoutState.status === CheckoutStatus.ERROR) {
    currentStep = 'error';
  } else if (bookingState.selectedService && bookingState.selectedSlot) {
    currentStep = 'checkout';
  } else if (bookingState.selectedService) {
    currentStep = 'select-slot';
  } else {
    currentStep = 'select-service';
  }

  return props.children({
    status: bookingState.status,
    checkoutStatus: checkoutState.status,
    isLoading,
    bookingErrorCode: bookingState.errorCode,
    checkoutErrorCode: checkoutState.errorCode,
    clearSelection: bookingsService.clearSelection,
    currentStep,
  });
};

/**
 * Grouped export of all booking headless components
 */
export const BookingsFlow = {
  ServicesList,
  AvailabilitySlots,
  BookingCheckout,
  BookingStatus,
}; 