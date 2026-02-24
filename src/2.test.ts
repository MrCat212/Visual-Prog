import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { csvToJSON, formatCSVFileToJSONFile } from "./2";

vi.mock("node:fs/promises", () => {
  return {
    readFile: vi.fn(),
    writeFile: vi.fn(),
  };
});

import { readFile, writeFile } from "node:fs/promises";

const readFileMock = readFile as unknown as Mock;
const writeFileMock = writeFile as unknown as Mock;

beforeEach(() => {
  readFileMock.mockReset();
  writeFileMock.mockReset();
});

// Преобразование массива строк CSV в массив объектов
describe("csvToJSON", () => {
  it("Тест: корректно переводит нормальный CSV в массив объектов", () => {
    const input = ["p1;p2;p3;p4", "1;A;b;c", "2;B;v;d"];

    const res = csvToJSON(input, ";") as Array<Record<string, unknown>>;

    expect(res).toEqual([
      { p1: 1, p2: "A", p3: "b", p4: "c" },
      { p1: 2, p2: "B", p3: "v", p4: "d" },
    ]);
  });

  it("Тест: кидает ошибку, если в строке данных меньше/больше столбцов, чем в шапке", () => {
    const input = ["p1;p2", "1;A", "2"];

    expect(() => csvToJSON(input, ";")).toThrow("Column count mismatch");
  });

  it("Тест: кидает ошибку, если типы в одном и том же столбце отличаются между строками", () => {
    const input = ["p1;p2", "1;A", "B;C"];

    expect(() => csvToJSON(input, ";")).toThrow("Type mismatch");
  });

  it("Тест: при пустом входном массиве возвращается пустой массив объектов", () => {
    expect(csvToJSON([], ";")).toEqual([]);
  });
});

// Тесты функции formatCSVFileToJSONFile
describe("formatCSVFileToJSONFile", () => {
  it("Тест: при нормальном CSV вызывается readFile и writeFile с правильными аргументами", async () => {
    readFileMock.mockResolvedValue("p1;p2;p3;p4\n1;A;b;c\n2;B;v;d");
    writeFileMock.mockResolvedValue(undefined);

    await formatCSVFileToJSONFile("input.csv", "output.json", ";");

    expect(readFileMock).toHaveBeenCalledTimes(1);
    expect(readFileMock).toHaveBeenCalledWith("input.csv", "utf-8");

    const expectedJson = JSON.stringify(
      [
        { p1: 1, p2: "A", p3: "b", p4: "c" },
        { p1: 2, p2: "B", p3: "v", p4: "d" },
      ],
      null,
      2
    );

    expect(writeFileMock).toHaveBeenCalledTimes(1);
    expect(writeFileMock).toHaveBeenCalledWith(
      "output.json",
      expectedJson,
      "utf-8"
    );
  });

  it("Тест: при некорректном CSV промис отклоняется и writeFile не вызывается", async () => {
    readFileMock.mockResolvedValue("p1;p2\n1;A\n2"); // некорректный csv
    writeFileMock.mockResolvedValue(undefined);

    await expect(
      formatCSVFileToJSONFile("bad.csv", "out.json", ";")
    ).rejects.toThrow();

    expect(writeFileMock).not.toHaveBeenCalled();
  });
});