import * as debug from 'debug';
import * as express from 'express';

import { Misc } from './routes/Misc';
import { defaultErrorHandler } from './routes/tools/defaultErrorHandler';

const log = debug('tse:Server');

export class Server {
  public static bootstrap(): Readonly<Server> {
    return new Server();
  }

  public readonly app: express.Application;

  constructor() {
    this.app = express();
    this.config();
    this.route();
  }

  private config(): void {
    const port = parseInt(process.env.PORT || '', 10);

    this.app.set('etag', false);
    this.app.set('port', isNaN(port) ? 80 : port);

    log('etag: ', this.app.get('etag'));
    log('port: ', this.app.get('port'));
  }

  private route(): void {
    const router = express.Router();
    const misc = Misc.bootstrap();

    this.app.use(misc.router);
    this.app.use(router);

    this.app.use((err: Error, req: express.Request, res: express.Response, next?: express.NextFunction) => {
      defaultErrorHandler(err, req, res, next);
    });
  }
}
