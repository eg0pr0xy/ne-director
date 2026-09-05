import { randomUUID } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';

export type SecretReference = string;

export interface SecretMetadata {
  ownerConnectionId: string;
  purpose: string;
  provider?: string;
  classification: 'LOCAL_DEVELOPMENT_ONLY';
}

export interface SecretStore {
  readonly classification: 'LOCAL_DEVELOPMENT_ONLY';
  readonly writable: boolean;
  put(secret: string, metadata: SecretMetadata): Promise<SecretReference>;
  get(reference: SecretReference): Promise<string>;
  delete(reference: SecretReference): Promise<void>;
  exists(reference: SecretReference): Promise<boolean>;
}

export class SecretStoreError extends Error {
  constructor(readonly code: 'SECRET_REFERENCE_INVALID' | 'SECRET_NOT_FOUND' | 'SECRET_STORE_READ_ONLY' | 'SECRET_STORE_UNAVAILABLE', message = 'Secret authority unavailable') { super(message); }
}

const environmentReference = /^env:\/\/(DIRECTOR_[A-Z0-9_]+)$/;
const dpapiReference = /^secret:\/\/local-development\/windows-dpapi\/([0-9a-f-]{36})$/;
export const isOpaqueSecretReference = (reference: unknown): reference is SecretReference => typeof reference === 'string' && (environmentReference.test(reference) || dpapiReference.test(reference));

const powershellAvailable = () => {
  const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', 'Add-Type -AssemblyName System.Security; [void][Security.Cryptography.ProtectedData]; exit 0'], { stdio: 'ignore' });
  return result.status === 0;
};

const runPowerShell = (script: string, args: string[] = [], input?: string) => new Promise<string>((resolve, reject) => {
  const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script], { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true, env: { ...process.env, DIRECTOR_SECRET_STORE_REFERENCE_ID: args[0] ?? '' } });
  const output: Buffer[] = []; const errors: Buffer[] = [];
  child.stdout.on('data', value => output.push(Buffer.from(value))); child.stderr.on('data', value => errors.push(Buffer.from(value)));
  child.once('error', () => reject(new SecretStoreError('SECRET_STORE_UNAVAILABLE')));
  child.once('close', code => code === 0 ? resolve(Buffer.concat(output).toString('utf8')) : reject(new SecretStoreError('SECRET_STORE_UNAVAILABLE', Buffer.concat(errors).toString('utf8').trim() || 'Secret authority unavailable')));
  child.stdin.end(input);
});

const directoryScript = `
Add-Type -AssemblyName System.Security
$dir = Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'NE Director\\secrets'
[IO.Directory]::CreateDirectory($dir) | Out-Null
$identity = [Security.Principal.WindowsIdentity]::GetCurrent().User
$acl = New-Object Security.AccessControl.DirectorySecurity
$acl.SetAccessRuleProtection($true, $false)
$acl.SetOwner($identity)
$rule = New-Object Security.AccessControl.FileSystemAccessRule($identity, 'FullControl', 'ContainerInherit,ObjectInherit', 'None', 'Allow')
$acl.AddAccessRule($rule)
Set-Acl -LiteralPath $dir -AclObject $acl
`;

/**
 * Local-development backend: DPAPI encrypts one JSON envelope per opaque ID in
 * the current Windows user's LocalAppData. The directory ACL is owner-only;
 * neither PostgreSQL nor the frontend can read a secret.
 */
export class WindowsDpapiSecretStore implements SecretStore {
  readonly classification = 'LOCAL_DEVELOPMENT_ONLY' as const;
  readonly writable = true;

  private referenceId(reference: SecretReference) {
    const match = dpapiReference.exec(reference);
    if (!match) throw new SecretStoreError('SECRET_REFERENCE_INVALID', 'Secret reference is invalid');
    return match[1];
  }

