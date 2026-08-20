export class Result<T> {
  public readonly isSuccess: boolean;
  public readonly isFailure: boolean;
  public readonly error: string | null;
  public readonly errorCode: string | null;
  private readonly _value: T | null;

  private constructor(isSuccess: boolean, error?: string, errorCode?: string, value?: T) {
    if (isSuccess && error) {
      throw new Error("InvalidOperation: A result cannot be successful and contain an error");
    }
    if (!isSuccess && !error) {
      throw new Error("InvalidOperation: A failing result needs to contain an error message");
    }

    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this.error = error || null;
    this.errorCode = errorCode || null;
    this._value = value !== undefined ? value : null;
  }

  public getValue(): T {
    if (!this.isSuccess || this._value === null) {
      throw new Error("Can't get the value of an error result. Use 'error' instead.");
    }
    return this._value;
  }

  public static ok<U>(value?: U): Result<U> {
    return new Result<U>(true, undefined, undefined, value);
  }

  public static fail<U>(error: string, errorCode?: string): Result<U> {
    return new Result<U>(false, error, errorCode);
  }
}
