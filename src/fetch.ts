
import { errToString, validationErrorToString } from "./utils.js";
import { DevicesPayload, PowerflowPayload } from "./fetch-types.js";
import { resolve } from "node:path/posix";
import { cast, ReceiveType, resolveReceiveType, ValidationError } from "@deepkit/type";

const froniusFetch = async <T>(url: URL, __type_T?: ReceiveType<T>): Promise<T> => {
  __type_T = resolveReceiveType(__type_T);
  try {
    const res = await fetch(url);
    if (res.status === 200) {
      const json = await res.json();
      return cast<T>(json, undefined, undefined, undefined, __type_T);
    }
    throw new Error('Unexpected status code from Fronius API: ' + res.status);
  } catch (err) {
    if (err instanceof ValidationError) {
      throw new Error('Invalid payload from Fronius API: ' + validationErrorToString(err));
    }
    throw new Error('Unexpected error from Fronius API: ' + errToString(err, true));
  }
};

export const fetchDevices = async (base_url: URL): Promise<DevicesPayload> => {
  const devices_url = new URL(base_url);
  devices_url.pathname = resolve(devices_url.pathname, 'status', 'devices');
  return await froniusFetch<DevicesPayload>(devices_url);
};

export const fetchPowerflow = async (base_url: URL): Promise<PowerflowPayload> => {
  const powerflow_url = new URL(base_url);
  powerflow_url.pathname = resolve(powerflow_url.pathname, 'status', 'powerflow');
  return await froniusFetch<PowerflowPayload>(powerflow_url);
};