  async put(secret: string, metadata: SecretMetadata) {
    if (!secret) throw new SecretStoreError('SECRET_STORE_UNAVAILABLE');
    const id = randomUUID();
    const envelope = JSON.stringify({ secret, metadata });
    const script = `${directoryScript}
$id = $env:DIRECTOR_SECRET_STORE_REFERENCE_ID
$file = Join-Path $dir "$id.dpapi"
if ([IO.File]::Exists($file)) { exit 9 }
$plain = [Text.Encoding]::UTF8.GetBytes([Console]::In.ReadToEnd())
$entropy = [Text.Encoding]::UTF8.GetBytes('NE_DIRECTOR_CONNECTION_SECRET_AUTHORITY_001')
$protected = [Security.Cryptography.ProtectedData]::Protect($plain, $entropy, [Security.Cryptography.DataProtectionScope]::CurrentUser)
[IO.File]::WriteAllText($file, [Convert]::ToBase64String($protected), [Text.Encoding]::ASCII)
# The file inherits the owner-only ACL from $dir; no inherited broader ACL is retained.`;
    await runPowerShell(script, [id], envelope);
    return `secret://local-development/windows-dpapi/${id}`;
  }

  async get(reference: SecretReference) {
    const id = this.referenceId(reference);
    const script = `${directoryScript}
$file = Join-Path $dir "$($env:DIRECTOR_SECRET_STORE_REFERENCE_ID).dpapi"
if (-not [IO.File]::Exists($file)) { exit 4 }
$encrypted = [Convert]::FromBase64String([IO.File]::ReadAllText($file))
$entropy = [Text.Encoding]::UTF8.GetBytes('NE_DIRECTOR_CONNECTION_SECRET_AUTHORITY_001')
$plain = [Security.Cryptography.ProtectedData]::Unprotect($encrypted, $entropy, [Security.Cryptography.DataProtectionScope]::CurrentUser)
[Console]::OpenStandardOutput().Write($plain, 0, $plain.Length)`;
    let envelope: { secret?: unknown };
    try { envelope = JSON.parse(await runPowerShell(script, [id])); }
    catch (error) { if (error instanceof SecretStoreError && error.code === 'SECRET_STORE_UNAVAILABLE') throw new SecretStoreError('SECRET_NOT_FOUND', 'Secret reference is unavailable'); throw error; }
    if (typeof envelope.secret !== 'string') throw new SecretStoreError('SECRET_NOT_FOUND', 'Secret reference is unavailable');
    return envelope.secret;
  }

  async delete(reference: SecretReference) {
    const id = this.referenceId(reference);
    const script = `${directoryScript}
$file = Join-Path $dir "$($env:DIRECTOR_SECRET_STORE_REFERENCE_ID).dpapi"
if ([IO.File]::Exists($file)) { Remove-Item -LiteralPath $file -Force }`;
    await runPowerShell(script, [id]);
  }

  async exists(reference: SecretReference) {
    const id = this.referenceId(reference);
    const script = `${directoryScript}
$file = Join-Path $dir "$($env:DIRECTOR_SECRET_STORE_REFERENCE_ID).dpapi"
if ([IO.File]::Exists($file)) { [Console]::Out.Write('true') } else { [Console]::Out.Write('false') }`;
    return (await runPowerShell(script, [id])) === 'true';
  }
}

/** Read-only acceptance fallback for locally injected secrets; never a product write path. */
export class EnvironmentSecretStore implements SecretStore {
  readonly classification = 'LOCAL_DEVELOPMENT_ONLY' as const;
  readonly writable = false;
  async put(_secret: string, _metadata: SecretMetadata): Promise<SecretReference> { throw new SecretStoreError('SECRET_STORE_READ_ONLY', 'Writable secret authority is unavailable'); }
  async get(reference: SecretReference) {
    const match = environmentReference.exec(reference);
    if (!match || !process.env[match[1]]) throw new SecretStoreError('SECRET_NOT_FOUND', 'Secret reference is unavailable');
    return process.env[match[1]]!;
  }
  async delete() { throw new SecretStoreError('SECRET_STORE_READ_ONLY', 'Environment secret references cannot be deleted'); }
  async exists(reference: SecretReference) {
    const match = environmentReference.exec(reference);
    return Boolean(match && process.env[match[1]]);
  }
}

export const localDevelopmentSecretStore = (): SecretStore => powershellAvailable() ? new WindowsDpapiSecretStore() : new EnvironmentSecretStore();
export const environmentSecretReference = (name: string) => /^DIRECTOR_[A-Z0-9_]+$/.test(name) ? `env://${name}` : undefined;
