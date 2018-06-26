export default function isEmpty<T>(value?: T | undefined | null): value is undefined | null {
  return value === undefined || value === null;
}
