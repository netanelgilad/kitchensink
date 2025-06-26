import {
  defineService,
  implementService,
  type ServiceFactoryConfig,
} from "@wix/services-definitions";
import type { ReadOnlySignal } from "@wix/services-definitions";
import { SignalsServiceDefinition } from "@wix/services-definitions/core-services/signals";
import type { Signal } from "../../Signal";
import { currentCart, checkout } from "@wix/ecom";
import { redirects } from "@wix/redirects";

export interface CurrentCartServiceAPI {
  cart: Signal<currentCart.Cart | null>;
  isOpen: Signal<boolean>;
  isLoading: Signal<boolean>;
  error: Signal<string | null>;
  cartCount: ReadOnlySignal<number>;
  buyerNotes: Signal<string>;
  cartTotals: Signal<any | null>;

  addToCart: (
    lineItems: currentCart.AddToCurrentCartRequest["lineItems"]
  ) => Promise<void>;
  removeLineItem: (lineItemId: string) => Promise<void>;
  updateLineItemQuantity: (
    lineItemId: string,
    quantity: number
  ) => Promise<void>;
  increaseLineItemQuantity: (lineItemId: string) => Promise<void>;
  decreaseLineItemQuantity: (lineItemId: string) => Promise<void>;
  openCart: () => void;
  closeCart: () => void;
  clearCart: () => Promise<void>;
  setBuyerNotes: (notes: string) => Promise<void>;
  proceedToCheckout: () => Promise<void>;
  estimateTotals: () => Promise<void>;
}

export const CurrentCartServiceDefinition =
  defineService<CurrentCartServiceAPI>("currentCart");

