import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${(distance * 1000).toFixed(0)}m`;
  }
  return `${distance.toFixed(1)} km`;
}

export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'pending':
      return 'status-pending';
    case 'confirmed':
      return 'status-confirmed';
    case 'dispatched':
      return 'status-dispatched';
    case 'delivered':
      return 'status-delivered';
    case 'cancelled':
      return 'status-cancelled';
    default:
      return 'bg-neutral-100 text-neutral-800';
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function calculateDeliveryTime(distance: number): string {
  // Simple calculation: 5 mins + 2 mins per km
  const minTime = Math.floor(5 + distance * 2);
  const maxTime = Math.floor(minTime * 1.5);
  return `${minTime}-${maxTime}`;
}

export function getCategoryIcon(icon: string, color: string): string {
  return `fas fa-${icon} text-[${color}]`;
}

export function generateTimeSlots(): { value: string, label: string }[] {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const hourStr = hour.toString().padStart(2, '0');
      const minuteStr = minute.toString().padStart(2, '0');
      const timeStr = `${hourStr}:${minuteStr}`;
      // Format for display (12-hour format with AM/PM)
      const hour12 = hour % 12 || 12;
      const ampm = hour < 12 ? 'AM' : 'PM';
      const displayTime = `${hour12}:${minuteStr} ${ampm}`;
      slots.push({ value: timeStr, label: displayTime });
    }
  }
  return slots;
}

export function getCurrentLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser."));
    } else {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    }
  });
}

export function getInitials(name: string): string {
  if (!name) return '';
  const parts = name.split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
