import React, { useEffect } from 'react';
import { ServicesManagerProvider } from "@wix/services-manager-react";
import { createServicesManager, createServicesMap } from "@wix/services-manager";
import { BookingsFlow } from '../headless/bookings/BookingsFlow';
import { BookingsServiceDefinition, BookingsService, BookingStatus } from '../headless/bookings/bookings-service';
import { CheckoutServiceDefinition, CheckoutService } from '../headless/bookings/checkout-service';
import { services } from '@wix/bookings';
import { KitchensinkLayout } from '../layouts/KitchensinkLayout';

interface BookingsPageProps {
  bookingsConfig: any;
  checkoutConfig: any;
}

export default function BookingsPage({ bookingsConfig, checkoutConfig }: BookingsPageProps) {
  // Create services manager with both booking and checkout services
  const servicesManager = createServicesManager(
    createServicesMap()
      .addService(BookingsServiceDefinition, BookingsService, bookingsConfig)
      .addService(CheckoutServiceDefinition, CheckoutService, checkoutConfig)
  );

  return (
    <KitchensinkLayout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Book a Service</h1>
          <p className="text-lg text-gray-600">
            Choose from our available services and book your appointment online.
          </p>
        </div>

        <ServicesManagerProvider servicesManager={servicesManager}>
          <BookingFlowContainer />
        </ServicesManagerProvider>
      </div>
    </KitchensinkLayout>
  );
}

function BookingFlowContainer() {
  return (
    <BookingsFlow.BookingStatus>
      {({ currentStep, clearSelection, isLoading }) => (
        <div className="space-y-8">
          {/* Progress indicator */}
          <div className="flex items-center space-x-4 mb-8">
            <StepIndicator step={1} currentStep={currentStep} label="Select Service" />
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <StepIndicator step={2} currentStep={currentStep} label="Choose Time" />
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <StepIndicator step={3} currentStep={currentStep} label="Checkout" />
          </div>

          {/* Step 1: Service Selection */}
          {(currentStep === 'select-service' || currentStep === 'error') && (
            <ServiceSelectionStep />
          )}

          {/* Step 2: Slot Selection */}
          {currentStep === 'select-slot' && (
            <SlotSelectionStep />
          )}

          {/* Step 3: Checkout */}
          {currentStep === 'checkout' && (
            <CheckoutStep />
          )}

          {/* Back/Reset button */}
          {currentStep !== 'select-service' && (
            <div className="pt-4 border-t">
              <button
                onClick={clearSelection}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Start Over
              </button>
            </div>
          )}
        </div>
      )}
    </BookingsFlow.BookingStatus>
  );
}

