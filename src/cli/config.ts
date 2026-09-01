import { chmod, mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import { homedir, platform } from 'node:os';
import { dirname, join } from 'node:path';

interface StoredConfig {
  api_key: string;
}

export const apiKeyConfigPath = (environment: NodeJS.ProcessEnv = process.env): string => {
  if (platform() === 'win32') {
    return join(environment.APPDATA ?? join(homedir(), 'AppData', 'Roaming'), 'autocontent', 'config.json');
  }
  if (environment.XDG_CONFIG_HOME !== undefined && environment.XDG_CONFIG_HOME.length > 0) {
    return join(environment.XDG_CONFIG_HOME, 'autocontent', 'config.json');
  }
  if (platform() === 'darwin') {
    return join(homedir(), 'Library', 'Application Support', 'autocontent', 'config.json');
  }
  return join(homedir(), '.config', 'autocontent', 'config.json');
};

export const storeApiKey = async (
  apiKey: string,
  environment: NodeJS.ProcessEnv = process.env
): Promise<string> => {
  const normalized = apiKey.trim();
  if (!normalized.startsWith('acp_')) throw new TypeError('Expected a Platform API key beginning with acp_.');
  const path = apiKeyConfigPath(environment);
  const directory = dirname(path);
  await mkdir(directory, { recursive: true, mode: 0o700 });
  if (platform() !== 'win32') await chmod(directory, 0o700);
  const temporaryPath = `${path}.${process.pid}.tmp`;
  const body = `${JSON.stringify({ api_key: normalized } satisfies StoredConfig)}\n`;
  await writeFile(temporaryPath, body, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
  if (platform() !== 'win32') await chmod(temporaryPath, 0o600);
  await rename(temporaryPath, path);
  if (platform() !== 'win32') await chmod(path, 0o600);
  return path;
};

export const loadApiKey = async (
  environment: NodeJS.ProcessEnv = process.env
): Promise<string | null> => {
  const fromEnvironment = environment.AUTOCONTENT_API_KEY?.trim();
  if (fromEnvironment !== undefined && fromEnvironment.length > 0) return fromEnvironment;
  const path = apiKeyConfigPath(environment);
  try {
    if (platform() !== 'win32') {
      const metadata = await stat(path);
      if ((metadata.mode & 0o077) !== 0) {
        throw new Error(`Refusing to read ${path}: expected owner-only permissions (mode 0600).`);
      }
    }
    const parsed = JSON.parse(await readFile(path, 'utf8')) as Partial<StoredConfig>;
    return typeof parsed.api_key === 'string' && parsed.api_key.trim().length > 0
      ? parsed.api_key.trim()
      : null;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
};
