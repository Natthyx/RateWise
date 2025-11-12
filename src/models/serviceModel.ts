import { Timestamp } from "firebase-admin/firestore";

export interface Business{
    id: string;
    name: string;
    description?: string;
    rating: number,
    reviewCount: number,
    adminId?: string,
    subscriptionId?: string;
    createdAt: Timestamp;
}
export interface Service{
    id: string;
    name: string;
    description?: string;
    rating: number,
    reviewCount: number,
    createdAt: Timestamp;
}
export interface Item {
    id: string;
    businessId: string; 
    serviceId: string;
    name: string;
    price: number;
    description?: string;
    category: string;
    imageUrl?: string;
    rating: number,
    reviewCount: number,
    createdAt: Timestamp;
}

export interface Category {
    id: string;
    businessId: string;
    serviceId: string;
    name: string;
    createdAt: Timestamp;
}