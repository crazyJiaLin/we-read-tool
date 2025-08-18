# 微信读书API使用说明

本项目使用前端Cookie管理方式，用户在前端输入Cookie后存储到localStorage中，后端API接收Cookie参数进行微信读书数据获取。

## Cookie管理方式

### 前端Cookie管理
1. **用户输入Cookie**：用户在前端输入框中输入微信读书Cookie
2. **存储到localStorage**：前端将Cookie存储到浏览器的localStorage中
3. **API调用时传递**：每次调用微信读书API时，从localStorage获取Cookie并传递给后端
4. **Cookie失效处理**：当Cookie失效时，前端清除localStorage并提示用户重新输入

### 获取微信读书Cookie

#### 方法1：手动获取
1. 打开微信读书网页版：https://weread.qq.com/
2. 登录你的微信读书账号
3. 打开浏览器开发者工具（F12）
4. 在Network标签页中找到任意请求
5. 复制请求头中的Cookie字段

#### 方法2：使用CookieCloud（可选）
1. 安装CookieCloud浏览器插件
2. 配置CookieCloud服务器
3. 从CookieCloud获取微信读书Cookie

## API接口

### 1. 获取用户数据
```http
POST /api/weRead/userData
Content-Type: application/json

{
  "cookie": "your_weread_cookie"
}
```

### 2. 获取书籍列表
```http
POST /api/weRead/books
Content-Type: application/json

{
  "cookie": "your_weread_cookie"
}
```

### 3. 获取笔记
```http
POST /api/weRead/notes
Content-Type: application/json

{
  "cookie": "your_weread_cookie",
  "bookId": "optional_book_id"
}
```

### 4. 获取阅读统计
```http
POST /api/weRead/readingStats
Content-Type: application/json

{
  "cookie": "your_weread_cookie"
}
```

### 5. 获取书籍详情
```http
POST /api/weRead/bookDetail
Content-Type: application/json

{
  "cookie": "your_weread_cookie",
  "bookId": "book_id"
}
```

### 6. 搜索书籍
```http
POST /api/weRead/searchBooks
Content-Type: application/json

{
  "cookie": "your_weread_cookie",
  "keyword": "搜索关键词"
}
```

### 7. 获取章节信息
```http
POST /api/weRead/chapters
Content-Type: application/json

{
  "cookie": "your_weread_cookie",
  "bookId": "book_id"
}
```

## 响应格式

### 成功响应
```typescript
{
  success: true,
  data: any
}
```

### 错误响应
```typescript
{
  success: false,
  message: string,
  code: string
}
```

### 错误代码说明
- `INVALID_COOKIE`: Cookie格式无效
- `COOKIE_EXPIRED`: Cookie已过期
- `API_ERROR`: API调用失败

## 数据格式

### 书籍信息 (WeReadBook)
```typescript
{
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
```

### 笔记信息 (WeReadNote)
```typescript
{
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
}
```

### 阅读统计 (WeReadReadingStats)
```typescript
{
  totalBooks: number;
  finishedBooks: number;
  readingBooks: number;
  totalReadingTime: number;
  totalWords: number;
  averageReadingTime: number;
  readingStreak: number;
  lastReadingDate: string;
}
```

## 前端集成示例

### JavaScript/TypeScript
```javascript
// Cookie管理
class CookieManager {
  static COOKIE_KEY = 'weread_cookie';
  
  // 保存Cookie
  static saveCookie(cookie) {
    localStorage.setItem(this.COOKIE_KEY, cookie);
  }
  
  // 获取Cookie
  static getCookie() {
    return localStorage.getItem(this.COOKIE_KEY);
  }
  
  // 清除Cookie
  static clearCookie() {
    localStorage.removeItem(this.COOKIE_KEY);
  }
  
  // 检查Cookie是否存在
  static hasCookie() {
    return !!this.getCookie();
  }
}

// API调用
class WeReadAPI {
  static async callAPI(endpoint, data = {}) {
    const cookie = CookieManager.getCookie();
    if (!cookie) {
      throw new Error('Cookie未设置，请先输入微信读书Cookie');
    }
    
    try {
      const response = await fetch(`/api/weRead/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          cookie,
        }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        // 处理Cookie过期
        if (result.code === 'COOKIE_EXPIRED') {
          CookieManager.clearCookie();
          throw new Error('Cookie已过期，请重新设置');
        }
        throw new Error(result.message);
      }
      
      return result.data;
    } catch (error) {
      console.error('API调用失败:', error);
      throw error;
    }
  }
  
  // 获取用户数据
  static async getUserData() {
    return this.callAPI('userData');
  }
  
  // 获取书籍列表
  static async getBooks() {
    return this.callAPI('books');
  }
  
  // 获取笔记
  static async getNotes(bookId) {
    return this.callAPI('notes', { bookId });
  }
  
  // 获取阅读统计
  static async getReadingStats() {
    return this.callAPI('readingStats');
  }
  
  // 搜索书籍
  static async searchBooks(keyword) {
    return this.callAPI('searchBooks', { keyword });
  }
}

