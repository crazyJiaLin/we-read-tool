import { Provide, Config, Inject } from '@midwayjs/core';
import axios from 'axios';
import { WeReadService } from './we-read.service';

@Provide()
export class AIService {
  @Config('moonshot')
  moonshotConfig: any;

  @Inject()
  weReadService!: WeReadService;

  // 私有变量存储配置
  private config: any = null;

  private async callMoonshotAPI(prompt: string, systemPrompt?: string) {
    try {
      // 检查配置是否存在
      if (!this.config) {
        if (this.moonshotConfig) {
          this.config = this.moonshotConfig;
        } else {
          console.error('Moonshot配置未找到，使用默认配置');
          this.config = {
            apiKey: 'sk-yVK2YRXuvPoeGqpBl1P2tBKXS14mhY7V9qX4R8TsJTDmvNq9',
            apiEndpoint: 'https://api.moonshot.cn/v1/chat/completions',
            model: 'moonshot-v1-8k',
          };
        }
      }

      const messages = [];
      
      if (systemPrompt) {
        messages.push({
          role: 'system',
          content: systemPrompt,
        });
      }
      
      messages.push({
        role: 'user',
        content: prompt,
      });

      console.log('调用Moonshot API:', {
        endpoint: this.config.apiEndpoint,
        model: this.config.model,
        messagesCount: JSON.stringify(messages),
      });

      const response = await axios.post(
        this.config.apiEndpoint,
        {
          model: this.config.model,
          messages,
          temperature: 0.7,
          max_tokens: 2000,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.config.apiKey}`,
          },
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Moonshot API调用失败:', error);
      throw error;
    }
  }

  async askQuestion(question: string, context?: string) {
    try {
      let prompt = question;

      if (context) {
        prompt = `基于以下上下文回答问题：\n\n上下文：${context}\n\n问题：${question}`;
      }

      const systemPrompt = '你是一个专业的读书助手，可以帮助用户分析阅读数据、总结笔记、推荐书籍等。请用中文回答用户的问题。';
      
      const answer = await this.callMoonshotAPI(prompt, systemPrompt);
      return answer;
    } catch (error) {
      // 如果Moonshot API不可用，返回模拟回答
      return this.getMockAnswer(question);
    }
  }

  // 新增：流式问答方法
  async askQuestionStream(question: string, context?: string) {
    try {
      let prompt = question;

      if (context) {
        prompt = `基于以下上下文回答问题：\n\n上下文：${context}\n\n问题：${question}`;
      }

      const systemPrompt = '你是一个专业的读书助手，可以帮助用户分析阅读数据、总结笔记、推荐书籍等。请用中文回答用户的问题。重要：在总结笔记时，请根据上下文内容输出笔记原文。';
      console.log('prompt', prompt);
      const stream = await this.callMoonshotAPIStream(prompt, systemPrompt);
      return stream;
    } catch (error) {
      // 如果流式API不可用，返回模拟回答
      return this.getMockAnswerStream(question);
    }
  }

  async organizeNotes(notes: any[], cookie: string) {
    try {
      // 获取书籍信息以丰富上下文
      const books = await this.weReadService.getBooks(cookie);
      const bookMap = new Map();
      books.forEach(book => {
        bookMap.set(book.bookId, book);
      });

      // 整理笔记数据
      const organizedNotes = notes.map(note => {
        const book = bookMap.get(note.bookId);
        return {
          bookTitle: book?.title || note.bookTitle || '未知书籍',
          bookAuthor: book?.author || note.bookAuthor || '未知作者',
          chapterTitle: note.chapterTitle || '未知章节',
          content: note.markText || note.content || '',
          type: note.type === 1 ? '划线' : '笔记',
          createTime: note.createTime,
          range: note.range || '',
        };
      });

      // 限制笔记数量，避免token过长
      const maxNotes = 20; // 最多处理20条笔记
      const limitedNotes = organizedNotes.slice(0, maxNotes);
      
      if (organizedNotes.length > maxNotes) {
        console.log(`笔记数量过多(${organizedNotes.length}条)，只处理前${maxNotes}条`);
      }

      // 构建AI提示词，限制每条笔记的内容长度
      const notesText = limitedNotes
        .map(note => {
          // 限制每条笔记内容长度
          const maxContentLength = 200;
          const truncatedContent = note.content.length > maxContentLength 
            ? note.content.substring(0, maxContentLength) + '...'
            : note.content;
          
          return `《${note.bookTitle}》- ${note.bookAuthor}\n章节：${note.chapterTitle}\n类型：${note.type}\n内容：${truncatedContent}\n位置：${note.range}\n`;
        })
        .join('\n---\n');

      const prompt = `请帮我整理和分析以下读书笔记，要求：

1. 按主题分类整理笔记
2. 总结每个主题的核心观点
3. 找出笔记之间的联系和关联
4. 提供知识体系建议
5. 给出复习和应用建议

笔记内容：
${notesText}

请用结构化的方式输出，包括：
- 主题分类
- 核心观点总结
- 知识关联分析
- 学习建议`;

      const systemPrompt = '你是一个专业的读书笔记整理专家，擅长将零散的读书笔记整理成系统化的知识体系。请用中文回答，注重逻辑性和实用性。';
      
      const organizedContent = await this.callMoonshotAPI(prompt, systemPrompt);

      const res = {
        originalNotes: organizedNotes,
        organizedContent,
        summary: {
          totalNotes: organizedNotes.length,
          processedNotes: limitedNotes.length,
          booksCount: new Set(organizedNotes.map(n => n.bookTitle)).size,
          types: {
            highlights: organizedNotes.filter(n => n.type === '划线').length,
            notes: organizedNotes.filter(n => n.type === '笔记').length,
          },
        },
      };

      // console.log('AI回答', res);

      return res;
    } catch (error) {
      console.log('AI整理笔记错误', error);
      // 如果AI API不可用，返回模拟整理结果
      return this.getMockOrganizedNotes(notes);
    }
  }

  private getMockAnswer(question: string): string {
    const mockAnswers = {
      推荐一些适合我的书籍:
        '根据您的阅读历史，我推荐以下书籍：\n1. 《深入理解计算机系统》- 技术类经典\n2. 《百年孤独》- 文学名著\n3. 《人类简史》- 历史科普\n4. 《思考，快与慢》- 心理学\n5. 《原则》- 个人成长',
      分析我的阅读习惯:
        '根据您的阅读数据，我发现：\n• 您偏好技术类书籍，占总阅读量的35%\n• 平均每月阅读3本书\n• 阅读时间主要集中在晚上\n• 喜欢做笔记，平均每本书有4条笔记\n• 建议：可以尝试更多文学类书籍来平衡阅读',
      总结我的读书笔记:
        '您的读书笔记主要涵盖以下主题：\n• 技术原理和系统设计\n• 人生哲理和思考\n• 历史事件和人物\n• 文学创作技巧\n\n建议：可以将相关主题的笔记整理成知识体系，便于复习和应用。',
      制定读书计划:
        '为您制定一个为期3个月的读书计划：\n\n第1个月：\n• 《深入理解计算机系统》- 继续阅读剩余部分\n• 《百年孤独》- 完成阅读\n\n第2个月：\n• 《人类简史》- 完成阅读\n• 选择1本新的技术书籍\n\n第3个月：\n• 选择1本文学类书籍\n• 选择1本个人成长类书籍\n\n建议每天阅读30-60分钟，周末可以适当增加时间。',
    };

    for (const [key, value] of Object.entries(mockAnswers)) {
      if (question.includes(key) || key.includes(question)) {
        return value;
      }
    }

    return '这是一个很好的问题！作为您的AI读书助手，我可以帮助您分析阅读数据、总结笔记、推荐书籍等。请告诉我您具体想了解什么，我会尽力为您提供帮助。';
  }

  private getMockOrganizedNotes(notes: any[]) {
    const organizedNotes = notes.map(note => ({
      bookTitle: note.bookTitle || '未知书籍',
      bookAuthor: note.bookAuthor || '未知作者',
      chapterTitle: note.chapterTitle || '未知章节',
      content: note.markText || note.content || '',
      type: note.type === 1 ? '划线' : '笔记',
      createTime: note.createTime,
      range: note.range || '',
    }));

    return {
      originalNotes: organizedNotes,
      organizedContent: `# 读书笔记整理报告

## 📚 笔记概览
- 总笔记数：${organizedNotes.length} 条
- 涉及书籍：${new Set(organizedNotes.map(n => n.bookTitle)).size} 本
- 划线笔记：${organizedNotes.filter(n => n.type === '划线').length} 条
- 个人笔记：${organizedNotes.filter(n => n.type === '笔记').length} 条

## 🎯 主题分类

### 1. 技术原理类
- 涉及书籍：《深入理解计算机系统》、《算法导论》等
- 核心观点：系统设计、算法优化、性能调优
- 关联分析：这些笔记体现了对技术深度的追求

### 2. 人生哲理类
- 涉及书籍：《原则》、《思考，快与慢》等
- 核心观点：决策方法、思维方式、个人成长
- 关联分析：关注个人发展和思维提升

### 3. 文学艺术类
- 涉及书籍：《百年孤独》、《红楼梦》等
- 核心观点：文学创作、人物塑造、情节设计
- 关联分析：对文学艺术的欣赏和理解

## 🔗 知识关联分析
1. 技术类笔记与思维类笔记可以结合，形成系统化思考
2. 文学类笔记可以丰富技术写作的表达能力
3. 各类笔记相互补充，形成完整的知识体系

## 💡 学习建议
1. **定期复习**：建议每周回顾一次相关主题的笔记
2. **知识整合**：将不同书籍的相似观点进行对比和整合
3. **实践应用**：将技术原理应用到实际项目中
4. **思维训练**：通过文学阅读提升表达和思考能力

## 📝 下一步行动
1. 建立个人知识库，按主题分类存储
2. 制定复习计划，定期回顾重要笔记
3. 尝试写作，将笔记内容转化为自己的理解
4. 与他人分享，通过讨论加深理解`,
      summary: {
        totalNotes: organizedNotes.length,
        booksCount: new Set(organizedNotes.map(n => n.bookTitle)).size,
        types: {
          highlights: organizedNotes.filter(n => n.type === '划线').length,
          notes: organizedNotes.filter(n => n.type === '笔记').length,
        },
      },
    };
  }

  // 新增：流式调用Moonshot API
  private async callMoonshotAPIStream(prompt: string, systemPrompt?: string) {
    try {
      // 检查配置是否存在
      if (!this.config) {
        if (this.moonshotConfig) {
          this.config = this.moonshotConfig;
        } else {
          console.error('Moonshot配置未找到，使用默认配置');
          this.config = {
            apiKey: 'sk-yVK2YRXuvPoeGqpBl1P2tBKXS14mhY7V9qX4R8TsJTDmvNq9',
            apiEndpoint: 'https://api.moonshot.cn/v1/chat/completions',
            model: 'moonshot-v1-8k',
          };
        }
      }

      const messages = [];
      
      if (systemPrompt) {
        messages.push({
          role: 'system',
          content: systemPrompt,
        });
      }
      
      messages.push({
        role: 'user',
        content: prompt,
      });

      console.log('调用Moonshot API (流式):', {
        endpoint: this.config.apiEndpoint,
        model: this.config.model,
        messagesCount: messages.length,
      });

      const response = await axios.post(
        this.config.apiEndpoint,
        {
          model: this.config.model,
          messages,
          temperature: 0.7,
          max_tokens: 1500,
          stream: true, // 启用流式输出
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.config.apiKey}`,
          },
          responseType: 'stream',
        }
      );

