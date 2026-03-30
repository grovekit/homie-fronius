
import {
  RootDevice,
  type Node,
  type DeviceInfo,
  type FloatProperty,
} from '@grovekit/homie-client';
import { wait, errToString } from './utils.js';
import { LoopyLoop } from 'loopyloop';
import pinetto from 'pinetto';
import { getConfigFromEnv } from './config.js';
import { fetchDevices, fetchPowerflow } from './fetch.js';
import { FroniusGateway } from './gateway.js';

const config = getConfigFromEnv();

const logger = pinetto({ level: config.log_level });

const opts = {
  url: config.homie_url,
  options: {
    protocolLevel: 3,
    keepAlive: 1000,
  }
};

logger.info('polling interval: %s seconds', config.polling_interval);
logger.info('homie URL: %s', config.homie_url.toString());
logger.info('fronius URL: %s', config.fronius_url.toString());

let gateway: FroniusGateway | undefined = undefined;

const devices = await fetchDevices(config.fronius_url);

if (devices) {
  for (const device of devices) {
    if (device.id) {
      gateway = new FroniusGateway(`fronius-${device.id}`, opts);
      await gateway.ready();
      logger.info('found device with ID %s, gateway initialized', device.id);
      break;
    }
  }
}

if (!gateway) {
  logger.error('cannot initialize gateway: the Fronius API returned no device with a specified ID');
  process.exit(1);
}

const control_loop = new LoopyLoop(async () => {
  try {
    const powerflow = await fetchPowerflow(config.fronius_url);
    logger.debug('powerflow retrieved');
    await gateway.update(powerflow);
    logger.debug('gateway updated');
  } catch (err) {
    logger.error('loop error: %s', errToString(err));
  } finally {
    await wait(config.polling_interval * 1000);
  }
});

control_loop.on('error', (err) => {
  logger.error('loop error %s', err.stack);
  control_loop.start();
});

control_loop.start();
