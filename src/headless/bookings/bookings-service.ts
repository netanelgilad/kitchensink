import {
  defineService,
  implementService,
  type ServiceFactoryConfig,
} from "@wix/services-definitions";
import { services, availabilityCalendar } from "@wix/bookings";
import { SignalsServiceDefinition } from "@wix/services-definitions/core-services/signals";
import type { Signal } from "../Signal";

export enum BookingStatus {
  IDLE = "IDLE",
  LOADING_SERVICES = "LOADING_SERVICES",
  LOADING_AVAILABILITY = "LOADING_AVAILABILITY",
  SERVICE_SELECTED = "SERVICE_SELECTED",
  SLOT_SELECTED = "SLOT_SELECTED",
  ERROR = "ERROR",
}

export enum BookingErrorCode {
  SERVICES_LOAD_FAILED = "SERVICES_LOAD_FAILED",
  AVAILABILITY_LOAD_FAILED = "AVAILABILITY_LOAD_FAILED",
  REDIRECT_FAILED = "REDIRECT_FAILED",
}

export interface BookingState {
  services: services.Service[];
  selectedService: services.Service | null;
  availableSlots: availabilityCalendar.SlotAvailability[];
  selectedSlot: availabilityCalendar.SlotAvailability | null;
  status: BookingStatus;
  errorCode: BookingErrorCode | null;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  timezone: string;
}

export const BookingsServiceDefinition = defineService<{
  bookingState: Signal<BookingState>;
  loadServices: (serviceType?: services.ServiceType) => Promise<void>;
  selectService: (service: services.Service) => void;
  loadAvailability: (startDate: Date, endDate: Date) => Promise<void>;
  selectSlot: (slot: availabilityCalendar.SlotAvailability) => void;
  clearSelection: () => void;
  getSelectedService: () => services.Service | null;
  getSelectedSlot: () => availabilityCalendar.SlotAvailability | null;
  getAvailableSlots: () => availabilityCalendar.SlotAvailability[];
  getServices: () => services.Service[];
  getStatus: () => BookingStatus;
  getErrorCode: () => BookingErrorCode | null;
  isLoading: () => boolean;
  canProceedToBooking: () => boolean;
}>("bookings");

export const BookingsService = implementService.withConfig<{
  timezone: string;
  initialServices?: services.Service[];
}>()(BookingsServiceDefinition, ({ getService, config }) => {
  const signalsService = getService(SignalsServiceDefinition);
  
  const initialState: BookingState = {
    services: config.initialServices || [],
    selectedService: null,
    availableSlots: [],
    selectedSlot: null,
    status: BookingStatus.IDLE,
    errorCode: null,
    dateRange: {
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
    timezone: config.timezone,
  };

  const bookingState: Signal<BookingState> = signalsService.signal(
    initialState as any
  );

  const updateState = (updates: Partial<BookingState>) => {
    const currentState = bookingState.get();
    bookingState.set({ ...currentState, ...updates });
  };

  const loadServices = async (serviceType?: services.ServiceType) => {
    updateState({ status: BookingStatus.LOADING_SERVICES, errorCode: null });

    try {
      let query = services.queryServices();
      
      if (serviceType) {
        query = query.eq('type', serviceType);
      }

      const result = await query.find();
      
      updateState({
        services: result.items,
        status: BookingStatus.IDLE,
      });
    } catch (error) {
      updateState({
        status: BookingStatus.ERROR,
        errorCode: BookingErrorCode.SERVICES_LOAD_FAILED,
      });
      throw error;
    }
  };

  const selectService = (service: services.Service) => {
    updateState({
      selectedService: service,
      selectedSlot: null,
      availableSlots: [],
      status: BookingStatus.SERVICE_SELECTED,
      errorCode: null,
    });
  };

  const loadAvailability = async (startDate: Date, endDate: Date) => {
    const state = bookingState.get();
    if (!state.selectedService) {
      throw new Error("No service selected");
    }

    updateState({ 
      status: BookingStatus.LOADING_AVAILABILITY, 
      errorCode: null,
      dateRange: { startDate, endDate },
    });

    try {
      const query = {
        sort: [
          {
            fieldName: 'startTime',
            order: availabilityCalendar.SortOrder.ASC,
          },
        ],
        filter: {
          serviceId: [state.selectedService._id!],
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          bookable: true, // Only return bookable slots
        },
      };

      const response = await availabilityCalendar.queryAvailability(query, {
        timezone: state.timezone,
        slotsPerDay: 20,
      });

      updateState({
        availableSlots: response.availabilityEntries,
        status: BookingStatus.SERVICE_SELECTED,
      });
    } catch (error) {
      updateState({
        status: BookingStatus.ERROR,
        errorCode: BookingErrorCode.AVAILABILITY_LOAD_FAILED,
      });
      throw error;
    }
  };

  const selectSlot = (slot: availabilityCalendar.SlotAvailability) => {
    updateState({
      selectedSlot: slot,
      status: BookingStatus.SLOT_SELECTED,
      errorCode: null,
    });
  };

  const clearSelection = () => {
    updateState({
      selectedService: null,
      selectedSlot: null,
      availableSlots: [],
      status: BookingStatus.IDLE,
      errorCode: null,
    });
  };

  const getSelectedService = () => bookingState.get().selectedService;
  const getSelectedSlot = () => bookingState.get().selectedSlot;
  const getAvailableSlots = () => bookingState.get().availableSlots;
  const getServices = () => bookingState.get().services;
  const getStatus = () => bookingState.get().status;
  const getErrorCode = () => bookingState.get().errorCode;
  
  const isLoading = () => {
    const status = getStatus();
    return status === BookingStatus.LOADING_SERVICES || 
           status === BookingStatus.LOADING_AVAILABILITY;
  };

  const canProceedToBooking = () => {
    const state = bookingState.get();
    return Boolean(state.selectedService && state.selectedSlot);
  };

  return {
    bookingState,
    loadServices,
    selectService,
    loadAvailability,
    selectSlot,
    clearSelection,
    getSelectedService,
    getSelectedSlot,
    getAvailableSlots,
    getServices,
    getStatus,
    getErrorCode,
    isLoading,
    canProceedToBooking,
  };
});

export async function loadBookingsServiceConfig(): Promise<
  ServiceFactoryConfig<typeof BookingsService>
> {
  // Get the system timezone or business timezone
  // For now, using browser timezone as default
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  return {
    timezone,
    initialServices: [], // Services will be loaded on demand
  };
} 