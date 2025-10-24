export interface Business{
    id: string;
    name: string;
    description?: string;
    rating: number,
    reviewCount: number,
    adminId?: string,
    createdAt: Date;
}
export interface Service{
    id: string;
    name: string;
    description?: string;
    rating: number,
    reviewCount: number,
    createdAt: Date;
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
    createdAt: Date;
}