function StepIndicator({ 
  step, 
  currentStep, 
  label 
}: { 
  step: number; 
  currentStep: string; 
  label: string; 
}) {
  const stepMap = {
    'select-service': 1,
    'select-slot': 2,
    'checkout': 3,
    'error': 1,
  };

  const currentStepNumber = stepMap[currentStep as keyof typeof stepMap];
  const isActive = step === currentStepNumber;
  const isCompleted = step < currentStepNumber;

  return (
    <div className="flex items-center">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          isActive
            ? 'bg-blue-600 text-white'
            : isCompleted
            ? 'bg-green-600 text-white'
            : 'bg-gray-300 text-gray-700'
        }`}
      >
        {isCompleted ? '✓' : step}
      </div>
      <span className="ml-2 text-sm font-medium text-gray-900">{label}</span>
    </div>
  );
}

function ServiceSelectionStep() {
  return (
    <BookingsFlow.ServicesList>
      {({ services, isLoading, loadServices, selectService, selectedService, errorCode }) => (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Select a Service</h2>
          
          {errorCode && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">
                Failed to load services. Please try again.
              </p>
            </div>
          )}

          <div className="mb-4">
            <button
              onClick={() => loadServices()}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Load Services'}
            </button>
          </div>

          {services.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {services.map((service) => (
                <ServiceCard
                  key={service._id}
                  service={service}
                  isSelected={selectedService?._id === service._id}
                  onSelect={() => selectService(service)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </BookingsFlow.ServicesList>
  );
}

function ServiceCard({ 
  service, 
  isSelected, 
  onSelect 
}: { 
  service: services.Service; 
  isSelected: boolean; 
  onSelect: () => void; 
}) {
  const price = service.payment?.fixed?.price || service.payment?.varied?.defaultPrice;
  
  return (
    <div
      className={`border rounded-lg p-4 cursor-pointer transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }`}
      onClick={onSelect}
    >
      <h3 className="font-semibold text-lg text-gray-900 mb-2">{service.name}</h3>
      {service.tagLine && (
        <p className="text-sm text-gray-600 mb-2">{service.tagLine}</p>
      )}
      {service.description && (
        <p className="text-sm text-gray-500 mb-3 line-clamp-3">{service.description}</p>
      )}
      {price && (
        <div className="text-sm font-medium text-gray-900">
          {price.formattedValue} {price.currency}
        </div>
      )}
      <div className="mt-3 text-xs text-gray-500 capitalize">
        {service.type?.toLowerCase()} • {service.schedule?.availabilityConstraints?.sessionDurations?.[0]} minutes
      </div>
    </div>
  );
}

function SlotSelectionStep() {
  return (
    <BookingsFlow.AvailabilitySlots>
      {({ 
        slots, 
        isLoading, 
        loadAvailability, 
        selectSlot, 
        selectedSlot, 
        dateRange,
        selectedService,
        errorCode
      }) => {
        useEffect(() => {
          // Auto-load availability when component mounts
          if (selectedService && slots.length === 0) {
            loadAvailability(dateRange.startDate, dateRange.endDate);
          }
        }, [selectedService, loadAvailability, dateRange.startDate, dateRange.endDate, slots.length]);

        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Choose Your Time</h2>
            
            {selectedService && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900">{selectedService.name}</h3>
                {selectedService.tagLine && (
                  <p className="text-sm text-gray-600">{selectedService.tagLine}</p>
                )}
              </div>
            )}

            {errorCode && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">
                  Failed to load availability. Please try again.
                </p>
              </div>
            )}

            {isLoading && (
              <div className="text-center py-8">
                <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-2 text-sm text-gray-600">Loading available times...</p>
              </div>
            )}

            {!isLoading && slots.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-600">No available slots for the selected date range.</p>
                <button
                  onClick={() => {
                    const newEndDate = new Date(dateRange.endDate);
                    newEndDate.setDate(newEndDate.getDate() + 7);
                    loadAvailability(dateRange.endDate, newEndDate);
                  }}
                  className="mt-3 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                >
                  Load Next Week
                </button>
              </div>
            )}

            {!isLoading && slots.length > 0 && (
              <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
                {slots.map((slot, index) => (
                  <SlotCard
                    key={`${slot.slot?.eventId}-${index}`}
                    slot={slot}
                    isSelected={selectedSlot?.slot?.eventId === slot.slot?.eventId}
                    onSelect={() => selectSlot(slot)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      }}
    </BookingsFlow.AvailabilitySlots>
  );
}

function SlotCard({ 
  slot, 
  isSelected, 
  onSelect 
}: { 
  slot: any; 
  isSelected: boolean; 
  onSelect: () => void; 
}) {
  const startTime = new Date(slot.slot?.startDate);
  const endTime = new Date(slot.slot?.endDate);

  return (
    <button
      onClick={onSelect}
      disabled={!slot.bookable}
      className={`p-3 text-left rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : slot.bookable
          ? 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
          : 'border-gray-100 bg-gray-50'
      }`}
    >
      <div className="text-sm font-medium text-gray-900">
        {startTime.toLocaleDateString()}
      </div>
      <div className="text-xs text-gray-600">
        {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
        {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
      {slot.openSpots !== undefined && (
        <div className="text-xs text-gray-500 mt-1">
          {slot.openSpots} spots available
        </div>
      )}
    </button>
  );
}

function CheckoutStep() {
  return (
    <BookingsFlow.BookingCheckout>
      {({ 
        proceedToCheckout, 
        isProcessing, 
        canProceed, 
        selectedService, 
        selectedSlot,
        errorCode
      }) => (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Confirm Your Booking</h2>
          
          {errorCode && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">
                Failed to proceed to checkout. Please try again.
              </p>
            </div>
          )}

          {selectedService && selectedSlot && (
            <div className="space-y-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">{selectedService.name}</h3>
                {selectedService.tagLine && (
                  <p className="text-sm text-gray-600 mb-2">{selectedService.tagLine}</p>
                )}
                
                <div className="text-sm text-gray-700">
                  <div className="flex justify-between items-center">
                    <span>Date & Time:</span>
                    <span className="font-medium">
                      {new Date(selectedSlot.slot?.startDate!).toLocaleString()}
                    </span>
                  </div>
                  
                  {selectedService.payment?.fixed?.price && (
                    <div className="flex justify-between items-center mt-2">
                      <span>Price:</span>
                      <span className="font-medium">
                        {selectedService.payment.fixed.price.formattedValue} {selectedService.payment.fixed.price.currency}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={proceedToCheckout}
                disabled={!canProceed || isProcessing}
                className="w-full px-6 py-3 text-lg font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Redirecting to Checkout...' : 'Proceed to Checkout'}
              </button>
            </div>
          )}
        </div>
      )}
    </BookingsFlow.BookingCheckout>
  );
} 