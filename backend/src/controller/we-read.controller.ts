import { Controller, Post, Body, Inject } from '@midwayjs/core';
import { WeReadService } from '../service/we-read.service';
import {
  WeReadBook,
  WeReadNote,
  WeReadChapter,
  WeReadReadingStats,
  ApiResponse,
} from '../types/we-read.types';

@Controller('/api/weRead')
export class WeReadController {
  @Inject()
  weReadService!: WeReadService;

  /**
   * 验证Cookie是否有效
   */
  private validateCookie(cookie: string): boolean {
    if (!cookie || !cookie.trim()) {
      console.log('❌ Cookie为空或空白');
      return false;
    }

    // 检查必要的cookie字段 - 只需要wr_vid和wr_skey
    const requiredFields = ['wr_vid', 'wr_skey'];
    const cookies: Record<string, string> = {};
    const pattern = /([^=]+)=([^;]+);?\s*/g;
    let match;

    while ((match = pattern.exec(cookie)) !== null) {
      const [, key, value] = match;
      cookies[key.trim()] = value.trim();
    }

    // console.log('🍪 解析到的Cookie字段:', Object.keys(cookies));
    // console.log(
    //   '🍪 必要字段检查:',
    //   requiredFields.map(field => ({
    //     field,
    //     exists: !!cookies[field],
    //     value: cookies[field] ? '***' : 'missing',
    //   }))
    // );

    const isValid = requiredFields.every(field => cookies[field]);
    // console.log('🍪 Cookie验证结果:', isValid);

    return isValid;
  }

  /**
   * 统一错误处理
   */
  private handleError(error: any): ApiResponse {
    const message = (error as Error).message;
    console.log('❌ 处理错误:', message);

    // 检查是否是Cookie过期错误
    if (
      message.includes('Cookie已过期') ||
      message.includes('登录超时') ||
      (message.includes('errcode') &&
        (message.includes('-2012') || message.includes('-2010')))
    ) {
      return {
        success: false,
        message: '微信读书Cookie已过期，请重新设置Cookie',
        code: 'COOKIE_EXPIRED',
      };
    }

    return {
      success: false,
      message: message || '请求失败',
      code: 'API_ERROR',
    };
  }

