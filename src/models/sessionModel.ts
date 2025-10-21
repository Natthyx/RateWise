export interface SessionItem{
    itemId: string,
    serviceId: string,
    subServiceId: string,
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
            serviceId: string,
            subServiceId: string,
            itemId: string,
            rating: number
        }[],
    },
    verified?: boolean,
    createdAt: Date,
}