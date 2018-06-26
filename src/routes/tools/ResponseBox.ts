import { integer } from '../../models/integer';

export class ResponseBox<T> {
  public readonly status: integer | null | undefined;
  public readonly data: T;
  public readonly err: Error | null | undefined;

  constructor({ status, data, err }: { status?: integer | null | undefined; data: T; err?: Error | null | undefined }) {
    this.status = status;
    this.data = data;
    this.err = err;
  }
}
