// 1. Функция: массив T[] -> новый массив T[]
export type Transform<T> = (data: T[]) => T[];

// 2. Transform<T>, фильтрует по полю
export type Where<T> = <K extends keyof T>(
  key: K,
  value: T[K]
) => Transform<T>;

// 3. Transform<T>, сортирует по полю
export type Sort<T> = <K extends keyof T>(key: K) => Transform<T>;

// 4. Описать тип Group<T, K>, каждый объект которого представляет собой объект, описывающий одну группу
export type Group<T, K extends keyof T> = {
  key: T[K];
  items: T[];
};

// 5.
export type GroupBy<T> = <K extends keyof T>(
  key: K
) => (data: T[]) => Group<T, K>[];

// 6. Массив групп -> новый массив групп
export type GroupTransform<T, K extends keyof T> = (
  groups: Group<T, K>[]
) => Group<T, K>[];

// 7. Having<T> — (predicate по группе) => GroupTransform<T, K>
export type Having<T> = <K extends keyof T>(
  predicate: (group: Group<T, K>) => boolean
) => GroupTransform<T, K>;

// 8. query — цепочка шагов Transform<…> или GroupTransform<…>, возвращает один Transform
export function query<T>(

    ...steps: Array<(data: any) => any>

): (data: T[]) => any {
  return (data: T[]) => steps.reduce((acc, step) => step(acc), data);
}