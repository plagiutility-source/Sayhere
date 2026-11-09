"use client";

import { CRM_PAYMENT_METHOD_LABELS } from "@/lib/crm/config";
import {
  todayKey,
  type CrmPaymentMethod,
  type CrmServiceStatus,
} from "@/lib/crm/rules";

const DATE_FORMAT = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const SHORT_DATE_FORMAT = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
});

const DATE_TIME_FORMAT = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const MONEY_FORMAT = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatCrmDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : DATE_FORMAT.format(date);
}

export function formatCrmShortDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : SHORT_DATE_FORMAT.format(date);
}

export function formatCrmDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : DATE_TIME_FORMAT.format(date);
}

export function consentLabel(value: string): string {
  if (value === "opted_in") return "Opted in";
  if (value === "opted_out") return "Opted out";
  return "Unknown";
}

export function sourceLabel(value: string): string {
  switch (value) {
    case "import":
      return "CSV import";
    case "feedback":
      return "Feedback";
    case "loyalty":
      return "Loyalty";
    case "order":
      return "Order";
    default:
      return "Added manually";
  }
}

export function formatCrmMoney(value: number): string {
  return MONEY_FORMAT.format(Number.isFinite(value) ? value : 0);
}

export function contactInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function paymentStatusLabel(value: CrmServiceStatus): string {
  if (value === "paid") return "Paid";
  if (value === "partial") return "Part paid";
  return "Unpaid";
}

export function paymentMethodLabel(value: CrmPaymentMethod): string {
  return CRM_PAYMENT_METHOD_LABELS[value] ?? "Other";
}

export function activityLabel(value: string): string {
  switch (value) {
    case "call":
      return "Call";
    case "email":
      return "Email";
    case "visit":
      return "Visit";
    case "system":
      return "System";
    default:
      return "Note";
  }
}

export function dueLabel(value: string | null): string {
  if (!value) return "No due date";
  const today = todayKey(new Date());
  if (value < today) return `Overdue · ${formatCrmShortDate(`${value}T00:00:00`)}`;
  if (value === today) return "Due today";
  return `Due ${formatCrmShortDate(`${value}T00:00:00`)}`;
}

/** Browser download for the CRM export. The CSV is user data, never markup. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