      return response.data;
    } catch (error) {
      console.error('Moonshot API流式调用失败:', error);
      throw error;
    }
  }

  // 新增：模拟流式回答
  private getMockAnswerStream(question: string) {
    const mockAnswers = {
      推荐一些适合我的书籍: '根据您的阅读历史，我推荐以下书籍：\n1. 《深入理解计算机系统》- 技术类经典\n2. 《百年孤独》- 文学名著\n3. 《人类简史》- 历史科普\n4. 《思考，快与慢》- 心理学\n5. 《原则》- 个人成长',
      分析我的阅读习惯: '根据您的阅读数据，我发现：\n• 您偏好技术类书籍，占总阅读量的35%\n• 平均每月阅读3本书\n• 阅读时间主要集中在晚上\n• 喜欢做笔记，平均每本书有4条笔记\n• 建议：可以尝试更多文学类书籍来平衡阅读',
      总结我的读书笔记: '您的读书笔记主要涵盖以下主题：\n• 技术原理和系统设计\n• 人生哲理和思考\n• 历史事件和人物\n• 文学创作技巧\n\n建议：可以将相关主题的笔记整理成知识体系，便于复习和应用。',
      制定读书计划: '为您制定一个为期3个月的读书计划：\n\n第1个月：\n• 《深入理解计算机系统》- 继续阅读剩余部分\n• 《百年孤独》- 完成阅读\n\n第2个月：\n• 《人类简史》- 完成阅读\n• 选择1本新的技术书籍\n\n第3个月：\n• 选择1本文学类书籍\n• 选择1本个人成长类书籍\n\n建议每天阅读30-60分钟，周末可以适当增加时间。',
    };

    for (const [key, value] of Object.entries(mockAnswers)) {
      if (question.includes(key) || key.includes(question)) {
        return this.createMockStream(value);
      }
    }

    return this.createMockStream('这是一个很好的问题！作为您的AI读书助手，我可以帮助您分析阅读数据、总结笔记、推荐书籍等。请告诉我您具体想了解什么，我会尽力为您提供帮助。');
  }

  // 新增：创建模拟流式数据
  private createMockStream(content: string) {
    const { Readable } = require('stream');
    
    const chunks = content.split('');
    let index = 0;
    
    return new Readable({
      read() {
        if (index < chunks.length) {
          const chunk = chunks[index];
          this.push(`data: ${JSON.stringify({ choices: [{ delta: { content: chunk } }] })}\n\n`);
          index++;
        } else {
          this.push('data: [DONE]\n\n');
          this.push(null); // 结束流
        }
      }
    });
  }
}
