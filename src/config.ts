
import { cast, ValidationError } from "@deepkit/type";
import { validationErrorToString } from "./utils.js";
import assert from "node:assert";

export interface Env {
  /** URL of Homie MQTT broker */
  HOMIE_URL: string;
  /** Homie MQTT prefix */
  HOMIE_PREFIX?: string;
  /** URL of Fronius API */
  FRONIUS_URL: string;
  /** Log level */
  LOG_LEVEL?: 'trace' | 'debug' | 'info' | 'warn' | 'error';
  /** Polling interval in seconds */
  POLLING_INTERVAL?: number;
}

export const getEnv = (): Env => {
  const env = process.env;
  try {
    return cast<Env>(env);
  } catch (err) {
    if (err instanceof ValidationError) {
      throw new Error(`Missing or invalid environment variables: ${validationErrorToString(err)}`);
    }
    throw err;
  }
};

export interface Config {
  /** URL of Homie MQTT broker */
  homie_url: URL;
  /** Homie MQTT prefix */
  homie_prefix: string;
  /** URL of Fronius API */
  fronius_url: URL;
  /** Log level */
  log_level: 'trace' | 'debug' | 'info' | 'warn' | 'error';
  /** Polling interval in seconds */
  polling_interval: number;
}

export const getConfigFromEnv = (): Config => {
  const env = getEnv();
  const config: Config = {
    homie_url: new URL(env.HOMIE_URL),
    homie_prefix: env.HOMIE_PREFIX || 'homie',
    fronius_url: new URL(env.FRONIUS_URL),
    log_level: env.LOG_LEVEL || 'info',
    polling_interval: Math.max(env.POLLING_INTERVAL ?? 10, 1),
  };
  assert(config.homie_url.protocol.startsWith('mqtt'), 'Homie URL must be an MQTT URL');
  assert(config.fronius_url.protocol.startsWith('http'), 'Fronius URL must be an HTTP URL');
  return config;
};
