export type ConnectionCapability = 'MAIL' | 'CALENDAR' | 'CONTACTS';

export interface ProviderOption {
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

export interface ConnectionSourceAccount {
  id: string;
  connectionId?: string;
  capability: 'COMMUNICATION' | 'SCHEDULE' | 'CONTACTS';
  displayName: string;
  accountIdentifier: string;
  enabled: boolean;
  connectionState: string;
  selectionMetadata?: Record<string, unknown>;
  lastSuccessfulSyncAt?: string;
  lastErrorCode?: string;
}

export interface DirectorConnection {
  id: string;
  displayName: string;
  provider: string;
  accountIdentifier: string;
  enabled: boolean;
  capabilities: ConnectionCapability[];
  authorizationState: string;
  connectionState: string;
  configurationMetadata: Record<string, unknown>;
  lastSuccessfulSyncAt?: string;
  lastErrorCode?: string;
}

const apiBase = import.meta.env.VITE_DIRECTOR_API_BASE_URL ?? 'http://127.0.0.1:4600/api/v1';
export const connectionApiEnabled = import.meta.env.VITE_DIRECTOR_RUNTIME_MODE === 'api';

const request = async (path: string, options?: RequestInit) => {
  const response = await fetch(`${apiBase}${path}`, { ...options, headers: { 'content-type': 'application/json', ...(options?.headers ?? {}) } });
  const body = await response.json();
  if (!response.ok) throw new Error(body.code ?? `Director API ${response.status}`);
  return body;
};

export const connectionApi = {
  async providers(): Promise<ProviderOption[]> { return (await request('/ingress/providers')).items; },
  async connections(): Promise<DirectorConnection[]> { return (await request('/ingress/connections')).items; },
  async accounts(): Promise<ConnectionSourceAccount[]> { return (await request('/ingress/accounts')).items; },
  async create(input: { displayName: string; provider: string; accountIdentifier: string; capabilities: ConnectionCapability[]; selectionMetadata: Record<string, unknown> }) { return request('/ingress/connections', { method: 'POST', body: JSON.stringify({ ...input, enabled: true, configurationMetadata: {} }) }); },
  async updateConnection(id: string, input: Partial<Pick<DirectorConnection, 'displayName' | 'enabled' | 'capabilities'>>) { return request(`/ingress/connections/${id}`, { method: 'PATCH', body: JSON.stringify(input) }); },
  async updateSourceAccount(id: string, input: Partial<Pick<ConnectionSourceAccount, 'enabled' | 'selectionMetadata'>>) { return request(`/ingress/accounts/${id}`, { method: 'PATCH', body: JSON.stringify(input) }); },
  async authorizationIntent(id: string) { return request(`/ingress/connections/${id}/authorization-intent`, { method: 'POST' }); },
  async revoke(id: string) { return request(`/ingress/connections/${id}/revoke`, { method: 'POST' }); },
  async sync(id: string) { return request('/ingress/sync', { method: 'POST', body: JSON.stringify({ sourceAccountId: id }) }); }
};
