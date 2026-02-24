import { it, describe, expect, beforeAll, beforeEach, afterAll, afterEach } from 'vitest';

// Импортируем функции из исходного файла как обычный модуль
import {
  createUser,
  createBook,
  calculateArea,
  getStatusColor,
  capitalizeFirst,
  trimAndFormat,
  getFirstElement,
  findById,
} from "./1";

describe("createUser", () => {
  it("Создаёт активного пользователя по умолчанию", () => {
    const user = createUser(1, "Andrew");
    expect(user).toEqual({
      id: 1,
      name: "Andrew",
      email: undefined,
      isActive: true,
    });
  });

  it("принимает все аргументы", () => {
    const user = createUser(2, "Bob", "bob@gmail.com", false);
    expect(user).toEqual({
      id: 2,
      name: "Bob",
      email: "bob@gmail.com",
      isActive: false,
    });
  });
});

describe("createBook", () => {
  it("возвращает ту же книгу", () => {
    const book = {
      title: "Test",
      author: "Author",
      year: 2024,
      genre: "fiction" as const,
    };
    expect(createBook(book)).toBe(book);
  });
});

describe("calculateArea", () => {
  it("Считает площадь круга", () => {
    const area = calculateArea("circle", 2);
    expect(area).toBeCloseTo(Math.PI * 4);
  });

  it("Считает площадь квадрата", () => {
    const area = calculateArea("square", 3);
    expect(area).toBe(9);
  });
});

describe("getStatusColor", () => {
  it("Возвращает корректные цвета", () => {
    expect(getStatusColor("active")).toBe("green");
    expect(getStatusColor("inactive")).toBe("gray");
    expect(getStatusColor("new")).toBe("blue");
  });
});

describe("capitalizeFirst", () => {
  it("Делает первую букву заглавной, остальные маленькими", () => {
    expect(capitalizeFirst("hELLo")).toBe("Hello");
  });

  it("Возвращает пустую строку для пустого ввода", () => {
    expect(capitalizeFirst("")).toBe("");
  });

  it("Переводит всё слово в верхний регистр при флаге uppercase", () => {
    expect(capitalizeFirst("hello", true)).toBe("HELLO");
  });
});

describe("trimAndFormat", () => {
  it("Обрезает пробелы по краям", () => {
    expect(trimAndFormat("   hi   ")).toBe("hi");
  });

  it("Обрезает и делает верхний регистр при флаге uppercase", () => {
    expect(trimAndFormat("  hello world  ", true)).toBe("HELLO WORLD");
  });
});

describe("getFirstElement", () => {
  it("Возвращает первый элемент массива", () => {
    expect(getFirstElement([1, 2, 3])).toBe(1);
  });

  it("Возвращает undefined для пустого массива", () => {
    expect(getFirstElement([])).toBeUndefined();
  });
});

describe("findById", () => {
  const items = [
    { id: 1, name: "One" },
    { id: 2, name: "Two" },
  ];

  it("Находит элемент по id", () => {
    expect(findById(items, 2)).toEqual({ id: 2, name: "Two" });
  });

  it("Возвращает undefined, если элемента нет", () => {
    expect(findById(items, 3)).toBeUndefined();
  });
});