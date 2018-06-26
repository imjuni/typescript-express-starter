import * as debug from 'debug';
import * as os from 'os';

import { ISystemInfo } from '../models/ISystemInfo';
import { ResponseBox } from '../routes/tools/ResponseBox';

const log = debug('tse:MiscController');

export class MiscController {
  public async health(): Promise<ResponseBox<ISystemInfo>> {
    const cpus = os.cpus();

    const users = cpus.map((cpu) => cpu.times.user).reduce((prev, curr) => prev + curr);
    const nices = cpus.map((cpu) => cpu.times.nice).reduce((prev, curr) => prev + curr);
    const syses = cpus.map((cpu) => cpu.times.sys).reduce((prev, curr) => prev + curr);
    const irqs = cpus.map((cpu) => cpu.times.irq).reduce((prev, curr) => prev + curr);
    const idles = cpus.map((cpu) => cpu.times.idle).reduce((prev, curr) => prev + curr);

    const total = users + nices + syses + irqs + idles;
    const idlesPercent = Math.floor((idles / total) * 100);

    const sysInfo: ISystemInfo = {
      cpu: {
        count: cpus.length,
        idle: idlesPercent,
        usage: 100 - idlesPercent,
      },
      memory: {
        free: os.freemem(),
        total: os.totalmem(),
      },
    };

    log('sysInfo: ', sysInfo);

    const responseBox: ResponseBox<ISystemInfo> = new ResponseBox<ISystemInfo>({
      data: sysInfo,
    });

    return responseBox;
  }
}