// 使用示例
async function initApp() {
  // 检查Cookie
  if (!CookieManager.hasCookie()) {
    // 显示Cookie输入界面
    showCookieInput();
    return;
  }
  
  try {
    // 获取用户数据
    const userData = await WeReadAPI.getUserData();
    console.log('用户数据:', userData);
    
    // 获取书籍列表
    const books = await WeReadAPI.getBooks();
    console.log('书籍列表:', books);
  } catch (error) {
    if (error.message.includes('Cookie已过期')) {
      // 清除Cookie并提示用户重新输入
      CookieManager.clearCookie();
      showCookieInput();
    } else {
      console.error('获取数据失败:', error);
    }
  }
}
```

### Vue.js 示例
```vue
<template>
  <div>
    <!-- Cookie输入界面 -->
    <div v-if="!hasCookie" class="cookie-input">
      <h3>请输入微信读书Cookie</h3>
      <textarea 
        v-model="cookieInput" 
        placeholder="请输入微信读书Cookie..."
        rows="5"
      ></textarea>
      <button @click="saveCookie">保存Cookie</button>
    </div>
    
    <!-- 主要内容 -->
    <div v-else>
      <button @click="clearCookie">清除Cookie</button>
      <div v-if="loading">加载中...</div>
      <div v-else>
        <h2>我的读书统计</h2>
        <div v-if="userData">
          <p>总书籍数: {{ userData.totalBooks }}</p>
          <p>已完成: {{ userData.finishedBooks }}</p>
          <p>总阅读时间: {{ userData.totalReadingTime }}分钟</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';

export default {
  setup() {
    const cookieInput = ref('');
    const hasCookie = ref(false);
    const loading = ref(false);
    const userData = ref(null);
    
    const COOKIE_KEY = 'weread_cookie';
    
    // 检查Cookie
    const checkCookie = () => {
      hasCookie.value = !!localStorage.getItem(COOKIE_KEY);
    };
    
    // 保存Cookie
    const saveCookie = () => {
      if (cookieInput.value.trim()) {
        localStorage.setItem(COOKIE_KEY, cookieInput.value.trim());
        checkCookie();
        cookieInput.value = '';
        loadUserData();
      }
    };
    
    // 清除Cookie
    const clearCookie = () => {
      localStorage.removeItem(COOKIE_KEY);
      checkCookie();
      userData.value = null;
    };
    
    // 加载用户数据
    const loadUserData = async () => {
      const cookie = localStorage.getItem(COOKIE_KEY);
      if (!cookie) return;
      
      loading.value = true;
      try {
        const response = await fetch('/api/weRead/userData', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cookie }),
        });
        
        const result = await response.json();
        
        if (!result.success) {
          if (result.code === 'COOKIE_EXPIRED') {
            clearCookie();
            alert('Cookie已过期，请重新设置');
          } else {
            alert(result.message);
          }
          return;
        }
        
        userData.value = result.data;
      } catch (error) {
        console.error('获取数据失败:', error);
        alert('获取数据失败');
      } finally {
        loading.value = false;
      }
    };
    
    onMounted(() => {
      checkCookie();
      if (hasCookie.value) {
        loadUserData();
      }
    });
    
    return {
      cookieInput,
      hasCookie,
      loading,
      userData,
      saveCookie,
      clearCookie,
    };
  },
};
</script>
```

## 注意事项

1. **Cookie安全性**：Cookie包含敏感信息，建议在HTTPS环境下使用
2. **Cookie有效期**：微信读书Cookie通常有有效期限制，过期后需要重新获取
3. **请求频率**：避免过于频繁的请求，建议添加适当的延迟
4. **错误处理**：前端需要正确处理Cookie过期等错误情况
5. **用户体验**：在Cookie失效时，及时清除本地存储并提示用户重新输入

## 优势

1. **用户友好**：用户只需输入一次Cookie，后续自动使用
2. **安全性**：Cookie存储在用户本地，不经过服务器存储
3. **灵活性**：用户可以随时更换Cookie，无需重启服务
4. **实时性**：直接调用微信读书API，获取最新数据 