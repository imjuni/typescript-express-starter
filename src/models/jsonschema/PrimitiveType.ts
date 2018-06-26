export class PrimitiveType {
  public static readonly stringType: string = '';
  public static readonly numberType: number = 0;
  public static readonly integerType: number = 0;
  public static readonly nullType: null = null;
  public static readonly booleanType: boolean = false; // Always stay positive?
  public static readonly objectType: object = {};

  public static readonly primitiveTypes: string[] = ['string', 'number', 'integer', 'null', 'boolean', 'object'];
}
