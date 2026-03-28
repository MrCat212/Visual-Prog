import React, { useEffect, useMemo, useState } from "react";

const BOOKS_API = "https://fakeapi.extendsclass.com/books";
const COVERS_API = "https://covers.openlibrary.org/b/isbn";
const BOOKS_TIMEOUT = 10000;
const COVER_TIMEOUT = 4000;
const FALLBACK_BOOKS: ApiBook[] = [
  {
    id: 9001,
    title: "Specification by Example",
    isbn: "1617290084",
    pageCount: 379,
    authors: ["Gojko Adzic"],
  },
  {
    id: 9002,
    title: "Clean Code",
    isbn: "9780132350884",
    pageCount: 464,
    authors: ["Robert C. Martin"],
  },
  {
    id: 9003,
    title: "Refactoring",
    isbn: "9780134757599",
    pageCount: 448,
    authors: ["Martin Fowler"],
  },
  {
    id: 9004,
    title: "Domain-Driven Design",
    isbn: "9780321125217",
    pageCount: 560,
    authors: ["Eric Evans"],
  },
  {
    id: 9005,
    title: "Design Patterns",
    isbn: "9780201633610",
    pageCount: 395,
    authors: ["Erich Gamma", "Richard Helm", "Ralph Johnson", "John Vlissides"],
  },
  {
    id: 9006,
    title: "The Pragmatic Programmer",
    isbn: "9780135957059",
    pageCount: 352,
    authors: ["David Thomas", "Andrew Hunt"],
  },
  {
    id: 9007,
    title: "Code Complete",
    isbn: "9780735619678",
    pageCount: 914,
    authors: ["Steve McConnell"],
  },
  {
    id: 9008,
    title: "Working Effectively with Legacy Code",
    isbn: "9780131177055",
    pageCount: 456,
    authors: ["Michael Feathers"],
  },
];

type ApiBook = {
  id: number;
  title: string;
  isbn: string;
  pageCount: number;
  authors: string[];
};

type CardBook = {
  id: number;
  title: string;
  authors: string[];
  coverSrc: string | null;
};

type BookCardProps = CardBook;

const ui = {
  page: {
    fontFamily: "Arial, sans-serif",
    margin: "0 auto",
    maxWidth: "1200px",
    padding: "24px",
  } satisfies React.CSSProperties,
  heading: {
    fontSize: "32px",
    margin: "0 0 20px",
  } satisfies React.CSSProperties,
  list: {
    display: "flex",
    flexWrap: "wrap",
    gap: "16px",
  } satisfies React.CSSProperties,
  card: {
    background: "#ffffff",
    border: "1px solid #cfd6dd",
    borderRadius: "10px",
    display: "flex",
    flexDirection: "column",
    padding: "12px",
    width: "210px",
  } satisfies React.CSSProperties,
  cover: {
    alignSelf: "center",
    borderRadius: "6px",
    height: "280px",
    objectFit: "cover",
    width: "180px",
  } satisfies React.CSSProperties,
  emptyCover: {
    alignItems: "center",
    background: "#eceff3",
    color: "#6d7783",
    display: "flex",
    fontSize: "14px",
    justifyContent: "center",
  } satisfies React.CSSProperties,
  bookTitle: {
    fontSize: "22px",
    fontWeight: 700,
    margin: "12px 0 8px",
  } satisfies React.CSSProperties,
  bookAuthors: {
    color: "#54606f",
    fontSize: "16px",
    margin: 0,
  } satisfies React.CSSProperties,
  text: {
    color: "#404a56",
    fontSize: "16px",
  } satisfies React.CSSProperties,
  errorText: {
    color: "#b00020",
    fontSize: "16px",
  } satisfies React.CSSProperties,
};

function requestWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, { signal: controller.signal }).finally(() => {
    clearTimeout(timer);
  });
}

async function loadBooksFromApi(): Promise<ApiBook[]> {
  let response: Response;
  try {
    response = await requestWithTimeout(BOOKS_API, BOOKS_TIMEOUT);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return FALLBACK_BOOKS;
    }
    throw error;
  }

  if (!response.ok) {
    return FALLBACK_BOOKS;
  }

  const data = (await response.json()) as ApiBook[];
  if (!Array.isArray(data) || data.length === 0) {
    return FALLBACK_BOOKS;
  }

  return data;
}

async function getCoverUrlByIsbn(isbn: string): Promise<string | null> {
  const value = isbn.trim();
  if (!value) {
    return null;
  }

  const imageUrl = `${COVERS_API}/${encodeURIComponent(value)}-M.jpg`;
  try {
    const response = await requestWithTimeout(
      `${imageUrl}?default=false`,
      COVER_TIMEOUT,
    );
    if (!response.ok) {
      return null;
    }
    return imageUrl;
  } catch {
    return null;
  }
}

async function createCards(books: ApiBook[]): Promise<CardBook[]> {
  return Promise.all(
    books.map(async (book) => ({
      id: book.id,
      title: book.title,
      authors: book.authors,
      coverSrc: await getCoverUrlByIsbn(book.isbn),
    })),
  );
}

function BookCard({ title, authors, coverSrc }: BookCardProps) {
  return (
    <article style={ui.card}>
      {coverSrc ? (
        <img src={coverSrc} alt={`Обложка книги ${title}`} style={ui.cover} />
      ) : (
        <div style={{ ...ui.cover, ...ui.emptyCover }}>Нет обложки</div>
      )}
      <h2 style={ui.bookTitle}>{title}</h2>
      <p style={ui.bookAuthors}>
        {authors.length ? authors.join(", ") : "Автор неизвестен"}
      </p>
    </article>
  );
}

export default function Lab7() {
  const [items, setItems] = useState<CardBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const books = await loadBooksFromApi();
        const baseCards: CardBook[] = books.map((book) => ({
          id: book.id,
          title: book.title,
          authors: book.authors,
          coverSrc: null,
        }));

        if (!cancelled) {
          setItems(baseCards);
          setLoading(false);
        }

        const completedCards = await createCards(books);
        if (!cancelled) {
          setItems(completedCards);
        }
      } catch (e) {
        if (!cancelled) {
          setLoading(false);
          if (e instanceof Error && e.name === "AbortError") {
            setError("Сервер долго отвечает. Попробуйте обновить страницу позже.");
          } else {
            setError(e instanceof Error ? e.message : "Неизвестная ошибка");
          }
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  const isEmpty = useMemo(() => !loading && !error && items.length === 0, [loading, error, items.length]);

  return (
    <main style={ui.page}>
      <h1 style={ui.heading}>Лабораторная 7</h1>

      {loading && <p style={ui.text}>Загрузка книг...</p>}
      {error && <p style={ui.errorText}>{error}</p>}
      {isEmpty && <p style={ui.text}>Список книг пуст.</p>}

      {!loading && !error && items.length > 0 && (
        <section style={ui.list}>
          {items.map((book) => (
            <BookCard
              key={book.id}
              id={book.id}
              title={book.title}
              authors={book.authors}
              coverSrc={book.coverSrc}
            />
          ))}
        </section>
      )}
    </main>
  );
}
