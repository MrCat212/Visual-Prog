import { describe, it, expect, expectTypeOf } from "vitest";
import {
  query,
  where,
  groupBy,
  having,
  sort,
  type Group,
  type WhereOp,
  type GroupByOp,
  type HavingOp,
  type SortOp,
} from "./5";

type User = {
  id: number;
  name: string;
  surname: string;
  age: number;
  city: string;
};

const users: User[] = [
  { id: 1, name: "John", surname: "Doe", age: 34, city: "NY" },
  { id: 2, name: "John", surname: "Doe", age: 33, city: "NY" },
  { id: 3, name: "John", surname: "Doe", age: 35, city: "LA" },
  { id: 4, name: "Mike", surname: "Doe", age: 35, city: "LA" },
];
// Неверный порядок шагов ломает тест
describe("query: корректный порядок шагов", () => {
  it("where + where + groupBy + having + sort работает и типизируется", () => {
    const pipeline = query<User>()(
      where<User, "surname">("surname", "Doe"),
      where<User, "name">("name", "John"),
      groupBy<User, "city">("city"),
      having<User, "city">((group) =>
        group.items.some((u) => u.age > 33)
      ),
      sort<User, "age">("age")
    );

    expectTypeOf(pipeline).toBeFunction();

    const result = pipeline(users);
    const groups = result as unknown as Array<Group<User, "city">>;

    expect(groups).toHaveLength(2);
    const ny = groups.find((g) => g.key === "NY");
    const la = groups.find((g) => g.key === "LA");
    expect(ny?.items.every((u) => u.surname === "Doe")).toBe(true);
    expect(la?.items.every((u) => u.surname === "Doe")).toBe(true);
  });

  it("можно использовать только where", () => {
    const pipeline = query<User>()(where<User, "city">("city", "NY"));
    expectTypeOf(pipeline).toBeFunction();

    const res = pipeline(users);
    expect(res).toHaveLength(2);
    expect(res.every((u) => u.city === "NY")).toBe(true);
  });

  it("можно сразу группировать и фильтровать по группам без where", () => {
    const pipeline = query<User>()(
      groupBy<User, "city">("city"),
      having<User, "city">((group) => group.items.length > 1)
    );

    const res = pipeline(users) as unknown as Array<Group<User, "city">>;
    expect(res).toHaveLength(2);
  });

  it("можно использовать sort только в конце", () => {
    const pipeline = query<User>()(sort<User, "age">("age"));
    const res = pipeline(users);
    expect(res.map((u) => u.age)).toEqual([33, 34, 35, 35]);
  });
});

describe("система типов: шаги имеют разные фазы", () => {
  it("фабрики возвращают правильные типы шагов", () => {
    const w = where<User, "city">("city", "NY");
    const g = groupBy<User, "city">("city");
    const h = having<User, "city">((group) => group.items.length > 0);
    const s = sort<User, "age">("age");

    expectTypeOf(w).toMatchTypeOf<WhereOp<User>>();
    expectTypeOf(g).toMatchTypeOf<GroupByOp<User, "city">>();
    expectTypeOf(h).toMatchTypeOf<HavingOp<User, "city">>();
    expectTypeOf(s).toMatchTypeOf<SortOp<User>>();
  });
});

