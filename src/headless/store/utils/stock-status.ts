// Utility function to determine stock status from inventory availability
export const getStockStatus = (availabilityStatus: string) => {
  const normalizedStatus = String(availabilityStatus || "").toLowerCase();

  switch (normalizedStatus) {
    case "in_stock":
    case "IN_STOCK":
      return {
        status: "In Stock",
        color: "text-green-400",
        dotColor: "bg-green-500",
        available: true,
      };
    case "out_of_stock":
    case "OUT_OF_STOCK":
      return {
        status: "Out of Stock",
        color: "text-red-400",
        dotColor: "bg-red-500",
        available: false,
      };
    case "partially_out_of_stock":
    case "PARTIALLY_OUT_OF_STOCK":
      return {
        status: "Partially out of stock",
        color: "text-yellow-400",
        dotColor: "bg-yellow-500",
        available: true,
      };
    default:
      // Fallback for unknown status - assume out of stock for safety
      return {
        status: "Out of Stock",
        color: "text-red-400",
        dotColor: "bg-red-500",
        available: false,
      };
  }
};

// Note: Filter display names are handled directly by the catalog options service
// which already provides human-readable names for inventory filter choices
