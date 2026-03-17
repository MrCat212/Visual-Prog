import { describe, it, expectTypeOf } from "vitest";
import { type DeepReadonly, type PickedByType, type EventHandlers } from "./6";

describe("DeepReadonly", () => {
  type Example = {
    id: number;
    name: string;
    nested: {
      value: string;
      inner: {
        flag: boolean;
      };
    };
    list: { x: number }[];
    optional?: {
      n: number;
    };
    fn: (a: number) => string;
  };

  type Expected = {
    readonly id: number;
    readonly name: string;
    readonly nested: {
      readonly value: string;
      readonly inner: {
        readonly flag: boolean;
      };
    };
    readonly list: ReadonlyArray<{
      readonly x: number;
    }>;
    readonly optional?: {
      readonly n: number;
    };
    readonly fn: (a: number) => string;
  };

  it("делает объект рекурсивно readonly", () => {
    expectTypeOf<DeepReadonly<Example>>().toEqualTypeOf<Expected>();

    const value: DeepReadonly<Example> = {
      id: 1,
      name: "test",
      nested: { value: "v", inner: { flag: true } },
      list: [{ x: 1 }],
      optional: { n: 10 },
      fn: (a) => String(a),
    };

    // проверяем, что переприсвоение глубоко вложенного свойства запрещено
    // @ts-expect-error readonly свойство менять нельзя
    value.nested.inner.flag = false;

    // @ts-expect-error элементы массива тоже readonly
    value.list[0].x = 2;
  });
});

// 2. PickedByType<T, U>
describe("PickedByType", () => {
  type Obj = {
    id: number;
    name: string;
    active: boolean;
    age?: number;
    tags: string[];
  };

  it("выбирает только поля нужного типа", () => {
    type OnlyNumbers = PickedByType<Obj, number>;
    type ExpectedNumbers = {
      id: number;
    };

    expectTypeOf<OnlyNumbers>().toEqualTypeOf<ExpectedNumbers>();

    type OnlyBooleans = PickedByType<Obj, boolean>;
    type ExpectedBooleans = {
      active: boolean;
    };

    expectTypeOf<OnlyBooleans>().toEqualTypeOf<ExpectedBooleans>();
  });
});

// 3. EventHandlers<T>
describe("EventHandlers", () => {
  type Events = {
    click: { x: number; y: number };
    change: { value: string };
    focus: void;
  };

  it("генерирует onXxx-обработчики по объекту событий", () => {
    type Handlers = EventHandlers<Events>;

    type Expected = {
      onClick: (event: { x: number; y: number }) => void;
      onChange: (event: { value: string }) => void;
      onFocus: (event: void) => void;
    };

    expectTypeOf<Handlers>().toEqualTypeOf<Expected>();

    const handlers: Handlers = {
      onClick: (e) => {
        const sum = e.x + e.y;
        void sum;
      },
      onChange: (e) => {
        const v = e.value.toUpperCase();
        void v;
      },
      onFocus: (_e) => {
      },
    };

    void handlers;
  });
});

