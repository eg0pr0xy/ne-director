import type { ConnectionCapability } from './contracts.js';

export interface ProviderDescriptor {
  id: string;
  displayName: string;
  capabilities: ConnectionCapability[];
  adapterStatus: 'NOT_IMPLEMENTED';
  authorizationStatus: 'NOT_IMPLEMENTED';
  detail: string;
}

/** Single registry for Settings choices; selecting a provider never implies a usable adapter. */
export const providerRegistry: readonly ProviderDescriptor[] = [
  { id: 'ICLOUD', displayName: 'Apple / iCloud', capabilities: ['MAIL', 'CALENDAR', 'CONTACTS'], adapterStatus: 'NOT_IMPLEMENTED', authorizationStatus: 'NOT_IMPLEMENTED', detail: 'Read-only contracts exist; a verified iCloud transport and authorization flow are not configured.' },
  { id: 'GOOGLE', displayName: 'Google', capabilities: ['MAIL', 'CALENDAR', 'CONTACTS'], adapterStatus: 'NOT_IMPLEMENTED', authorizationStatus: 'NOT_IMPLEMENTED', detail: 'No Google adapter or authorization flow is implemented.' },
  { id: 'MICROSOFT_365', displayName: 'Microsoft 365', capabilities: ['MAIL', 'CALENDAR', 'CONTACTS'], adapterStatus: 'NOT_IMPLEMENTED', authorizationStatus: 'NOT_IMPLEMENTED', detail: 'No Microsoft 365 adapter or authorization flow is implemented.' },
  { id: 'OTHER', displayName: 'Other provider', capabilities: ['MAIL', 'CALENDAR', 'CONTACTS'], adapterStatus: 'NOT_IMPLEMENTED', authorizationStatus: 'NOT_IMPLEMENTED', detail: 'Choose only to record a future provider configuration; no adapter is available.' }
];

export const providerById = (id: string) => providerRegistry.find(provider => provider.id === id);
