import { Provide } from '@midwayjs/core';
import axios from 'axios';
import {
  WeReadBook,
  WeReadNote,
  WeReadChapter,
  WeReadReadingStats,
} from '../types/we-read.types';

const WEREAD_NOTEBOOKS_URL = 'https://weread.qq.com/api/user/notebook';
const WEREAD_BOOK_INFO_URL = 'https://weread.qq.com/api/book/info';
const WEREAD_BOOKMARKLIST_URL = 'https://weread.qq.com/web/book/bookmarklist';
const WEREAD_CHAPTER_INFO_URL = 'https://weread.qq.com/web/book/chapterInfos';
const WEREAD_REVIEW_LIST_URL = 'https://weread.qq.com/web/review/list';
const WEREAD_READ_INFO_URL = 'https://weread.qq.com/web/book/getProgress';
const WEREAD_SHELF_SYNC_URL = 'https://weread.qq.com/web/shelf/sync';
const WEREAD_BEST_REVIEW_URL = 'https://weread.qq.com/web/review/list/best';

function getStandardHeaders(cookie: string) {
  return {
    Cookie: cookie,
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
    Connection: 'keep-alive',
    Accept: 'application/json, text/plain, */*',
    'Accept-Encoding': 'gzip, compress, deflate, br',
    'cache-control': 'no-cache',
  };
}

async function retry<T>(
  func: () => Promise<T>,
  maxAttempts = 3,
  waitMs = 5000
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await func();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      await new Promise(resolve =>
        setTimeout(resolve, waitMs + Math.floor(Math.random() * 3000))
      );
    }
  }
  throw new Error('所有重试都失败了');
}

@Provide()
export class WeReadService {
  // 获取书架（有笔记的书）
  async getBooks(cookie: string): Promise<WeReadBook[]> {
    return retry(async () => {
      const response = await axios.get(WEREAD_NOTEBOOKS_URL, {
        headers: getStandardHeaders(cookie),
        timeout: 30000,
        params: { _: Date.now() },
      });
      if (response.data.errcode !== undefined && response.data.errcode !== 0) {
        throw new Error(response.data.errmsg || 'API错误');
      }
      // console.log('获取的书籍列表', response.data.books);
      // 获取第一本详情
      // const firstBook = response.data.books[0];
      // const firstBookDetail = await this.getBookDetail(cookie, firstBook.bookId);
      // console.log('获取的第一本详情', firstBookDetail);
      // // 获取第一本笔记
      // const firstBookNotes = await this.getNotes(cookie, firstBook.bookId);
      // console.log('获取的第一本笔记', firstBookNotes);
      // // 获取第一本章节
      // const firstBookChapters = await this.getChapters(cookie, firstBook.bookId);
      // console.log('获取的第一本章节', firstBookChapters);
      // // 获取第一本评论
      // const firstBookReviews = await this.getReviews(cookie, firstBook.bookId);
      // console.log('获取的第一本评论', firstBookReviews);

      return response.data.books || [];
    });
  }

  // 获取书籍详情
  async getBookDetail(cookie: string, bookId: string): Promise<any> {
    return retry(async () => {
      const response = await axios.get(WEREAD_BOOK_INFO_URL, {
        headers: getStandardHeaders(cookie),
        timeout: 30000,
        params: { bookId, _: Date.now() },
      });
      if (response.data.errcode !== undefined && response.data.errcode !== 0) {
        return {}
      }
      return response.data;
    });
  }

