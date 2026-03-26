
export interface DeviceEntry {
  id?: string;
  type: 'inverter' | 'powermeter';
}

export type DevicesPayload = DeviceEntry[];

export interface PowerflowPayload {
  common: {
    datestamp: string;
    timestamp: string;
  };
  site?: {
    P_Akku?: number | null;
    P_Grid?: number | null;
		P_Load?: number | null;
		P_PV?: number | null;
  };
  version: `${number}`;
}
