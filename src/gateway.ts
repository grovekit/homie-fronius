
import {
  RootDevice,
  type Node,
  type ClientOpts,
  type DeviceInfo,
  type FloatProperty,
} from "@grovekit/homie-client";

import assert from 'node:assert';

import { PowerflowPayload } from './fetch-types.js';

export class FroniusGateway extends RootDevice {

  readonly #accumulator: Node;
  readonly #grid: Node;
  readonly #load: Node;
  readonly #pv: Node;

  readonly #accu_power_chg: FloatProperty;
  readonly #accu_power_dsc: FloatProperty;
  readonly #grid_power_imp: FloatProperty;
  readonly #grid_power_exp: FloatProperty;
  readonly #load_power_con: FloatProperty;
  readonly #pv_power_prd: FloatProperty;

  constructor(id: string, opts: ClientOpts) {

    const info: DeviceInfo = {
      name: 'Fronius',
      version: 1,
    };

    super(id, info, opts);

    this.#accumulator = this.addNode('accumulator', {
      name: 'Accumulator',
    });

    this.#grid = this.addNode('grid', {
      name: 'Grid',
    });

    this.#load = this.addNode('load', {
      name: 'Load',
    });

    this.#pv = this.addNode('pv', {
      name: 'PV',
    });

    this.#accu_power_chg = this.#accumulator.addFloatProperty(
      'power-charging',
      { name: 'Power - Charging', unit: 'W', settable: false, retained: true },
      0,
    );

    this.#accu_power_dsc = this.#accumulator.addFloatProperty(
      'power-discharging',
      { name: 'Power - Discharging', unit: 'W', settable: false, retained: true },
      0,
    );

    this.#grid_power_imp = this.#grid.addFloatProperty(
      'power-import',
      { name: 'Power - Import', unit: 'W', settable: false, retained: true },
      0,
    );

    this.#grid_power_exp = this.#grid.addFloatProperty(
      'power-export',
      { name: 'Power - Export', unit: 'W', settable: false, retained: true },
      0,
    );

    this.#load_power_con = this.#load.addFloatProperty(
      'power-consumption',
      { name: 'Power - Consumption', unit: 'W', settable: false, retained: true },
      0,
    );

    this.#pv_power_prd = this.#pv.addFloatProperty(
      'power-production',
      { name: 'Power - Production', unit: 'W', settable: false, retained: true },
      0,
    );

  }

  async update(flow: PowerflowPayload): Promise<void> {
    const { site } = flow;

    if (!site) {
      return;
    }

    const promises: Promise<any>[] = [];

    if (typeof site.P_Grid === 'number') {
      if (site.P_Grid >= 0) {
        promises.push(this.#grid_power_imp.setValue(site.P_Grid));
        promises.push(this.#grid_power_exp.setValue(0));
      } else {
        promises.push(this.#grid_power_imp.setValue(0));
        promises.push(this.#grid_power_exp.setValue(site.P_Grid * -1));
      }
    }

    if (typeof site.P_Akku === 'number') {
      if (site.P_Akku >= 0) {
        promises.push(this.#accu_power_dsc.setValue(site.P_Akku));
        promises.push(this.#accu_power_chg.setValue(0));
      } else {
        promises.push(this.#accu_power_dsc.setValue(0));
        promises.push(this.#accu_power_chg.setValue(site.P_Akku * -1));
      }
    }

    if (typeof site.P_Load === 'number') {
      assert(site.P_Load <= 0, 'incoherent load power');
      promises.push(this.#load_power_con.setValue(site.P_Load * -1));
    }

    if (typeof site.P_PV === 'number') {
      promises.push(this.#pv_power_prd.setValue(site.P_PV));
    }

    await Promise.all(promises);
  }
}
