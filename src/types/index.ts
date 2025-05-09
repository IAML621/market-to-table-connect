
export type UserRole = 'farmer' | 'consumer';

export interface User {
  id: string;
  email: string;
  username: string;
  contactInfo?: string;
  role: UserRole;
  created_at: string;
}

export interface Farmer extends User {
  farmName: string;
  farmLocation: string;
  profileImage?: string;
}

export interface Consumer extends User {
  location: string;
  profileImage?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stockLevel: number;
  farmerId: string;
  farmerName?: string;
  farmName?: string;
  imageUrl?: string;
  created_at: string;
  category?: string;
  isOrganic?: boolean;
  unit?: string; // e.g., "lb", "bunch", "each"
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  pricePerItem: number;
  productName?: string;
}

export interface Order {
  id: string;
  consumerId: string;
  orderDate: string;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  items?: OrderItem[];
  consumerName?: string;
}

export interface Payment {
  id: string;
  orderId: string;
  transactionId: string;
  amount: number;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  senderName?: string;
}
