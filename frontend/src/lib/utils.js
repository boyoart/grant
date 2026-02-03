import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount).replace('NGN', '₦');
}

export function formatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function getStatusLabel(status) {
  const labels = {
    pending_payment: "Pending Payment",
    confirmed: "Confirmed",
    packing: "Packing",
    ready_for_pickup: "Ready for Pickup",
    out_for_delivery: "Out for Delivery",
    picked_up: "Picked Up",
    delivered: "Delivered",
    completed: "Completed",
    cancelled: "Cancelled"
  };
  return labels[status] || status;
}

export function getStatusColor(status) {
  const colors = {
    pending_payment: "bg-amber-100 text-amber-800",
    confirmed: "bg-blue-100 text-blue-800",
    packing: "bg-purple-100 text-purple-800",
    ready_for_pickup: "bg-green-100 text-green-800",
    out_for_delivery: "bg-cyan-100 text-cyan-800",
    picked_up: "bg-emerald-100 text-emerald-800",
    delivered: "bg-emerald-100 text-emerald-800",
    completed: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-red-100 text-red-800"
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

export function getNextStatuses(currentStatus, fulfillmentType) {
  const pickupFlow = {
    pending_payment: ["confirmed", "cancelled"],
    confirmed: ["packing", "cancelled"],
    packing: ["ready_for_pickup", "cancelled"],
    ready_for_pickup: ["picked_up", "cancelled"],
    picked_up: ["completed"],
    completed: [],
    cancelled: []
  };

  const deliveryFlow = {
    pending_payment: ["confirmed", "cancelled"],
    confirmed: ["packing", "cancelled"],
    packing: ["out_for_delivery", "cancelled"],
    out_for_delivery: ["delivered", "cancelled"],
    delivered: ["completed"],
    completed: [],
    cancelled: []
  };

  const flow = fulfillmentType === "pickup" ? pickupFlow : deliveryFlow;
  return flow[currentStatus] || [];
}
