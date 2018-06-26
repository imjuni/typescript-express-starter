import * as debug from 'debug';
import * as http from 'http';
import { Server } from './Server';

const log = debug('tes:application');

process.on('unhandledRejection', (reason, promise) => {
  log('Node Reason: ', reason);
  log('Node promise: ', promise);
});

process.on('uncaughtException', (err) => {
  log(err.message);
  log(err.stack);
});

(async () => {
  try {
    const server = Server.bootstrap();
    const app = http.createServer(server.app);

    log(`Server start ${server.app.get('port')}`);

    app.listen(parseInt(server.app.get('port'), 10));
  } catch (err) {
    log(err.merge);
    log(err.stack);

    process.exit(1);
  }
})();