  // 获取书籍笔记（划线）
  async getNotes(cookie: string, bookId?: string): Promise<WeReadNote[]> {
    if (!bookId) {
      // 获取所有书籍的笔记，限制最多5本
      const books = await this.getBooks(cookie);
      let allNotes: WeReadNote[] = [];
      // 限制最多获取前5本书的笔记
      const limitedBooks = books.slice(0, 10);
      for (const book of limitedBooks) {
        try {
          const notes = await this.getNotes(cookie, book.bookId);
          allNotes = allNotes.concat(notes);
        } catch (e) {
          // 忽略单本书失败
        }
      }
      return allNotes;
    }
    return retry(async () => {
      const notesRes = await axios.get(WEREAD_BOOKMARKLIST_URL, {
        headers: getStandardHeaders(cookie),
        timeout: 30000,
        params: { bookId, _: Date.now() },
      });
      const reviewsRes = await axios.get(WEREAD_REVIEW_LIST_URL, {
        headers: getStandardHeaders(cookie),
        timeout: 30000,
        params: {
          bookId,
          listType: 4,
          maxIdx: 0,
          count: 0,
          listMode: 2,
          syncKey: 0,
          _: Date.now(),
        },
      });
      console.log('获取的评论', bookId, reviewsRes.data);
      if (notesRes.data.errcode !== undefined && notesRes.data.errcode !== 0) {
        throw new Error(notesRes.data.errmsg || '获取笔记API错误');
      }
      if (
        reviewsRes.data.errcode !== undefined &&
        reviewsRes.data.errcode !== 0
      ) {
        throw new Error(reviewsRes.data.errmsg || '获取评论API错误');
      }
      // 处理reviewsRes数据，转换为与notesRes相同的格式
      const processedReviewsData = {
        updated:
          reviewsRes.data.reviews?.map((item: any) => {
            const review = item.review;
            return {
              bookmarkId: review.reviewId,
              reviewId: review.reviewId,
              chapterUid: review.chapterUid || 1000000, // 如果没有章节，使用特殊值
              chapterIdx: review.chapterIdx || 1000000,
              chapterTitle: review.chapterTitle || '点评',
              markText: review.content || review.abstract || '',
              content: review.content || review.abstract || '',
              type: 2, // 评论类型为笔记
              style: 0,
              colorStyle: 0,
              range: review.range || '',
              createTime: review.createTime,
              updateTime: review.createTime,
            };
          }) || [],
        chapters: [
          {
            chapterUid: 1000000,
            chapterIdx: 1000000,
            title: '点评',
            level: 1,
            updateTime: Date.now(),
          },
        ],
        book: reviewsRes.data.reviews?.[0]?.review?.book || {
          title: '未知书籍',
          author: '未知作者',
          cover: '',
        },
      };

      return [notesRes.data, processedReviewsData];
    });
  }

  // 获取章节信息
  async getChapters(cookie: string, bookId: string): Promise<WeReadChapter[]> {
    return retry(async () => {
      const response = await axios.post(
        WEREAD_CHAPTER_INFO_URL,
        { bookIds: [bookId] },
        {
          headers: {
            ...getStandardHeaders(cookie),
            'Content-Type': 'application/json;charset=UTF-8',
            Referer: `https://weread.qq.com/web/reader/${bookId}`,
          },
          timeout: 30000,
          params: { _: Date.now() },
        }
      );
      if (response.data.errcode !== undefined && response.data.errcode !== 0) {
        throw new Error(response.data.errmsg || 'API错误');
      }
      const data =
        response.data.data &&
        response.data.data[0] &&
        response.data.data[0].updated;
      if (!data) return [];
      // 添加点评章节
      data.push({
        chapterUid: 1000000,
        chapterIdx: 1000000,
        title: '点评',
        level: 1,
        updateTime: Date.now(),
      });
      return data;
    });
  }

  // 获取书籍评论
  async getReviews(cookie: string, bookId: string): Promise<any[]> {
    return retry(async () => {
      const response = await axios.get(WEREAD_REVIEW_LIST_URL, {
        headers: getStandardHeaders(cookie),
        timeout: 30000,
        params: {
          bookId,
          listType: 4,
          maxIdx: 0,
          count: 0,
          listMode: 2,
          syncKey: 0,
          _: Date.now(),
        },
      });
      if (response.data.errcode !== undefined && response.data.errcode !== 0) {
        throw new Error(response.data.errmsg || 'API错误');
      }
      let reviews = response.data.reviews || [];
      reviews = reviews.map((x: any) => x.review);
      reviews = reviews.map((x: any) => {
        if (x.type === 4) {
          return { chapterUid: 1000000, ...x };
        }
        return x;
      });
      return reviews;
    });
  }

  // 获取阅读进度
  async getReadInfo(cookie: string, bookId: string): Promise<any> {
    return retry(async () => {
      const response = await axios.get(WEREAD_READ_INFO_URL, {
        headers: getStandardHeaders(cookie),
        timeout: 30000,
        params: { bookId, _: Date.now() },
      });
      if (response.data.errcode !== undefined && response.data.errcode !== 0) {
        throw new Error(response.data.errmsg || 'API错误');
      }
      return response.data;
    });
  }

