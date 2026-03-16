export type Transform<T> = (data: T[]) => T[];

export type Group<T, K extends keyof T> = {
  key: T[K];
  items: T[];
};

export type WhereOp<T> = {
  _tag: "where";
  run: Transform<T>;
};

export type SortOp<T> = {
  _tag: "sort";
  run: Transform<T>;
};

export type GroupByOp<T, K extends keyof T = keyof T> = {
  _tag: "groupBy";
  run: (data: T[]) => Group<T, K>[];
};

export type HavingOp<T, K extends keyof T = keyof T> = {
  _tag: "having";
  run: (groups: Group<T, K>[]) => Group<T, K>[];
};

export function where<T, K extends keyof T>(key: K, value: T[K]): WhereOp<T> {
  return {
    _tag: "where",
    run: (data: T[]) => data.filter((item) => item[key] === value),
  };
}

export function groupBy<T, K extends keyof T>(key: K): GroupByOp<T, K> {
  return {
    _tag: "groupBy",
    run: (data: T[]) =>
      Object.values(
        data.reduce(
          (acc, item) => {
            const groupKey = String(item[key]);
            if (!acc[groupKey]) {
              acc[groupKey] = { key: item[key], items: [] };
            }
            acc[groupKey]!.items.push(item);
            return acc;
          },
          {} as Record<string, Group<T, K>>
        )
      ) as Group<T, K>[],
  };
}

export function having<T, K extends keyof T>(
  predicate: (group: Group<T, K>) => boolean
): HavingOp<T, K> {
  return {
    _tag: "having",
    run: (groups: Group<T, K>[]) => groups.filter(predicate),
  };
}

export function sort<T, K extends keyof T>(key: K): SortOp<T> {
  return {
    _tag: "sort",
    run: (data: T[]) =>
      [...data].sort((a, b) => {
        const av = a[key];
        const bv = b[key];
        if (av < bv) return -1;
        if (av > bv) return 1;
        return 0;
      }),
  };
}

type Phase = "where" | "groupBy" | "having" | "sort";

// Проверка, что последовательность шагов идёт в порядке:
// where -> groupBy -> having -> sort
type IsValidSequence<
  T,
  Steps extends readonly any[],
  Current extends Phase = "where"
> = Steps extends []
  ? true
  : Steps extends [infer S, ...infer Rest]
  ? S extends WhereOp<T>
    ? Current extends "where"
      ? IsValidSequence<T, Rest, "where">
      : false
    : S extends GroupByOp<T, any>
    ? Current extends "where" | "groupBy"
      ? IsValidSequence<T, Rest, "groupBy">
      : false
    : S extends HavingOp<T, any>
    ? Current extends "where" | "groupBy" | "having"
      ? IsValidSequence<T, Rest, "having">
      : false
    : S extends SortOp<T>
    ? IsValidSequence<T, Rest, "sort">
    : false
  : false;

export type ValidQueryOps<T, Steps extends readonly any[]> =
  IsValidSequence<T, Steps> extends true
    ? Steps
    : ["Неверный порядок операторов в query"];

type LastReturn<T, Steps extends readonly any[]> = Steps extends [
  ...any[],
  infer Last
]
  ? Last extends { run: (arg: any) => infer R }
    ? R
    : T[]
  : T[];

export function query<T>() {
  return function <Steps extends readonly any[]>(
    ...steps: ValidQueryOps<T, Steps>
  ): (data: T[]) => LastReturn<T, Steps> {
    return (data: T[]) =>
      steps.reduce<any>((acc, step) => step.run(acc), data as any);
  };
}