export const CurrentCartService = implementService.withConfig<{
  initialCart?: currentCart.Cart | null;
}>()(CurrentCartServiceDefinition, ({ getService, config }) => {
  const signalsService = getService(SignalsServiceDefinition);

  const cart: Signal<currentCart.Cart | null> = signalsService.signal(
    config.initialCart || (null as any)
  );
  const isOpen: Signal<boolean> = signalsService.signal(false as any);
  const isLoading: Signal<boolean> = signalsService.signal(false as any);
  const error: Signal<string | null> = signalsService.signal(null as any);
  const buyerNotes: Signal<string> = signalsService.signal("" as any);
  const cartTotals: Signal<any | null> = signalsService.signal(null as any);

  const cartCount: ReadOnlySignal<number> = signalsService.computed(() => {
    const currentCart = cart.get();
    if (!currentCart?.lineItems) return 0;
    return currentCart.lineItems.reduce(
      (acc: number, item: any) => acc + (item.quantity || 0),
      0
    );
  });

  const addToCart = async (
    lineItems: currentCart.AddToCurrentCartRequest["lineItems"]
  ) => {
    try {
      isLoading.set(true);
      error.set(null);

      const { cart: updatedCart } = await currentCart.addToCurrentCart({
        lineItems,
      });
      cart.set(updatedCart || null);

      // Estimate totals after cart update
      if (updatedCart) {
        await estimateTotals();
      }
    } catch (err) {
      error.set(err instanceof Error ? err.message : "Failed to add to cart");
    } finally {
      isLoading.set(false);
    }
  };

  const removeLineItem = async (lineItemId: string) => {
    try {
      isLoading.set(true);
      error.set(null);

      const { cart: updatedCart } =
        await currentCart.removeLineItemsFromCurrentCart([lineItemId]);
      cart.set(updatedCart || null);

      // Estimate totals after cart update
      if (updatedCart) {
        await estimateTotals();
      }
    } catch (err) {
      error.set(err instanceof Error ? err.message : "Failed to remove item");
    } finally {
      isLoading.set(false);
    }
  };

  const updateLineItemQuantity = async (
    lineItemId: string,
    quantity: number
  ) => {
    try {
      isLoading.set(true);
      error.set(null);

      const { cart: updatedCart } =
        await currentCart.updateCurrentCartLineItemQuantity([
          {
            _id: lineItemId,
            quantity,
          },
        ]);
      cart.set(updatedCart || null);

      // Estimate totals after cart update
      if (updatedCart) {
        await estimateTotals();
      }
    } catch (err) {
      error.set(
        err instanceof Error ? err.message : "Failed to update quantity"
      );
    } finally {
      isLoading.set(false);
    }
  };

  const increaseLineItemQuantity = async (lineItemId: string) => {
    const currentCart = cart.get();
    const lineItem = currentCart?.lineItems?.find(
      (item: any) => item._id === lineItemId
    );
    if (lineItem) {
      await updateLineItemQuantity(lineItemId, (lineItem.quantity || 0) + 1);
    }
  };

  const decreaseLineItemQuantity = async (lineItemId: string) => {
    const currentCart = cart.get();
    const lineItem = currentCart?.lineItems?.find(
      (item: any) => item._id === lineItemId
    );
    if (lineItem && (lineItem.quantity || 0) > 1) {
      await updateLineItemQuantity(lineItemId, (lineItem.quantity || 0) - 1);
    }
  };

  const openCart = () => {
    isOpen.set(true);
  };

  const closeCart = () => {
    isOpen.set(false);
  };

  const clearCart = async () => {
    try {
      isLoading.set(true);
      error.set(null);

      const currentCartData = cart.get();
      if (currentCartData?.lineItems?.length) {
        const lineItemIds = currentCartData.lineItems
          .map((item: any) => item._id!)
          .filter(Boolean);
        const { cart: updatedCart } =
          await currentCart.removeLineItemsFromCurrentCart(lineItemIds);
        cart.set(updatedCart || null);

        // Clear totals when cart is empty
        cartTotals.set(null);
      }
    } catch (err) {
      error.set(err instanceof Error ? err.message : "Failed to clear cart");
    } finally {
      isLoading.set(false);
    }
  };

  const setBuyerNotes = async (notes: string) => {
    buyerNotes.set(notes);
  };

  const proceedToCheckout = async () => {
    try {
      isLoading.set(true);
      error.set(null);

      const notes = buyerNotes.get();
      if (notes) {
        try {
          const updatedCart = await currentCart.updateCurrentCart({
            cartInfo: {
              buyerNote: notes,
            },
          });
          cart.set(updatedCart);
        } catch (noteError) {
          console.warn("Failed to add buyer notes to cart:", noteError);
        }
      }

      const checkoutResult = await currentCart.createCheckoutFromCurrentCart({
        channelType: checkout.ChannelType.WEB,
      });

      if (!checkoutResult.checkoutId) {
        throw new Error("Failed to create checkout");
      }

      const { redirectSession } = await redirects.createRedirectSession({
        ecomCheckout: { checkoutId: checkoutResult.checkoutId },
        preferences: { useGenericWixPages: false },
        callbacks: {
          postFlowUrl: window.location.href,
          cartPageUrl: window.location.origin + "/cart",
        },
      });

      if (redirectSession?.fullUrl) {
        window.location.href = redirectSession.fullUrl;
      }
    } catch (err) {
      error.set(
        err instanceof Error ? err.message : "Failed to proceed to checkout"
      );
    } finally {
      isLoading.set(false);
    }
  };

  const estimateTotals = async () => {
    try {
      isLoading.set(true);
      error.set(null);

      const totalsResponse = await currentCart.estimateCurrentCartTotals();
      cartTotals.set(totalsResponse || null);
    } catch (err) {
      error.set(
        err instanceof Error ? err.message : "Failed to estimate totals"
      );
    } finally {
      isLoading.set(false);
    }
  };

  // Initialize totals if we have an initial cart
  if (config.initialCart?.lineItems?.length) {
    // Estimate totals asynchronously without blocking initialization
    setTimeout(() => {
      estimateTotals().catch(console.warn);
    }, 0);
  }

  return {
    cart,
    isOpen,
    cartCount,
    isLoading,
    error,
    buyerNotes,
    cartTotals,
    addToCart,
    removeLineItem,
    updateLineItemQuantity,
    increaseLineItemQuantity,
    decreaseLineItemQuantity,
    openCart,
    closeCart,
    clearCart,
    setBuyerNotes,
    proceedToCheckout,
    estimateTotals,
  };
});

export async function loadCurrentCartServiceConfig(): Promise<
  ServiceFactoryConfig<typeof CurrentCartService>
> {
  try {
    const cartData = await currentCart.getCurrentCart();

    // If we have a cart with items, estimate totals
    if (cartData?.lineItems?.length) {
      try {
        const totalsResponse = await currentCart.estimateCurrentCartTotals();
        // We can't return the totals here as they need to be set in the service
        // The service will estimate totals when it initializes
      } catch (error) {
        console.warn("Failed to estimate initial cart totals:", error);
      }
    }

    return {
      initialCart: cartData || null,
    };
  } catch (error) {
    console.warn("Failed to load initial cart:", error);
    return {
      initialCart: null,
    };
  }
}
