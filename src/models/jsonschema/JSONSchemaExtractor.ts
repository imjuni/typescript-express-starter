// tslint:disable max-classes-per-file
// tslint:disable no-object-literal-type-assertion
import * as Case from 'change-case';
import * as dot from 'dot-object';
import * as luxon from 'luxon';
import * as UUID from 'uuid';

import isNotEmpty from '../isNotEmpty';
import { IDateTimeTypePath } from './IDateTimeTypePath';
import { IJSONSchemaType, JSONSchemaSupportType } from './IJSONSchemaType';
import { PrimitiveType } from './PrimitiveType';

export class JSONSchemaExtractor {
  private entryPoint: string;
  private dateTimeTypePaths: IDateTimeTypePath[];
  private copyCamelCasePaths: Set<string>;

  constructor(public readonly schema: IJSONSchemaType) {
    this.entryPoint = [UUID.v4().replace(/-/g, ''), UUID.v4().replace(/-/g, '')].join('');
    this.dateTimeTypePaths = [];
    this.copyCamelCasePaths = new Set<string>();
  }

  public isPrimitive(schema: IJSONSchemaType | IJSONSchemaType[]): boolean {
    if (Array.isArray(schema)) {
      return false;
    }

    if (!isNotEmpty(schema.type)) {
      return false;
    }

    const propertyType: string = schema.type;
    return PrimitiveType.primitiveTypes.indexOf(propertyType) >= 0;
  }

  public isEnum(property: any): boolean {
    if (property.enum === undefined || property.enum === null) return false;

    return Array.isArray(property.enum);
  }

  public isArray(property: any): boolean {
    return Array.isArray(property);
  }

  public getObjectType(property: IJSONSchemaType): JSONSchemaSupportType {
    // 타입을 배열로 전달했을 경우 첫 번째 원소를 반환
    // 타입이 섞여 있는 목록을 전달하고 싶을 때는 Tuple 형식을 사용해야 한다
    if (Array.isArray(property.type) && property.type) {
      property.type = property.type[0];
    }

    // Object를 사용하는 경우 타입을 누락하는 경우가 많아서 properties를 가진 항목은
    // object 타입으로 판단한다
    if (property.properties) {
      return 'object';
    }

    if (property.type === undefined || property.type === null) {
      return 'object';
    }

    return property.type;
  }

  public async visit<O extends object, R extends object>(
    schema: IJSONSchemaType,
    objectPaths: string[],
    data: O,
    extracted: R,
  ): Promise<void> {
    if (!schema) {
      return;
    }

    const type = this.getObjectType(schema);

    // We want non-primitives objects (primitive === object w/o properties).
    if (type === 'object' && schema.properties) {
      if (!dot.pick(objectPaths.join('.'), extracted)) {
        dot.set(objectPaths.join('.'), {}, extracted);
      }

      if (!isNotEmpty<{ [key: string]: IJSONSchemaType }>(schema.properties)) {
        return;
      }

      await Promise.all(
        Object.keys(schema.properties).map((property) => {
          this.visit(schema.properties![property], objectPaths.concat([property]), data, extracted);
        }),
      );
    } else if (schema.allOf) {
      await Promise.all(
        schema.allOf.filter((element) => element.properties).map((element) => {
          this.visit(element, objectPaths, data, extracted);
        }),
      );
    } else if (schema.oneOf) {
      await Promise.all(
        schema.oneOf.filter((element) => element.properties).map((element) => {
          this.visit(element, objectPaths, data, extracted);
        }),
      );
    } else if (schema.anyOf) {
      await Promise.all(
        schema.anyOf.filter((element) => element.properties).map((element) => {
          this.visit(element, objectPaths, data, extracted);
        }),
      );
    } else if (type === 'array') {
      dot.copy(objectPaths.join('.'), objectPaths.join('.'), data, extracted);

      if (Array.isArray(schema.items)) {
        // * Tuple 인 경우
        // 현재 parse는 number or integer type인 경우, string to number conversion을
        // 하는 것을 기준으로 구현되어 있어서 tuple type과 같이 multiple type이 오는 경우
        // forced conversion을 하기 어렵다.
        // 그러므로, array 중에서도 tuple이 아닌 친구만 parse를 한다
        dot.copy(objectPaths.join('.'), objectPaths.join('.'), data, extracted);
      } else {
        // * Array 인 경우
        const propertyType = schema.items!.type;

        // string to number (number) conversion
        if (propertyType === 'number' && schema['##parse']) {
          const origin = dot.pick(objectPaths.join('.'), data);
          const parsed = origin.map((num: any) => parseFloat(num));
          dot.set(objectPaths.join('.'), parsed, extracted);
          // string to integer (number) conversion
        } else if (propertyType === 'integer' && schema['##parse']) {
          const origin = dot.pick(objectPaths.join('.'), data);
          const parsed = origin.map((num: any) => parseInt(num, 10));
          dot.set(objectPaths.join('.'), parsed, extracted);
        } else {
          dot.copy(objectPaths.join('.'), objectPaths.join('.'), data, extracted);
        }
      }
      // 데이터 생성기에서는 enum일 경우 enum 배열 내 값을 선택해야 하기 때문에
      // 다른 로직을 사용하지만 extractor에서는 enum과 primitive는 로직이 동일하다
    } else if (this.isPrimitive(schema) || this.isEnum(schema)) {
      // snake 플래그가 있는 경우 후작업이 가능하도록 등록
      // entryPoint가 포함되어 있으므로, entryPoint를 포함한 최소 1개 이상 경로가 있어야 한다
      if (schema['##snake'] && objectPaths.length > 0) {
        const notIncludeEntryPoint = objectPaths.filter((elem) => elem !== this.entryPoint);
        const [last, ...remainPath] = notIncludeEntryPoint.map((objectPath) => objectPath).reverse();

        remainPath.reverse();

        this.copyCamelCasePaths.add(remainPath.concat([Case.snakeCase(last)]).join('.'));
      }

      const origin = dot.pick(objectPaths.join('.'), data);

      // 문자열에서 숫자타입으로 변경하는 경우
      if (
        origin !== undefined &&
        origin !== null &&
        schema.type &&
        schema['##parse'] &&
        (schema.type === 'number' || schema.type === 'integer')
      ) {
        if (schema.type === 'number') {
          const pickedOrigin = dot.pick(objectPaths.join('.'), data);

          if (pickedOrigin) {
            const parsed = parseFloat(pickedOrigin);
            dot.set(objectPaths.join('.'), parsed, extracted);
          }
        } else {
          const pickedOrigin = dot.pick(objectPaths.join('.'), data);

          if (pickedOrigin) {
            const parsed = parseInt(pickedOrigin, 10);
            dot.set(objectPaths.join('.'), parsed, extracted);
          }
        }
        // 문자열에서 날짜타입으로 변경하는 경우
      } else if (
        origin !== undefined &&
        origin !== null &&
        schema.type &&
        schema.format &&
        schema['##parse'] &&
        schema.type === 'string' &&
        (schema.format === 'date' || schema.format === 'date-time')
      ) {
        this.dateTimeTypePaths.push({
          format: schema.format,
          path: objectPaths.filter((objectPath) => objectPath !== this.entryPoint).join('.'),
        });

        dot.copy(objectPaths.join('.'), objectPaths.join('.'), data, extracted);
      } else if ((origin === undefined || origin === null) && (schema.default !== undefined && schema.default !== null)) {
        dot.set(objectPaths.join('.'), schema.default, extracted);
      } else {
        dot.copy(objectPaths.join('.'), objectPaths.join('.'), data, extracted);
      }
    }
  }

