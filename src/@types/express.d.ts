import * as core from 'express-serve-static-core';

declare module 'express' {
  export type PathParam = core.PathParams;

  interface Request extends core.Request {
    jsonSchemaRequest?: any;
  }
}
