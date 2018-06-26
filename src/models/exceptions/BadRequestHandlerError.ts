import { Send } from 'express';
import * as HttpStatusCodes from 'http-status-codes';
import { integer } from '../integer';
import isEmpty from '../isEmpty';
import isNotEmpty from '../isNotEmpty';

/**
 * ajv, JSONSchema를 사용해서 Bad Request를 탐지하였을 때도 Sentry.io에 오류가 기록되는 것을
 * 방지하기 위해서 BadRequest만 따로 기록하기 위해서 분리하는 오류 클래스
 */
export class BadRequestHandlerError<T = any> extends Error {
  public readonly errorName: string = 'BadRequestHandlerError';
  public readonly status: number | null;
  public readonly sendMethod: Send | null;
  public readonly payload: T | null;

  constructor(
    message: string,
    status?: integer,
    options?: {
      sendMethod?: Send;
      payload?: T;
    },
  ) {
    super(message);
    this.status = isEmpty(status) ? HttpStatusCodes.INTERNAL_SERVER_ERROR : status;

    if (isNotEmpty(options)) {
      this.sendMethod = isNotEmpty(options.sendMethod) ? options.sendMethod : null;
      this.payload = isNotEmpty(options.payload) ? options.payload : null;
    } else {
      this.sendMethod = null;
      this.payload = null;
    }
  }
}