  // 获取书架全部书籍（含无笔记）
  async getEntireShelf(cookie: string): Promise<any[]> {
    return retry(async () => {
      const response = await axios.get(WEREAD_SHELF_SYNC_URL, {
        headers: getStandardHeaders(cookie),
        timeout: 30000,
        params: { _: Date.now() },
      });
      if (response.data.errcode !== undefined && response.data.errcode !== 0) {
        throw new Error(response.data.errmsg || 'API错误');
      }
      return response.data.books || [];
    });
  }

  // 获取热门书评
  async getBestReviews(
    cookie: string,
    bookId: string,
    count = 10,
    maxIdx = 0,
    synckey = 0
  ): Promise<any> {
    return retry(async () => {
      const response = await axios.get(WEREAD_BEST_REVIEW_URL, {
        headers: getStandardHeaders(cookie),
        timeout: 30000,
        params: {
          bookId,
          synckey,
          maxIdx,
          count,
          _: Date.now(),
        },
      });
      if (response.data.errcode !== undefined && response.data.errcode !== 0) {
        throw new Error(response.data.errmsg || 'API错误');
      }
      return response.data;
    });
  }

  // 获取阅读统计
  async getReadingStats(cookie: string): Promise<WeReadReadingStats> {
    // 这里网页版API没有专门的统计接口，只能通过书架数据统计
    const books = await this.getEntireShelf(cookie);
    // console.log('获取的阅读统计', books);
    const stats: WeReadReadingStats = {
      totalBooks: books.length,
      finishedBooks: books.filter((b: any) => b.isFinished).length,
      readingBooks: books.filter((b: any) => !b.isFinished).length,
      totalReadingTime: books.reduce(
        (sum: number, b: any) => sum + (b.readingTime || 0),
        0
      ),
      totalWords: books.reduce(
        (sum: number, b: any) => sum + (b.book?.wordCount || 0),
        0
      ),
      averageReadingTime:
        books.length > 0
          ? Math.round(
              books.reduce(
                (sum: number, b: any) => sum + (b.readingTime || 0),
                0
              ) / books.length
            )
          : 0,
      readingStreak: 0,
      lastReadingDate: '',
    };
    return stats;
  }

  async getRecentBooks(cookie: string, entireShelf: any[]): Promise<any[]> {
    const now = new Date();
    // 最近阅读（按 readUpdateTime/lastReadingTime 排序）并且只取近两个月数据
    const filteredBooks = entireShelf
      .filter((b: any) => {
        const lastRead = new Date(
          (b.readUpdateTime || b.lastReadingTime || 0) * 1000
        );
        if (!lastRead) return false;
        const diffTime = Math.abs(now.getTime() - lastRead.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30;
      })
      .sort(
        (a: any, b: any) =>
          (b.readUpdateTime || b.lastReadingTime || 0) -
          (a.readUpdateTime || a.lastReadingTime || 0)
      );

    // 使用 Promise.all 等待所有异步操作完成
    const recentBooks = await Promise.all(
      filteredBooks.map(async (b: any) => {
        try {
          // 通过bookId 获取进度
          const readInfo = await this.getReadInfo(cookie, b.bookId);
          return {
            id: b.bookId,
            title: b.title || b.book?.title || '',
            author: b.author || b.book?.author || '',
            cover: b.cover || b.book?.cover || '',
            progress: readInfo.book.progress || 0,
            lastRead: new Date(
              (b.readUpdateTime || b.lastReadingTime || 0) * 1000
            ).toISOString(),
            category:
              b.category || (b.categories && b.categories[0]?.title) || '',
          };
        } catch (error) {
          console.error(`获取书籍 ${b.bookId} 的阅读信息失败:`, error);
          // 返回基本信息，不包含进度
          return {
            id: b.bookId,
            title: b.title || b.book?.title || '',
            author: b.author || b.book?.author || '',
            cover: b.cover || b.book?.cover || '',
            progress: 0,
            lastRead: new Date(
              (b.readUpdateTime || b.lastReadingTime || 0) * 1000
            ).toISOString(),
            category:
              b.category || (b.categories && b.categories[0]?.title) || '',
          };
        }
      })
    );
    
    return recentBooks;
  }
}
