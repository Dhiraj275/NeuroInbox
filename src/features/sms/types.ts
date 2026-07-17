export interface SmsMessage {
  _id: string;
  address: string;
  body: string;
  thread_id: number;
  date: string;
  read: number; // 0 for unread, 1 for read
  type?: number; // 1 for inbox (incoming), 2 for sent (outgoing)
}

export type Category = "All" | "Personal" | "Transactions" | "OTPs" | "Promotions";
