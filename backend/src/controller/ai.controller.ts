import { Controller, Post, Body, Inject } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { AIService } from '../service/ai.service';
import { WeReadService } from '../service/we-read.service';

@Controller('/api/ai')
export class AIController {
  @Inject()
  aiService!: AIService;

  @Inject()
  weReadService!: WeReadService;

  @Inject()
  ctx!: Context;

  @Post('/ask')
  async askQuestion(@Body() body: { question: string }) {
    try {
      const answer = await this.aiService.askQuestion(body.question);
      return {
        success: true,
        data: answer,
      };
    } catch (error) {
      return {
        success: false,
        message: (error as Error).message,
      };
    }
  }

  @Post('/askStream')
  async askQuestionStream(
    @Body() body: { question: string; cookie?: string; books?: any[] }
  ) {
    try {
      let context = '';

      if (body.cookie && body.books && body.books.length > 0) {
        const booksInfo = [];
        for (const bookItem of body.books.slice(0, 10)) {
          const book = await this.weReadService.getBookDetail(
            body.cookie,
            bookItem.bookId
          );
          booksInfo.push(book);
          if (body.books.length === 1) {
            const notes = await this.weReadService.getNotes(
              body.cookie,
              bookItem.bookId
            );
            booksInfo.push({
              ...book,
              notes,
            });
          }
        }

        // 构建书籍上下文信息，包含笔记
        const booksContext = booksInfo
          .map(book => {
            let bookContext = `《${book.title}》- ${book.author}
简介：${book.intro || '暂无简介'}
分类：${book.category || '未分类'}
评分：${book.newRating || 0}/100
字数：${book.totalWords || 0}字
出版社：${book.publisher || '未知'}
ISBN：${book.isbn || '未知'}
AI摘要：${book.AISummary || '暂无AI摘要'}`;

            // 添加笔记信息
            if (book.notes && book.notes.length > 0) {
              bookContext += `\n\n笔记内容：`;
              let noteIndex = 1;

              book.notes.forEach((noteGroup: any) => {
                if (noteGroup.updated && noteGroup.updated.length > 0) {
                  noteGroup.updated.forEach((note: any) => {
                    const noteType = note.type === 1 ? '划线' : '笔记';
                    const noteContent = note.markText || note.content || '';
                    const chapterTitle = note.chapterTitle || '未知章节';
                    const range = note.range || '';

                    bookContext += `\n${noteIndex}. [${noteType}] ${chapterTitle} (${range})
内容：${noteContent}`;
                    noteIndex++;
                  });
                }
              });

              if (noteIndex === 1) {
                bookContext += `\n暂无笔记`;
              }
            } else {
              bookContext += `\n\n笔记：暂无笔记`;
            }

            return bookContext;
          })
          .join('\n\n---\n\n');

        context = `用户当前关注的书籍信息：\n\n${booksContext}`;
      }

      const stream = await this.aiService.askQuestionStream(
        body.question,
        context
      );

      // 直接返回流对象，让Midway处理
      return stream;
    } catch (error) {
      return {
        success: false,
        message: (error as Error).message,
      };
    }
  }

  @Post('/organizeNotes')
  async organizeNotes(@Body() body: { notes: any[]; cookie: string }) {
    try {
      const result = await this.aiService.organizeNotes(
        body.notes,
        body.cookie
      );
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: (error as Error).message,
      };
    }
  }
}
