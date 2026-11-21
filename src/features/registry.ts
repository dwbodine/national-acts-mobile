import type { ComponentType } from "react";
import { CheckInScreen } from "./checkin/CheckInScreen";
import { AttendeesScreen } from "./events/AttendeesScreen";
export interface AppFeature {
  id: string;
  title: string;
  component: ComponentType;
}
// Register another feature here; the header menu appears automatically.
export const features: AppFeature[] = [
  { id: "checkin", title: "Ticket check-in", component: CheckInScreen },
  { id: "attendees", title: "Event attendees", component: AttendeesScreen },
];
