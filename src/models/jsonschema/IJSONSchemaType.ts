export type JSONSchemaSupportType = 'string' | 'number' | 'integer' | 'array' | 'object' | 'boolean';
export type JSONSchemaSupportDateTypeFormat = 'date-time' | 'date';
export type JSONSchemaSupportFormat = JSONSchemaSupportDateTypeFormat | 'email' | 'hostname' | 'ipv4' | 'ipv6' | 'uri';

export interface IJSONSchemaType {
  properties?: {
    [key: string]: IJSONSchemaType;
  };
  title?: string;
  description?: string;
  default?: any;
  type?: JSONSchemaSupportType;
  required?: Array<string | IJSONSchemaType>;
  format?: JSONSchemaSupportFormat;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  exclusiveMinimum?: number;
  maximum?: number;
  exclusiveMaximum?: number;
  items?: IJSONSchemaType | IJSONSchemaType[];
  enum?: IJSONSchemaType | Array<IJSONSchemaType | string | number>;
  oneOf?: IJSONSchemaType[];
  anyOf?: IJSONSchemaType[];
  allOf?: IJSONSchemaType[];

  // 이 부분은 실제 JSONSchema에 포함되지 않은 제어를 위한 필드이다
  // Request 객체에서 query, params, headers는 string[]만으로 전달되기 때문에
  // query, params, headers에서 number or integer 등을 얻기 위해서는 변환이
  // 필요하다. extraction 과정에서 이런 변환을 수행할 것을 설정하는 옵션이다.
  '##parse'?: boolean;
  '##snake'?: boolean;
}
