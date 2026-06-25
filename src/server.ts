
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

let device_id = config.homie_id;

if (!device_id) {
  logger.info('HOMIE_ID not set, fetching device ID from Fronius API');
  const devices = await fetchDevices(config.fronius_url);
  if (devices) {
    for (const device of devices) {
      if (device.id) {
        logger.info('found device with ID %s', device.id);
        device_id = device.id;
        break;
      }
    }
  }
}

if (!device_id) {
  logger.error('cannot initialize gateway: the Fronius API returned no device with a specified ID and the HOMIE_ID environment variable is not set');
  process.exit(1);
}

const gateway = new FroniusGateway(device_id, config.homie_prefix, opts);
await gateway.ready();

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
