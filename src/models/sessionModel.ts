export interface SessionItem{
    itemId: string,
    businessId: string,
    serviceId: string,
    name: string,
    price: number,
}
export interface Session{
    id: string,
    staffId: string,
    items: SessionItem[],
    totalAmount: number,
    rated: boolean;
    ratings?: {
        staff?: number,
        service?:number,
        comment?: string,
        itemRatings?: {
            businessId: string,
            serviceId: string,
            itemId: string,
            rating: number
        }[],
    },
    verified?: boolean,
    createdAt: Date,
}