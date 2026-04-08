# homie-fronius

A gateway that bridges [Fronius](https://www.fronius.com/) solar inverters to
an MQTT broker using the [Homie convention](https://homieiot.github.io/). Part
of the [@grovekit](https://github.com/grovekit) ecosystem.

`homie-fronius` periodically polls the local HTTP API of a Fronius inverter,
reads real-time power flow data (solar production, grid import/export, battery
charge/discharge, household consumption), and publishes it as a Homie device
over MQTT.

## Configuration

Configuration is provided through environment variables.

| Variable           | Required | Default | Description                                          |
| ------------------ | -------- | ------- | ---------------------------------------------------- |
| `HOMIE_URL`        | Yes      | —       | MQTT broker URL (must use the `mqtt://` scheme)      |
| `HOMIE_PREFIX`     | No       | `homie` | Homie MQTT prefix                                    |
| `FRONIUS_URL`      | Yes      | —       | Base URL of the Fronius local API (`http://` scheme) |
| `LOG_LEVEL`        | No       | `info`  | Log level: `trace`, `debug`, `info`, `warn`, `error` |
| `POLLING_INTERVAL` | No       | `10`    | Polling interval in seconds (minimum `1`)            |

### Example

```env
HOMIE_URL=mqtt://localhost:1883
HOMIE_PREFIX=homie
FRONIUS_URL=http://192.168.1.42
LOG_LEVEL=info
POLLING_INTERVAL=10
```

## Homie device structure

On startup the gateway queries the Fronius API for available devices and
registers a Homie root device named `fronius-<device-id>`. The device exposes
the following nodes and properties:

```
fronius-<id>/
├── accumulator/            # Battery / accumulator
│   ├── power-charging      # float, W – power flowing into the battery
│   └── power-discharging   # float, W – power flowing out of the battery
├── grid/                   # Utility grid connection
│   ├── power-import        # float, W – power drawn from the grid
│   └── power-export        # float, W – power fed into the grid
├── load/                   # Household consumption
│   └── power-consumption   # float, W – power consumed by the household
└── pv/                     # Photovoltaic array
    └── power-production    # float, W – power produced by the PV array
```

All properties are read-only, retained, and expressed in watts (W).

## Running with Docker

The recommended way to run `homie-fronius` is via Docker Compose.

Create an `.env` file next to `docker-compose.yml` with your configuration,
then start the service:

```sh
docker compose up -d
```

### Other scripts

| Script         | Description                                 |
| -------------- | ------------------------------------------- |
| `npm run build`    | Clean and compile TypeScript             |
| `npm run ts:build` | Same as `build`                          |
| `npm run ts:watch` | Clean and compile in watch mode          |
| `npm run ts:clean` | Remove compiled output and build caches  |
| `npm test`         | Run tests via the Node.js test runner    |

## Fronius API endpoints

The gateway consumes the following endpoints from the Fronius local API:

- `<FRONIUS_URL>/status/devices` — lists available devices and their IDs
- `<FRONIUS_URL>/status/powerflow` — returns real-time power flow data

## Dependencies

This project uses a total of 19 run-time dependencies and 41 dependencies in
total, including both direct and indirect dependencies. 

### Direct dependencies

| Package                    | Purpose                                      |
| -------------------------- | -------------------------------------------- |
| `@grovekit/homie-client`   | Homie MQTT client for publishing device data |
| `@grovekit/homie-core`     | Shared Homie protocol types and utilities    |
| `@deepkit/type`            | Runtime type casting and validation          |
| `loopyloop`                | Resilient asynchronous polling loop          |
| `pinetto`                  | Lightweight structured logger                |

## License

[MIT](LICENSE) © [Jacopo Scazzosi](mailto:jacopo@scazzosi.com)
