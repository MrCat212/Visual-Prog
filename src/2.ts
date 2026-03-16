import { readFile, writeFile } from "node:fs/promises";

function buildDelimiterRegex(delimiter: string): RegExp {
  const escaped = delimiter.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  return new RegExp(`[${escaped}]+`);
}

export function csvToJSON(input: string[], delimiter: string): object[] {
  if (!Array.isArray(input) || input.length === 0) {
    return [];
  }

  const headerLine = input[0];
  const dataLines = input.slice(1);
  const splitRegex = buildDelimiterRegex(delimiter);
  const headers = headerLine.split(splitRegex).map((h) => h.trim());

  if (headers.some((h) => h.length === 0)) {
    throw new Error("Invalid header");
  }

  const result: object[] = [];
  const columnTypes = new Map<string, "number" | "string">();

  for (const line of dataLines) {
    if (line.trim().length === 0) continue;

    const values = line.split(splitRegex);
    if (values.length !== headers.length) {
      throw new Error("Column count mismatch");
    }

    const obj: Record<string, unknown> = {};

    headers.forEach((header, index) => {
      const raw = values[index].trim();
      let value: string | number = raw;

      if (/^-?\d+(\.\d+)?$/.test(raw)) {
        value = Number(raw);
      }

      const existingType = columnTypes.get(header);
      const currentType = typeof value === "number" ? "number" : "string";

      if (!existingType) {
        columnTypes.set(header, currentType);
      } else if (existingType !== currentType) {
        throw new Error("Type mismatch between rows");
      }

      obj[header] = value;
    });

    result.push(obj);
  }

  return result;
}

export async function formatCSVFileToJSONFile(
  input: string,
  output: string,
  delimiter: string
): Promise<void> {
  const content = await readFile(input, "utf-8");
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const data = csvToJSON(lines, delimiter);
  const json = JSON.stringify(data, null, 2);

  await writeFile(output, json, "utf-8");
}

