const axios = require('axios');

// 模拟笔记数据
const mockNotes = [
  {
    bookmarkId: '1',
    bookId: '123',
    bookTitle: '深入理解计算机系统',
    bookAuthor: 'Randal E. Bryant',
    chapterTitle: '第一章 计算机系统漫游',
    markText: '计算机系统是由硬件和系统软件组成的，它们共同工作来运行应用程序。',
    type: 1,
    createTime: 1640995200,
    range: '1-10'
  },
  {
    bookmarkId: '2',
    bookId: '123',
    bookTitle: '深入理解计算机系统',
    bookAuthor: 'Randal E. Bryant',
    chapterTitle: '第二章 信息的表示和处理',
    markText: '计算机使用二进制表示所有信息，包括整数、浮点数和字符。',
    type: 2,
    createTime: 1640995200,
    range: '15-20'
  },
  {
    bookmarkId: '3',
    bookId: '456',
    bookTitle: '原则',
    bookAuthor: 'Ray Dalio',
    chapterTitle: '生活原则',
    markText: '拥抱现实，处理现实。痛苦+反思=进步。',
    type: 1,
    createTime: 1640995200,
    range: '5-8'
  }
];

async function testAIOrganize() {
  try {
    console.log('🧪 测试AI整理笔记功能...');
    
    const response = await axios.post('http://localhost:7001/api/ai/organizeNotes', {
      notes: mockNotes,
      cookie: 'test_cookie'
    });

    if (response.data.success) {
      console.log('✅ AI整理成功！');
      console.log('📊 统计信息:', response.data.data.summary);
      console.log('📝 整理结果:');
      console.log(response.data.data.organizedContent);
    } else {
      console.log('❌ AI整理失败:', response.data.message);
    }
  } catch (error) {
    console.log('❌ 请求失败:', error.message);
    if (error.response) {
      console.log('错误详情:', error.response.data);
    }
  }
}

// 运行测试
testAIOrganize(); 