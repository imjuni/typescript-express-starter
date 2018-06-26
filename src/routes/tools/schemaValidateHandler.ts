import * as Ajv from 'ajv';
import * as debug from 'debug';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import * as HttpStatusCodes from 'http-status-codes';
import { BadRequestHandlerError } from '../../models/exceptions/BadRequestHandlerError';
import { JSONSchemaExtractor } from '../../models/jsonschema/JSONSchemaExtractor';

const log = debug('tse:schemaValidateHandler');

export function schemaValidateHandler<R>(validator: Ajv.ValidateFunction, extractor: JSONSchemaExtractor): RequestHandler {
  const closureValidator = validator;
  const closureExtractor = extractor;

  // Parse해야 validation을 통과할 수도 있기 때문에 extraction을 먼저 한다
  async function asyncSchemaValidator(req: Request): Promise<R> {
    const extracted = await closureExtractor.extract<Request, R>(req);
    const result = closureValidator(extracted);

    log('Extracted: ', extracted);

    if (!result) {
      throw new BadRequestHandlerError(JSON.stringify(closureValidator.errors || {}), HttpStatusCodes.BAD_REQUEST);
    }

    let casted;

    // @ts-ignore
    casted = closureExtractor.dateTypeCast(extracted);
    // @ts-ignore
    casted = closureExtractor.camelCaseCas(casted);

    return casted;
  }

  return function schemaValidator(req: Request, _: Response, next?: NextFunction) {
    asyncSchemaValidator(req)
      .then((result: R) => {
        req.jsonSchemaRequest = result;

        if (typeof next === 'function') {
          next();
        }
      })
      .catch((err) => {
        if (typeof next === 'function') {
          next(err);
        }
      });
  };
}