  public async extract<O, R>(originData: O): Promise<R> {
    const extracted: { [key: string]: R } = {};
    const data = {} as { [key: string]: O };

    this.dateTimeTypePaths = [];
    this.copyCamelCasePaths.clear();

    // @ts-ignore
    data[this.entryPoint] = { ...{}, ...originData };

    await this.visit<{ [key: string]: O }, { [key: string]: R }>(this.schema, [this.entryPoint], data, extracted);

    if (this.schema.oneOf) {
      await this.visit<{ [key: string]: O }, { [key: string]: R }>(
        { oneOf: this.schema.oneOf },
        [this.entryPoint],
        data,
        extracted,
      );
    }

    if (this.schema.anyOf) {
      await this.visit<{ [key: string]: O }, { [key: string]: R }>(
        { anyOf: this.schema.anyOf },
        [this.entryPoint],
        data,
        extracted,
      );
    }

    if (this.schema.allOf) {
      await this.visit<{ [key: string]: O }, { [key: string]: R }>(
        { allOf: this.schema.allOf },
        [this.entryPoint],
        data,
        extracted,
      );
    }

    return extracted[this.entryPoint];
  }

  public dateTypeCast(data: object): object {
    const casted: object = { ...{}, ...data } as any;

    // date, date-time 스펙은 RFC-3339를 사용한다
    // via: https://tools.ietf.org/html/rfc3339#section-5.6
    this.dateTimeTypePaths.forEach((dateTimeTypePath) => {
      if (dateTimeTypePath.format === 'date') {
        const origin = dot.pick(dateTimeTypePath.path, data);
        const parsed = luxon.DateTime.fromFormat(origin, 'yyyy-LL-dd');

        if (parsed.isValid) {
          dot.set(dateTimeTypePath.path, parsed.toJSDate(), casted);
        }
      } else if (dateTimeTypePath.format === 'date-time') {
        const origin = dot.pick(dateTimeTypePath.path, casted);
        const parsed = luxon.DateTime.fromISO(origin);

        if (parsed.isValid) {
          dot.set(dateTimeTypePath.path, parsed.toJSDate(), casted);
        }
      }
    });

    return casted;
  }

  public camelCaseCast(data: object): object {
    const casted: object = { ...{}, ...data } as any;

    Array.from<string>(this.copyCamelCasePaths).forEach((pathElem) => {
      const pathElemSplitted = pathElem.split('.');
      const [last, ...forwardPaths] = pathElemSplitted.reverse();

      forwardPaths.reverse();

      const camelCasePath = forwardPaths.concat([Case.camelCase(last)]).join('.');
      const snakeCasePath = pathElem;
      const snakeCaseValue = dot.pick(snakeCasePath, data);
      const camelCaseValue = dot.pick(camelCasePath, data);

      // number type인 경우 NaN 체크를 할까 말까 하다가 제외한다. NaN인 경우도 복사를 해서
      // 결국에 JSONSchema에서 걸러지게 하는 것이 최종적으로는 더 올바른 모습이라고 판단해서
      // undefined가 아닌 경우를 제외하고 나머지는 복사한다.
      function empty(value: any) {
        return value === undefined;
      }

      if (empty(snakeCaseValue) && !empty(camelCaseValue)) {
        dot.set(snakeCasePath, camelCaseValue, casted);
      }
    });

    return casted;
  }
}
