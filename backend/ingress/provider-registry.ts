import type { ConnectionCapability } from './contracts.js';

export interface ProviderDescriptor {
  id: string;
  displayName: string;
  mailSupported: boolean;
  calendarSupported: boolean;
  contactsSupported: boolean;
  capabilities: ConnectionCapability[];
  authMode: 'OAUTH_2_AUTHORIZATION_CODE_PKCE' | 'NOT_IMPLEMENTED';
  implementationStatus: 'AVAILABLE' | 'NOT_IMPLEMENTED';
  detail: string;
}

/** Single registry for Settings choices; selecting a provider never implies a usable adapter. */
export const providerRegistry: readonly ProviderDescriptor[] = [
  { id: 'ICLOUD', displayName: 'Apple / iCloud', mailSupported: false, calendarSupported: false, contactsSupported: false, capabilities: ['MAIL', 'CALENDAR', 'CONTACTS'], authMode: 'NOT_IMPLEMENTED', implementationStatus: 'NOT_IMPLEMENTED', detail: 'Read-only contracts exist; a verified iCloud transport and authorization flow are not configured.' },
  { id: 'GOOGLE', displayName: 'Google', mailSupported: true, calendarSupported: true, contactsSupported: false, capabilities: ['MAIL', 'CALENDAR', 'CONTACTS'], authMode: 'OAUTH_2_AUTHORIZATION_CODE_PKCE', implementationStatus: 'AVAILABLE', detail: 'Read-only Gmail and Google Calendar adapters require locally configured Google OAuth client and refresh-token secret references.' },
  { id: 'MICROSOFT_365', displayName: 'Microsoft 365', mailSupported: false, calendarSupported: false, contactsSupported: false, capabilities: ['MAIL', 'CALENDAR', 'CONTACTS'], authMode: 'NOT_IMPLEMENTED', implementationStatus: 'NOT_IMPLEMENTED', detail: 'No Microsoft 365 adapter or authorization flow is implemented.' },
  { id: 'OTHER', displayName: 'Other provider', mailSupported: false, calendarSupported: false, contactsSupported: false, capabilities: ['MAIL', 'CALENDAR', 'CONTACTS'], authMode: 'NOT_IMPLEMENTED', implementationStatus: 'NOT_IMPLEMENTED', detail: 'Choose only to record a future provider configuration; no adapter is available.' }
];

export const providerById = (id: string) => providerRegistry.find(provider => provider.id === id);
