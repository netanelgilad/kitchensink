import { useState } from "react";

interface CouponInputProps {
  appliedCoupon?: string | null;
  onApply: (code: string) => void;
  onRemove: () => void;
  isLoading?: boolean;
  className?: string;
}

export default function CouponInput({
  appliedCoupon,
  onApply,
  onRemove,
  isLoading = false,
  className = "",
}: CouponInputProps) {
  const [code, setCode] = useState("");
  const [isExpanded, setIsExpanded] = useState(!!appliedCoupon);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      onApply(code.trim());
      setCode("");
    }
  };

  if (appliedCoupon) {
    return (
      <div
        className={`flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg ${className}`}
      >
        <div className="flex items-center">
          <span className="text-green-600 text-sm font-medium">
            Coupon applied: {appliedCoupon}
          </span>
        </div>
        <button
          onClick={onRemove}
          disabled={isLoading}
          className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
        >
          {isLoading ? "Removing..." : "Remove"}
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          Have a promo code?
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter promo code"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!code.trim() || isLoading}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Applying..." : "Apply"}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
}
