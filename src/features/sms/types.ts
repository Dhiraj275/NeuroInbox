export interface SmsMessage {
  _id: string;
  address: string;
  body: string;
  thread_id: number;
  date: string;
  read: number; // 0 for unread, 1 for read
}

export type Category = "All" | "Personal" | "Transactions" | "OTPs" | "Offers";
