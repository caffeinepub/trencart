import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Order {
    id: PersistentId;
    customerName: string;
    status: OrderStatus;
    deliveryCharge: bigint;
    shopId: PersistentId;
    createdAt: bigint;
    deliveryBoyId?: PersistentId;
    address: string;
    paymentType: PaymentType;
    phone: string;
    items: string;
    amount: bigint;
}
export type LoginResult = {
    __kind__: "ok";
    ok: {
        userId: PersistentId;
        name: string;
        role: Role;
    };
} | {
    __kind__: "err";
    err: string;
};
export interface DeliveryBoy {
    id: PersistentId;
    password: string;
    name: string;
    isOnline: boolean;
    email: string;
    earnings: bigint;
    codCollected: bigint;
    phone: string;
    shiftId?: PersistentId;
}
export interface DashboardStats {
    totalOrders: bigint;
    pendingOrders: bigint;
    totalDeliveryBoys: bigint;
    activeOrders: bigint;
    onlineDeliveryBoys: bigint;
    totalEarnings: bigint;
    deliveredOrders: bigint;
}
export interface Shift {
    id: PersistentId;
    startTime: string;
    endTime: string;
    name: string;
    maxUsers: bigint;
}
export interface ShiftBooking {
    id: PersistentId;
    deliveryBoyId: PersistentId;
    shiftId: PersistentId;
}
export interface Shop {
    id: PersistentId;
    password: string;
    name: string;
    email: string;
    location: string;
}
export type PersistentId = bigint;
export interface UserProfile {
    userId: PersistentId;
    name: string;
    role: Role;
    email: string;
}
export enum OrderStatus {
    cancelled = "cancelled",
    delivering = "delivering",
    pending = "pending",
    reached_shop = "reached_shop",
    going_to_shop = "going_to_shop",
    picked = "picked",
    delivered = "delivered",
    accepted = "accepted"
}
export enum PaymentType {
    cod = "cod",
    online = "online"
}
export enum Role {
    admin = "admin",
    shop = "shop",
    delivery_boy = "delivery_boy"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addDeliveryBoy(name: string, phone: string, email: string, password: string): Promise<PersistentId>;
    addShift(name: string, startTime: string, endTime: string, maxUsers: bigint): Promise<PersistentId>;
    addShop(name: string, location: string, email: string, password: string): Promise<PersistentId>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignDeliveryBoy(orderId: PersistentId, deliveryBoyId: PersistentId): Promise<boolean>;
    bookShift(deliveryBoyId: PersistentId, shiftId: PersistentId): Promise<boolean>;
    cancelShiftBooking(deliveryBoyId: PersistentId, shiftId: PersistentId): Promise<boolean>;
    createOrder(shopId: PersistentId, customerName: string, phone: string, address: string, items: string, paymentType: PaymentType, amount: bigint): Promise<PersistentId>;
    deleteDeliveryBoy(id: PersistentId): Promise<boolean>;
    deleteShift(id: PersistentId): Promise<boolean>;
    deleteShop(id: PersistentId): Promise<boolean>;
    getBookingsForDeliveryBoy(deliveryBoyId: PersistentId): Promise<Array<ShiftBooking>>;
    getBookingsForShift(shiftId: PersistentId): Promise<Array<ShiftBooking>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDashboardStats(): Promise<DashboardStats>;
    getDeliveryBoy(id: PersistentId): Promise<DeliveryBoy | null>;
    getDeliveryBoys(): Promise<Array<DeliveryBoy>>;
    getDeliveryCharge(): Promise<bigint>;
    getOrders(): Promise<Array<Order>>;
    getOrdersForDeliveryBoy(deliveryBoyId: PersistentId): Promise<Array<Order>>;
    getOrdersForShop(shopId: PersistentId): Promise<Array<Order>>;
    getShifts(): Promise<Array<Shift>>;
    getShops(): Promise<Array<Shop>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    login(email: string, password: string): Promise<LoginResult>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setDeliveryBoyOnline(id: PersistentId, isOnline: boolean): Promise<boolean>;
    setDeliveryCharge(amount: bigint): Promise<void>;
    updateDeliveryBoy(id: PersistentId, name: string, phone: string, email: string): Promise<boolean>;
    updateOrderStatus(orderId: PersistentId, status: OrderStatus): Promise<boolean>;
    updateShift(id: PersistentId, name: string, startTime: string, endTime: string, maxUsers: bigint): Promise<boolean>;
    updateShop(id: PersistentId, name: string, location: string, email: string): Promise<boolean>;
}
