export type PlanCode = 'FREE' | 'PRO_MONTHLY' | 'PRO_QUARTERLY' | 'SCHOOL_SEAT';

export type EntitlementProvider = 'standalone' | 'voucher' | 'school' | 'convomate';

export type PaymentMethod = 'card_p2p' | 'voucher' | 'payme' | 'click' | 'lemon_squeezy';

export type BillingOrderStatus = 'pending' | 'paid' | 'rejected' | 'refunded';

export type BillingCurrency = 'UZS' | 'USD';

export interface BillingPlanSpec {
  code: PlanCode;
  name: string;
  tagline: string;
  durationDays: number;
  dailyLimit: number;
  priceUzs: number;
  priceUsd: number;
  badge?: string;
  features: string[];
}

export interface UserEntitlement {
  id: string;
  userId: string;
  provider: EntitlementProvider;
  planCode: PlanCode;
  status: 'active' | 'expired' | 'revoked';
  dailyLimit: number;
  startsAt: number;
  expiresAt: number | null;
  metadata?: Record<string, unknown>;
  updatedAt: number;
}

export interface BillingOrder {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  planCode: PlanCode;
  currency: BillingCurrency;
  amountPaid: number;
  amountUzs: number;
  amountUsd: number;
  paymentMethod: PaymentMethod;
  status: BillingOrderStatus;
  receiptNote?: string;
  receiptUrl?: string;
  externalRef?: string;
  createdAt: number;
  confirmedAt?: number;
}

export interface PromoVoucher {
  code: string;
  planCode: PlanCode;
  durationDays: number;
  dailyLimit: number;
  maxUses: number;
  usedCount: number;
  cohortId?: string;
  createdBy: string;
  expiresAt: number | null;
  isActive: boolean;
  createdAt: number;
}

export interface QuotaSnapshot {
  allowed: boolean;
  planCode: PlanCode | 'STAFF';
  limit: number;
  used: number;
  remaining: number;
  resetsInHours: number;
  resetsAt: number;
}

export interface BillingStatusSummary {
  plans: BillingPlanSpec[];
  p2pPaymentInfo: {
    configured: boolean;
    cardNumber: string;
    cardHolder: string;
    bankName: string;
  };
  activeEntitlement: UserEntitlement | null;
  quota: QuotaSnapshot;
  recentOrders: BillingOrder[];
}

export interface AdminBillingOverview {
  totalRevenueUzs: number;
  totalRevenueUsd: number;
  pendingOrdersCount: number;
  activeEntitlementsCount: number;
  totalOrdersCount: number;
  totalVouchersCount: number;
  orders: BillingOrder[];
  vouchers: PromoVoucher[];
}

