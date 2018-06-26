import { Send } from 'express';
import { IJSONSchemaType } from '../../models/jsonschema/IJSONSchemaType';

export class RouteOption {
  constructor(
    public readonly accessToken: boolean = true,
    public readonly bodyParser: boolean = true,
    public readonly title: string,
    public readonly description: string,
    public readonly schema?: IJSONSchemaType,
    public readonly senderMethod?: Send,
  ) {}
}
