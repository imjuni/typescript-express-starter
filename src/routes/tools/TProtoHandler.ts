import { NextFunction, Request, Response } from 'express';
import { ResponseBox } from './ResponseBox';

export type TProtoHandler<P, R> = (
  requestObject: P,
  req?: Request,
  res?: Response,
  next?: NextFunction,
) => Promise<ResponseBox<R>>;
