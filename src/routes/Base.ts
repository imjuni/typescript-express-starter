import * as Ajv from 'ajv';
import * as BodyParser from 'body-parser';
import * as debug from 'debug';
import * as express from 'express';
import * as HttpStatusCodes from 'http-status-codes';

import isEmpty from '../models/isEmpty';
import isNotEmpty from '../models/isNotEmpty';
import { JSONSchemaExtractor } from '../models/jsonschema/JSONSchemaExtractor';
import { ResponseBox } from './tools/ResponseBox';
import { RouteOption } from './tools/RouteOption';
import { schemaValidateHandler } from './tools/schemaValidateHandler';
import { TProtoHandler } from './tools/TProtoHandler';

const log = debug('tse:Base');

/**
 * Router 클래스 뼈대가 되는 클래스.
 */
export class Base {
  public static startsWithSlash(routePath$: string): string {
    return routePath$.startsWith('/') ? routePath$ : `/${routePath$}`;
  }

  public static removeEndsWithSlash(routePath$: string): string {
    return routePath$.replace(/(.+?)(\/+)$/, '$1');
  }

  /**
   * version, prefix를 이용하여 라우팅 경로를 생성하는 함수. 기존에 사람이 일일히 손으로 써야했던 것을
   * 자동화하기 위해서 작성
   *
   * @param routePath 라우팅 경로
   * @param prefix 라우팅 경로 앞에 적용될 수식어. /로 구분하여 추가 된다.
   * @param version 라우팅 경로 앞에 적용될 버전 수식어. /로 구분하여 추가된다. prefix, version 중에 version이 먼저 적용되고 prefix가 나중에 적용된다.
   */
  public static createRoutePath(routePath: string, version?: string, prefix?: string): string[] {
    if (isEmpty(prefix) && isEmpty(version)) {
      return [Base.removeEndsWithSlash(Base.startsWithSlash(routePath))];
    }

    if (isNotEmpty(prefix) && isEmpty(version)) {
      return [Base.removeEndsWithSlash(`${Base.startsWithSlash(prefix!)}${Base.startsWithSlash(routePath)}`)];
    }

    if (isEmpty(prefix) && isNotEmpty(version)) {
      return [
        Base.removeEndsWithSlash(`${Base.startsWithSlash(`v${version!}`)}${Base.startsWithSlash(routePath)}`),
        Base.removeEndsWithSlash(`${Base.startsWithSlash(routePath)}`),
      ];
    }

    return [
      Base.removeEndsWithSlash(
        `${Base.startsWithSlash(`v${version}`)}${Base.startsWithSlash(prefix!)}${Base.startsWithSlash(routePath)}`,
      ),
      Base.removeEndsWithSlash(`${Base.startsWithSlash(prefix!)}${Base.startsWithSlash(routePath)}`),
    ];
  }

  constructor(public readonly router: express.Router = express.Router()) {}

  public promiseWrap<P, R>(handler: TProtoHandler<P, R>): express.RequestHandler {
    return function controllerMethod(
      req: express.Request,
      res: express.Response,
      next?: express.NextFunction,
    ): express.Response | void {
      if (isEmpty(req.jsonSchemaRequest)) {
        req.jsonSchemaRequest = req;
      }

      handler(req.jsonSchemaRequest, req, res, next)
        .then((container: ResponseBox<R>) => {
          /**
           * 개발자가 의도한 HttpStatusCode를 출력하도록 container.status 코드가 존재하면
           * container.status 코드를 출력한다
           * 이 코드로 인해서 의도한 "오류"를 생성할 수 있다
           */
          res.status.call(res, isNotEmpty(container.status) ? container.status : HttpStatusCodes.OK);
          res.json.call(res, container.data);
        })
        .catch((err: Error) => {
          if (typeof next === 'function') {
            next(err);
          }
        });
    };
  }

  public routeWrap<P, R>(
    paths: express.PathParam[],
    method: express.IRouterMatcher<express.Router>,
    handler: TProtoHandler<P, R>,
    options: RouteOption,
  ) {
    let schemaValidator: Ajv.ValidateFunction | null = null;
    let schemaExtractor: JSONSchemaExtractor | null = null;

    if (options.schema) {
      try {
        const ajv = new Ajv();

        schemaValidator = ajv.compile(options.schema);
        schemaExtractor = new JSONSchemaExtractor(options.schema);
      } catch (err) {
        log('------------------------------------------------------------------------------------');
        log('JSONSchema compile error');
        log(err.message);
        log(err.stack);
        log('------------------------------------------------------------------------------------');
        schemaValidator = null;
      }
    }

    const handlers: express.RequestHandler[] = [];

    if (options.bodyParser) {
      // MTA Proxy를 할 때 POST를 정상적으로 처리하려면 아래 requestHandler가 포함되면 안된다.
      // BodyParser는 POST 데이터를 Request 객체에서 쓰기 좋게 JSON.parse 등으로 Object로 바꾸는 작업을 하기 때문에
      // BodyParser를 적용하고 POST proxying을 하면 hang이 걸리거나 오류가 발생한다.
      handlers.push(BodyParser.urlencoded({ extended: false }));
      handlers.push(BodyParser.json());
    }

    if (schemaValidator && schemaExtractor) {
      handlers.push(schemaValidateHandler<R>(schemaValidator, schemaExtractor));
    }

    handlers.push(this.promiseWrap<P, R>(handler));
    method.apply(this.router, [paths, handlers]);

    return this.router;
  }

  public get<P, R>(paths: express.PathParam[], handler: TProtoHandler<P, R>, routeOption: RouteOption) {
    return this.routeWrap<P, R>(paths, this.router.get, handler, routeOption);
  }

  public post<P, R>(paths: express.PathParam[], handler: TProtoHandler<P, R>, routeOption: RouteOption) {
    return this.routeWrap<P, R>(paths, this.router.post, handler, routeOption);
  }

  public put<P, R>(paths: express.PathParam[], handler: TProtoHandler<P, R>, routeOption: RouteOption) {
    return this.routeWrap<P, R>(paths, this.router.put, handler, routeOption);
  }

  public delete<P, R>(paths: express.PathParam[], handler: TProtoHandler<P, R>, routeOption: RouteOption) {
    return this.routeWrap<P, R>(paths, this.router.delete, handler, routeOption);
  }

  public options<P, R>(paths: express.PathParam[], handler: TProtoHandler<P, R>, routeOption: RouteOption) {
    return this.routeWrap<P, R>(paths, this.router.options, handler, routeOption);
  }
}
