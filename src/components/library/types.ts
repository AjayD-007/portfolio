export type Book = {
  title: string;
  author: string;
  genre: string;
  rating: number | string;
  review: string;
  coverImageUrl?: string;
  externalLink?: string;
  dateCompleted: string;
  language?: string;
  length?: "Short" | "Full";
};

export type Movie = {
  title: string;
  director: string;
  type: string;
  genre: string;
  rating: number | string;
  review: string;
  coverImageUrl?: string;
  externalLink?: string;
  dateCompleted: string;
  imdbID?: string;
  status?: string; // "watched" or "watch_later"
  language?: string;
};
