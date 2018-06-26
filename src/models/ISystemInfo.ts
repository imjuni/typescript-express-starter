import { integer } from './integer';

export interface ISystemInfo {
  cpu: {
    count: integer;
    usage: integer;
    idle: integer;
  };

  memory: {
    total: integer;
    free: integer;
  };
}
