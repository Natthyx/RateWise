export interface Service{
    id: string;
    name: string;
    description?: string;
    rating: number,
    reviewCount: number,
    createdAt: Date;
}
export interface SubService{
    id: string;
    name: string;
    description?: string;
    rating: number,
    reviewCount: number,
    createdAt: Date;
}
export interface Item {
    id: string;
    serviceId: string; 
    subServiceId: string;
    name: string;
    price: number;
    description?: string;
    category: string;
    imageUrl?: string;
    rating: number,
    reviewCount: number,
    createdAt: Date;
}


