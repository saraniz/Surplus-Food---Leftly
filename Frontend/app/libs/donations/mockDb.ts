import { Charity, Donation, NotificationItem } from "./types";

// In-memory mock collections for API route skeletons.
// Replace with Prisma/DB queries during backend integration.
export const charities: Charity[] = [
  {
    id: 1,
    name: "Hope Kitchen",
    location: "Colombo",
    description: "Community kitchen for vulnerable families",
    user_id: 5001,
  },
  {
    id: 2,
    name: "Food Bridge Trust",
    location: "Gampaha",
    description: "Redistributes surplus food to shelters",
    user_id: 5002,
  },
];

export const donations: Donation[] = [];
export const notifications: NotificationItem[] = [];

let donationSeq = 1;
let notificationSeq = 1;

export const nextDonationId = () => donationSeq++;
export const nextNotificationId = () => notificationSeq++;