  /**
   * 获取用户数据（综合统计信息）
   */
  @Post('/userData')
  async getUserData(@Body() body: { cookie: string }): Promise<ApiResponse> {
    console.log('getUserData参数', body);
    try {
      if (!this.validateCookie(body.cookie)) {
        return {
          success: false,
          message: 'Cookie格式无效，请检查Cookie设置',
          code: 'INVALID_COOKIE',
        };
      }

      // 获取基础数据
      const [stats, entireShelf] = await Promise.all([
        this.weReadService.getReadingStats(body.cookie), // 统计
        this.weReadService.getEntireShelf(body.cookie), // 全部书
      ]);

      // console.log('获取的基础数据', {
      //   books,
      //   notes,
      //   stats,
      //   entireShelf,
      // });

      // 统计分类数据
      const categoryMap = new Map();
      entireShelf.forEach((b: any) => {
        let cat =
          b.category || (b.categories && b.categories[0]?.title) || '未分类';
        if (Array.isArray(cat)) cat = cat[0] || '未分类';
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
      });
      const categoryData = Array.from(categoryMap.entries()).map(
        ([name, value]) => ({ name, value })
      );

      const recentBooks = await this.weReadService.getRecentBooks(
        body.cookie,
        entireShelf
      );

      const userData = {
        stats,
        entireShelf,
        totalReadingTime: stats.totalReadingTime,
        totalBooks: stats.totalBooks,
        categoryData,
        recentBooks,
      };

      return {
        success: true,
        data: userData,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 获取书架（有笔记的书）
   */
  @Post('/books')
  async getBooks(
    @Body() body: { cookie: string }
  ): Promise<ApiResponse<WeReadBook[]>> {
    try {
      if (!this.validateCookie(body.cookie)) {
        return {
          success: false,
          message: 'Cookie格式无效，请检查Cookie设置',
          code: 'INVALID_COOKIE',
        };
      }

      const books = await this.weReadService.getBooks(body.cookie);
      return {
        success: true,
        data: books,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 获取全部书架
   */
  @Post('/entireShelf')
  async getEntireShelf(
    @Body() body: { cookie: string }
  ): Promise<ApiResponse<any[]>> {
    try {
      if (!this.validateCookie(body.cookie)) {
        return {
          success: false,
          message: 'Cookie格式无效，请检查Cookie设置',
          code: 'INVALID_COOKIE',
        };
      }

      const books = await this.weReadService.getEntireShelf(body.cookie);
      return {
        success: true,
        data: books,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 获取书籍详情
   */
  @Post('/bookDetail')
  async getBookDetail(
    @Body() body: { cookie: string; bookId: string }
  ): Promise<ApiResponse> {
    try {
      if (!this.validateCookie(body.cookie)) {
        return {
          success: false,
          message: 'Cookie格式无效，请检查Cookie设置',
          code: 'INVALID_COOKIE',
        };
      }

      const bookDetail = await this.weReadService.getBookDetail(
        body.cookie,
        body.bookId
      );
      return {
        success: true,
        data: bookDetail,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 获取书籍笔记
   */
  @Post('/notes')
  async getNotes(
    @Body() body: { cookie: string; bookId?: string }
  ): Promise<ApiResponse<WeReadNote[]>> {
    try {
      if (!this.validateCookie(body.cookie)) {
        return {
          success: false,
          message: 'Cookie格式无效，请检查Cookie设置',
          code: 'INVALID_COOKIE',
        };
      }
      const notes = await this.weReadService.getNotes(body.cookie, body.bookId);
      return {
        success: true,
        data: notes,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 获取章节信息
   */
  @Post('/chapters')
  async getChapters(
    @Body() body: { cookie: string; bookId: string }
  ): Promise<ApiResponse<WeReadChapter[]>> {
    try {
      if (!this.validateCookie(body.cookie)) {
        return {
          success: false,
          message: 'Cookie格式无效，请检查Cookie设置',
          code: 'INVALID_COOKIE',
        };
      }

      const chapters = await this.weReadService.getChapters(
        body.cookie,
        body.bookId
      );
      return {
        success: true,
        data: chapters,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 获取书籍评论
   */
  @Post('/reviews')
  async getReviews(
    @Body() body: { cookie: string; bookId: string }
  ): Promise<ApiResponse<any[]>> {
    try {
      if (!this.validateCookie(body.cookie)) {
        return {
          success: false,
          message: 'Cookie格式无效，请检查Cookie设置',
          code: 'INVALID_COOKIE',
        };
      }

      const reviews = await this.weReadService.getReviews(
        body.cookie,
        body.bookId
      );
      return {
        success: true,
        data: reviews,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 获取阅读进度
   */
  @Post('/readInfo')
  async getReadInfo(
    @Body() body: { cookie: string; bookId: string }
  ): Promise<ApiResponse> {
    try {
      if (!this.validateCookie(body.cookie)) {
        return {
          success: false,
          message: 'Cookie格式无效，请检查Cookie设置',
          code: 'INVALID_COOKIE',
        };
      }

      const readInfo = await this.weReadService.getReadInfo(
        body.cookie,
        body.bookId
      );
      return {
        success: true,
        data: readInfo,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 获取热门书评
   */
  @Post('/bestReviews')
  async getBestReviews(
    @Body()
    body: {
      cookie: string;
      bookId: string;
      count?: number;
      maxIdx?: number;
      synckey?: number;
    }
  ): Promise<ApiResponse> {
    try {
      if (!this.validateCookie(body.cookie)) {
        return {
          success: false,
          message: 'Cookie格式无效，请检查Cookie设置',
          code: 'INVALID_COOKIE',
        };
      }

      const bestReviews = await this.weReadService.getBestReviews(
        body.cookie,
        body.bookId,
        body.count || 10,
        body.maxIdx || 0,
        body.synckey || 0
      );
      return {
        success: true,
        data: bestReviews,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 获取阅读统计
   */
  @Post('/readingStats')
  async getReadingStats(
    @Body() body: { cookie: string }
  ): Promise<ApiResponse<WeReadReadingStats>> {
    try {
      if (!this.validateCookie(body.cookie)) {
        return {
          success: false,
          message: 'Cookie格式无效，请检查Cookie设置',
          code: 'INVALID_COOKIE',
        };
      }

      const stats = await this.weReadService.getReadingStats(body.cookie);
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
}
