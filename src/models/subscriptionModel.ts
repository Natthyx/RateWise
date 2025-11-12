import { Timestamp } from "firebase-admin/firestore";

export interface Subscription {
    id: string;
    businessId: string;
    adminId: string;
    planType: 'monthly' | '6month' | 'yearly';
    startDate: Timestamp;
    endDate: Timestamp;
    status: 'active' | 'expiring_soon' | 'expired' | 'pending_payment' | 'payment_submitted' | 'payment_verified' | 'payment_rejected';
    receiptImageUrl?: string;
    paymentDate?: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}