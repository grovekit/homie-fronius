
import {
  HomieRootDevice,
  HomieClientOpts,
  Node,
  DeviceInfo,
  FloatProperty,
} from '@grovekit/homie-client';
import { wait } from './utils.js';
import { LoopyLoop } from 'loopyloop';
import pinetto from 'pinetto';
import { getConfigFromEnv } from './config.js';
import { fetchDevices, fetchPowerflow } from './fetch.js';

const config = getConfigFromEnv();

const logger = pinetto({ level: config.log_level });

const opts: HomieClientOpts = {
  url: config.homie_url.toString(),
  options: {
    protocolLevel: 3,
    keepAlive: 1000,
  }
};

logger.info('Starting Fronius Gateway');
logger.info('Polling interval: %s seconds', config.polling_interval);
logger.info('Homie URL: %s', config.homie_url.toString());
logger.info('Fronius URL: %s', config.fronius_url.toString());

class FroniusGateway extends HomieRootDevice {

  readonly powerflow: Node;

  readonly p_akku_imp: FloatProperty;
  readonly p_akku_exp: FloatProperty;
  readonly p_grid_imp: FloatProperty;
  readonly p_grid_exp: FloatProperty;
  readonly p_load: FloatProperty;
  readonly p_pv: FloatProperty;

  constructor(id: string, opts: HomieClientOpts) {

    const info: DeviceInfo = {
      name: 'Fronius Gateway',
      type: 'gateway',
      homie: '5.0',
      version: 1,
    };

    super(id, info, opts);

    this.powerflow = this.addNode('powerflow', {
      name: 'Power Flow',
      type: 'powerflow',
    });

    this.p_akku_imp = this.powerflow.addFloatProperty('P_Akku_Import', {
      name: 'Power - Accumulator - Import',
      unit: 'W',
      settable: false,
      retained: true,
    }, 0);

    this.p_akku_exp = this.powerflow.addFloatProperty('P_Akku_Export', {
      name: 'Power - Accumulator - Export',
      unit: 'W',
      settable: false,
      retained: true,
    }, 0);

    this.p_grid_imp = this.powerflow.addFloatProperty('P_Grid_Import', {
      name: 'Power - Grid - Import',
      unit: 'W',
      settable: false,
      retained: true,
    }, 0);

    this.p_grid_exp = this.powerflow.addFloatProperty('P_Grid_Export', {
      name: 'Power - Grid - Export',
      unit: 'W',
      settable: false,
      retained: true,
    }, 0);

    this.p_load = this.powerflow.addFloatProperty('P_Load', {
      name: 'Power - Load',
      unit: 'W',
      settable: false,
      retained: true,
    }, 0);

    this.p_pv = this.powerflow.addFloatProperty('P_PV', {
      name: 'Power - PV',
      unit: 'W',
      settable: false,
      retained: true,
    }, 0);

  }
}

let gateway: FroniusGateway;

const control_loop = new LoopyLoop(async () => {

  await wait(config.polling_interval * 1000);

  if (!gateway) {
    const devices = await fetchDevices(config.fronius_url);
    if (devices) {
      for (const device of devices) {
        if (device.id) {
          gateway = new FroniusGateway(`fronius-${device.id}`, opts);
          await gateway.ready();
          break;
        }
      }
    }
  }

  if (gateway) {

    const powerflow = await fetchPowerflow(config.fronius_url);

    if (!powerflow || !powerflow.site) {
      return await wait(60_000);
    }

    const { site } = powerflow;

    const promises: Promise<any>[] = [];

    if (typeof site.P_Grid === 'number') {
      if (site.P_Grid >= 0) {
        promises.push(gateway.p_grid_imp.setValue(site.P_Grid));
      } else {
        promises.push(gateway.p_grid_exp.setValue(site.P_Grid * -1));
      }
    }

    if (typeof site.P_Load === 'number') {
      promises.push(gateway.p_load.setValue(site.P_Load * -1));
    }

    if (typeof site.P_PV === 'number') {
      promises.push(gateway.p_pv.setValue(site.P_PV));
    }

    if (typeof site.P_Akku === 'number') {
      if (site.P_Akku >= 0) {
        promises.push(gateway.p_akku_imp.setValue(site.P_Akku));
      } else {
        promises.push(gateway.p_akku_exp.setValue(site.P_Akku * -1));
      }
    }

    await Promise.all(promises);

  }

});

control_loop.on('error', (err) => {
  logger.error('loop error %s', err.stack);
  control_loop.start();
});

control_loop.start();
