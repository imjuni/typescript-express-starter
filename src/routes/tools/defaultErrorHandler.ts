import * as debug from 'debug';
import { NextFunction, Request, Response, Send } from 'express';
import * as HttpStatusCodes from 'http-status-codes';

const log = debug('tes:defaultErrorHandler');

export function defaultErrorHandler(err: Error, _: Request, res: Response, next?: NextFunction) {
  const statusCode = HttpStatusCodes.INTERNAL_SERVER_ERROR;
  const sender: Send = res.json;
  const message = err.message;

  log(`defaultErrorHandler:[${statusCode}]: ${message}`);
  log('Error Stack: ', err.stack || 'no-stack');

  // 응답의 기록을 시작한 후에 오류가 있는 next()를 호출하는 경우(예: 응답을 클라이언트로 스트리밍하는 중에 오류가 발생하는 경우),
  // Express의 기본 오류 핸들러는 해당 연결을 닫고 해당 요청을 처리하지 않습니다. 따라서 사용자 정의 오류 핸들러를 추가할 때,
  // 헤더가 이미 클라이언트로 전송된 경우에는 다음과 같이 Express 내의 기본 오류 처리 메커니즘에 위임해야 합니다
  // via: http://expressjs.com/ko/guide/error-handling.html
  if (res.headersSent && typeof next === 'function') {
    log(`defaultErrorHandler, Header already send[${res.headersSent}] call 'next'`);
    return next(err);
  }

  res.status(statusCode);

  sender.apply(res, [
    {
      message,
    },
  ]);
}
