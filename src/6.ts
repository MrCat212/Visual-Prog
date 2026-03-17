export type DeepReadonly<T> =
  T extends (...args: any[]) => any
    ? T
    :
    T extends readonly (infer U)[]
    ? ReadonlyArray<DeepReadonly<U>>
    :
    T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    :
      T;

export type PickedByType<T, U> = {
  [K in keyof T as T[K] extends U ? K : never]: T[K];
};

export type EventHandlers<T extends Record<string, any>> = {
  [K in keyof T as `on${Capitalize<string & K>}`]: (event: T[K]) => void;
};

