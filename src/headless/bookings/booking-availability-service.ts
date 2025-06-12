import {
  defineService,
  implementService,
  type ServiceFactoryConfig,
} from "@wix/services-definitions";
import { SignalsServiceDefinition } from "@wix/services-definitions/core-services/signals";
import type { Signal } from "../Signal";
import { availabilityCalendar } from "@wix/bookings";
import { siteProperties } from "@wix/business-tools";

export type TimezoneSource = "user" | "business";

export interface BookingAvailabilityServiceAPI {
  slots: Signal<availabilityCalendar.SlotAvailability[]>;
  selectedDate: Signal<Date>;
  isLoading: Signal<boolean>;
  error: Signal<string | null>;
  serviceId: Signal<string | null>;
  timezone: Signal<string>;
  hasSlots: () => boolean;
  slotsForSelectedDate: () => availabilityCalendar.SlotAvailability[];
  availableDates: () => Date[];
  loadSlots: (startDate: Date, endDate: Date) => Promise<void>;
  selectDate: (date: Date) => void;
  setService: (serviceId: string) => void;
  refreshSlots: () => Promise<void>;
}

export const BookingAvailabilityServiceDefinition =
  defineService<BookingAvailabilityServiceAPI>("bookingAvailabilityService");

export const BookingAvailabilityService = implementService.withConfig<{
  serviceId: string;
  timezone: string;
  initialSlots?: availabilityCalendar.SlotAvailability[];
}>()(BookingAvailabilityServiceDefinition, ({ getService, config }) => {
  const signalsService = getService(SignalsServiceDefinition);

  // State signals
  const slots: Signal<availabilityCalendar.SlotAvailability[]> =
    signalsService.signal(config.initialSlots || ([] as any));
  const selectedDate: Signal<Date> = signalsService.signal(new Date() as any);
  const isLoading: Signal<boolean> = signalsService.signal(false as any);
  const error: Signal<string | null> = signalsService.signal(null as any);
  const serviceId: Signal<string | null> = signalsService.signal(
    config.serviceId || (null as any)
  );
  const timezone: Signal<string> = signalsService.signal(
    config.timezone || ("UTC" as any)
  );

  // Computed functions
  const hasSlots = (): boolean => {
    return slots.get().length > 0;
  };

  const slotsForSelectedDate = (): availabilityCalendar.SlotAvailability[] => {
    const selected = selectedDate.get();
    const selectedDateString = selected.toISOString().split("T")[0];

    return slots.get().filter((slot) => {
      const slotDate = new Date(slot.slot?.startDate || "")
        .toISOString()
        .split("T")[0];
      return slotDate === selectedDateString;
    });
  };

  const availableDates = (): Date[] => {
    const dateSet = new Set<string>();
    slots.get().forEach((slot) => {
      if (slot.slot?.startDate) {
        const date = new Date(slot.slot.startDate).toISOString().split("T")[0];
        dateSet.add(date);
      }
    });
    return Array.from(dateSet)
      .map((date) => new Date(date))
      .sort((a, b) => a.getTime() - b.getTime());
  };

  // Actions
  const loadSlots = async (startDate: Date, endDate: Date): Promise<void> => {
    const currentServiceId = serviceId.get();
    if (!currentServiceId) {
      error.set("No service selected");
      return;
    }

    try {
      isLoading.set(true);
      error.set(null);

      const query = {
        sort: [
          {
            fieldName: "startTime",
            order: availabilityCalendar.SortOrder.ASC,
          },
        ],
        filter: {
          serviceId: [currentServiceId],
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          bookable: true, // Only show bookable slots
        },
      };

      const slotsPerDay = 20;
      const currentTimezone = timezone.get();

      const queryResponse = await availabilityCalendar.queryAvailability(
        query,
        {
          timezone: currentTimezone,
          slotsPerDay: slotsPerDay,
        }
      );

      slots.set(queryResponse.availabilityEntries || []);
    } catch (err) {
      console.error("Failed to load availability:", err);
      error.set("Failed to load availability");
    } finally {
      isLoading.set(false);
    }
  };

  const selectDate = (date: Date): void => {
    selectedDate.set(date);
  };

  const setService = (newServiceId: string): void => {
    serviceId.set(newServiceId);
    // Clear existing slots when service changes
    slots.set([]);
  };

  const refreshSlots = async (): Promise<void> => {
    const selected = selectedDate.get();
    const startDate = new Date(selected);
    startDate.setDate(startDate.getDate() - 1); // Start from yesterday

    const endDate = new Date(selected);
    endDate.setDate(endDate.getDate() + 30); // Look ahead 30 days

    await loadSlots(startDate, endDate);
  };

  const setTimezone = (newTimezone: string): void => {
    timezone.set(newTimezone);
    refreshSlots();
  };

  return {
    slots,
    selectedDate,
    isLoading,
    error,
    serviceId,
    timezone,
    hasSlots,
    slotsForSelectedDate,
    availableDates,
    loadSlots,
    selectDate,
    setService,
    refreshSlots,
    setTimezone,
  };
});

async function getBusinessTimezone(): Promise<string> {
  try {
    const response = await siteProperties.getSiteProperties();
    return response.properties?.timeZone || "UTC";
  } catch (e) {
    console.error("Failed to get business timezone, falling back to UTC", e);
    return "UTC";
  }
}

export async function loadBookingAvailabilityServiceConfig(
  serviceId: string,
  requestedTimezone?: string
): Promise<ServiceFactoryConfig<typeof BookingAvailabilityService>> {
  const timezone = requestedTimezone || (await getBusinessTimezone());
  try {
    if (serviceId) {
      // Load initial slots for the next 30 days
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      const query = {
        sort: [
          {
            fieldName: "startTime",
            order: availabilityCalendar.SortOrder.ASC,
          },
        ],
        filter: {
          serviceId: [serviceId],
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          bookable: true,
        },
      };

      const queryResponse = await availabilityCalendar.queryAvailability(
        query,
        {
          timezone,
          slotsPerDay: 20,
        }
      );

      return {
        serviceId,
        timezone,
        initialSlots: queryResponse.availabilityEntries || [],
      };
    }

    return {
      serviceId,
      timezone,
      initialSlots: [],
    };
  } catch (error) {
    console.error("Failed to load initial availability:", error);
    return {
      serviceId,
      timezone,
      initialSlots: [],
    };
  }
}
