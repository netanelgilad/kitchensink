# Coupon Code System Implementation

This document describes the implementation of the coupon code system for the Wix eCommerce cart.

## Features Implemented

✅ **Input field for coupon codes** - Users can enter promo codes
✅ **Apply coupon functionality** - Coupons are applied using Wix SDK
✅ **Remove coupon functionality** - Users can remove applied coupons
✅ **Updated totals calculation** - Pricing recalculates automatically when coupons are applied/removed
✅ **Loading states** - UI shows loading indicators during coupon operations
✅ **Error handling** - Displays error messages for invalid coupons
✅ **Visual feedback** - Shows applied coupon status with success styling

## Implementation Details

### Service Layer (`src/headless/ecom/services/current-cart-service.ts`)

**New Signals:**

- `isCouponLoading: Signal<boolean>` - Tracks coupon operation loading state

**New Methods:**

- `applyCoupon(couponCode: string): Promise<void>` - Applies coupon using `currentCart.updateCurrentCart()`
- `removeCoupon(): Promise<void>` - Removes coupon using `currentCart.removeCouponFromCurrentCart()`

**Integration:**

- Both methods automatically trigger `estimateTotals()` to recalculate pricing
- Error handling with user-friendly messages
- Loading states to prevent multiple simultaneous operations

### Headless Components (`src/headless/ecom/components/CurrentCart.tsx`)

**New Component: `CurrentCart.Coupon`**

- Provides coupon state and actions through render props
- Extracts applied coupon from cart data
- Exposes `appliedCoupon`, `onApply`, `onRemove`, `isLoading`, and `error`

**Updated Component: `CurrentCart.Summary`**

- Added `discount` field to `SummaryRenderProps`
- Automatically extracts discount amount from SDK totals
- Displays discount as formatted currency with proper styling

### UI Implementation

**Cart Page (`src/react-pages/cart.tsx`):**

- Inline `CouponInputForm` component with expand/collapse functionality
- Success state showing applied coupon with remove button
- Error display for coupon-related errors
- Discount line item in order summary (green text, negative amount)

**Store Layout (`src/layouts/StoreLayout.tsx`):**

- Mini `CouponFormMini` component for cart sidebar
- Compact design suitable for limited space
- Same functionality as full cart page

## Usage Examples

### Applying a Coupon

```tsx
<CurrentCart.Coupon>
  {({ appliedCoupon, onApply, onRemove, isLoading, error }) => (
    <div>
      {appliedCoupon ? (
        <div>
          <span>Coupon applied: {appliedCoupon}</span>
          <button onClick={onRemove}>Remove</button>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onApply(code);
          }}
        >
          <input placeholder="Enter promo code" />
          <button disabled={isLoading}>Apply</button>
        </form>
      )}
    </div>
  )}
</CurrentCart.Coupon>
```

### Displaying Discount in Summary

```tsx
<CurrentCart.Summary>
  {({ subtotal, discount, total }) => (
    <div>
      <div>Subtotal: {subtotal}</div>
      {discount && <div>Discount: -{discount}</div>}
      <div>Total: {total}</div>
    </div>
  )}
</CurrentCart.Summary>
```

## Technical Notes

- **SDK Integration**: Uses official Wix eCommerce SDK methods
- **Real-time Updates**: Totals recalculate automatically via `estimateTotals()`
- **Type Safety**: Full TypeScript support with proper interfaces
- **Error Handling**: Graceful error handling with user feedback
- **Performance**: Loading states prevent duplicate API calls
- **Accessibility**: Proper form semantics and disabled states

## Future Enhancements

Potential improvements that could be added:

- Coupon validation before submission
- Multiple coupon support (if supported by Wix)
- Coupon suggestion/autocomplete
- Coupon expiry date display
- Analytics tracking for coupon usage
