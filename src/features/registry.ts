import type { ComponentType } from 'react';
import { CheckInScreen } from './checkin/CheckInScreen';
export interface AppFeature { id: string; title: string; component: ComponentType }
// Register another feature here; the header menu appears automatically.
export const features: AppFeature[] = [{ id: 'checkin', title: 'Ticket check-in', component: CheckInScreen }];
