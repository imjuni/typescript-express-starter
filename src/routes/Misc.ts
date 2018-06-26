import { MiscController } from '../controllers/MiscController';
import { ISystemInfo } from '../models/ISystemInfo';
import { Base } from './Base';
import { RouteOption } from './tools/RouteOption';

export class Misc extends Base {
  public static bootstrap(): Misc {
    const misc = new Misc(new MiscController());

    misc.get<void, ISystemInfo>(
      ['/health'],
      misc.controller.health.bind(misc.controller),
      new RouteOption(false, true, 'Server health check', 'Server health check via get system information'),
    );

    return misc;
  }
  constructor(public readonly controller: MiscController) {
    super();
  }
}
