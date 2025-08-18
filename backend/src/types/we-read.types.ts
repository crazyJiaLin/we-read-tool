export interface WeReadBook {
  bookId: string;
  book: {
    title: string;
    author: string;
    cover: string;
    category: string;
    intro: string;
    wordCount: number;
    isbn: string;
  };
  sort: number;
  readingProgress: number;
  readingTime: number;
  lastReadingTime: number;
  isFinished: boolean;
}

export interface WeReadNote {
  bookmarkId: string;
  reviewId?: string;
  chapterUid: number;
  chapterIdx: number;
  chapterTitle: string;
  markText: string;
  content?: string;
  type: number; // 0: 划线, 1: 笔记
  style: number;
  colorStyle: number;
  range: string;
  createTime: number;
  updateTime: number;
  updated: any[];
}

export interface WeReadChapter {
  chapterUid: number;
  chapterIdx: number;
  title: string;
  level: number;
  updateTime: number;
}

export interface WeReadReadingStats {
  totalBooks: number;
  finishedBooks: number;
  readingBooks: number;
  totalReadingTime: number;
  totalWords: number;
  averageReadingTime: number;
  readingStreak: number;
  lastReadingDate: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
}
