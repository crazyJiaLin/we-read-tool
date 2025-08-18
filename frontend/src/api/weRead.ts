import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 30000,
});

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    const data = response.data;
    // 如果返回的是数组，确保它是安全的
    if (Array.isArray(data)) {
      return data;
    }
    // 如果返回的是对象且包含data字段，检查data是否为数组
    if (data && typeof data === "object" && "data" in data) {
      if (Array.isArray(data.data)) {
        return data.data;
      }
      return data;
    }
    return data;
  },
  (error) => {
    console.error("API Error:", error);
    throw new Error(error.response?.data?.message || "请求失败");
  }
);

export interface UserData {
  totalReadingTime: number;
  totalBooks: number;
  totalNotes: number;
  monthlyBooks: number;
  readingTimeData: number[];
  categoryData: Array<{ name: string; value: number }>;
  recentBooks: Array<{
    id: string;
    title: string;
    author: string;
    progress: number;
    lastRead: string;
  }>;
}

export interface Book {
  book: any;
  id: string;
  title: string;
  author: string;
  cover: string;
  progress: number;
  totalPages: number;
  currentPage: number;
  lastRead: string;
  category: string;
}
export interface Note {
  bookmarkId: string;
  reviewId?: string;
  chapterUid: number;
  chapterIdx: number;
  chapterTitle: string;
  markText: string;
  content?: string;
  type: number; // 1: 划线, 2: 笔记
  style: number;
  colorStyle: number;
  range: string;
  createTime: number;
  updateTime: number;
}

export interface NoteResponse {
  updated: Note[];
  chapters: Array<{
    chapterUid: number;
    chapterIdx: number;
    title: string;
    level: number;
    updateTime: number;
  }>;
  book: {
    title: string;
    author: string;
    cover: string;
  };
}

export interface NoteWithBook extends Note {
  bookTitle: string;
  bookAuthor: string;
  bookCover: string;
}

export interface Stats {
  totalReadingTime: number;
  totalBooks: number;
  totalNotes: number;
  monthlyBooks: number;
  readingTimeData: number[];
  categoryData: { name: string; value: number }[];
  recentBooks: Array<{
    id: string;
    title: string;
    author: string;
    cover: string;
    progress: number;
    lastRead: string;
    category: string;
  }>;
}

// 获取用户数据
export const fetchUserData = async (cookie: string): Promise<UserData> => {
  return api.post("/weRead/userData", { cookie });
};

// 获取书籍列表（有笔记的书）
export const fetchBooks = async (cookie: string): Promise<Book[]> => {
  return api.post("/weRead/books", { cookie });
};

// 获取全部书架
export const fetchEntireShelf = async (cookie: string): Promise<any[]> => {
  return api.post("/weRead/entireShelf", { cookie });
};

// 获取书籍详情
export const fetchBookDetail = async (
  cookie: string,
  bookId: string
): Promise<any> => {
  return api.post("/weRead/bookDetail", { cookie, bookId });
};

// 获取笔记列表
export const fetchNotes = async (
  cookie: string,
  bookId?: string
): Promise<Note[]> => {
  return api.post("/weRead/notes", { cookie, bookId });
};

// 获取章节信息
export const fetchChapters = async (
  cookie: string,
  bookId: string
): Promise<any[]> => {
  return api.post("/weRead/chapters", { cookie, bookId });
};

// 获取书籍评论
export const fetchReviews = async (
  cookie: string,
  bookId: string
): Promise<any[]> => {
  return api.post("/weRead/reviews", { cookie, bookId });
};

// 获取阅读进度
export const fetchReadInfo = async (
  cookie: string,
  bookId: string
): Promise<any> => {
  return api.post("/weRead/readInfo", { cookie, bookId });
};

// 获取热门书评
export const fetchBestReviews = async (
  cookie: string,
  bookId: string,
  count = 10,
  maxIdx = 0,
  synckey = 0
): Promise<any> => {
  return api.post("/weRead/bestReviews", {
    cookie,
    bookId,
    count,
    maxIdx,
    synckey,
  });
};

// 获取阅读统计
export const fetchReadingStats = async (cookie: string): Promise<any> => {
  return api.post("/weRead/readingStats", { cookie });
};

// AI问答
export const askAI = async (
  question: string,
  context?: string
): Promise<string> => {
  return api.post("/ai/ask", { question, context });
};

// AI整理笔记
export const organizeNotes = async (
  notes: any[],
  cookie: string
): Promise<any> => {
  return api.post("/ai/organizeNotes", { notes, cookie });
};

// 新增：流式问答API
export const askAIStream = async ({
  books,
  question,
  context,
  onChunk,
  onComplete,
  onError,
}: {
  books?: any[];
  question: string;
  context?: string;
  onChunk?: (chunk: string) => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
}) => {
  try {
    const response = await fetch("/api/ai/askStream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question,
        context,
        books,
        cookie: localStorage.getItem("weReadCookie"),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No reader available");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        onComplete?.();
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const content = line.slice(6);
          if (content === "[DONE]") {
            onComplete?.();
            return;
          }

          try {
            const parsed = JSON.parse(content);
            // 检查是否是Moonshot API的响应格式
            if (
              parsed.choices &&
              parsed.choices[0] &&
              parsed.choices[0].delta &&
              parsed.choices[0].delta.content
            ) {
              onChunk?.(parsed.choices[0].delta.content);
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }
  } catch (error) {
    onError?.(error instanceof Error ? error.message : "Unknown error");
  }
};

// 新增：流式整理笔记API
export const organizeNotesStream = async (
  notes: any[],
  cookie: string,
  onChunk?: (chunk: string) => void,
  onSummary?: (summary: any) => void,
  onComplete?: () => void,
  onError?: (error: string) => void
): Promise<void> => {
  try {
    const response = await fetch("/api/ai/organizeNotesStream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ notes, cookie }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No reader available");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        onComplete?.();
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const content = line.slice(6);
          if (content === "[DONE]") {
            onComplete?.();
            return;
          }

          try {
            const parsed = JSON.parse(content);
            // 检查是否是Moonshot API的响应格式
            if (
              parsed.choices &&
              parsed.choices[0] &&
              parsed.choices[0].delta &&
              parsed.choices[0].delta.content
            ) {
              onChunk?.(parsed.choices[0].delta.content);
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }
  } catch (error) {
    onError?.(error instanceof Error ? error.message : "Unknown error");
  }
};
