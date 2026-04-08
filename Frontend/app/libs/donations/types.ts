export type DonationStatus = "pending" | "accepted" | "declined";

export interface Charity {
  id: number;
  name: string;
  location: string;
  description: string;
  user_id: number;
}

export interface Donation {
  id: number;
  food_item: string;
  quantity: number;
  seller_id: number;
  charity_id: number;
  status: DonationStatus;
  created_at: string;
}

export interface NotificationItem {
  id: number;
  message: string;
  user_id: number;
  read_status: boolean;
  created_at: string;
}
