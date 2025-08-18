# 🚀 微信读书工具 - 后端服务

基于 Midway.js 框架构建的微信读书数据管理后端服务，提供阅读统计、笔记管理和AI分析等核心功能。

## ✨ 功能特性

- 🔐 **Cookie管理**: 安全的微信读书Cookie验证和管理
- 📊 **数据获取**: 从微信读书API获取用户数据、书籍、笔记等
- 🤖 **AI集成**: 集成OpenAI API，提供智能笔记整理和分析
- 📈 **统计分析**: 阅读时长、书籍数量、笔记统计等数据分析
- 🔍 **搜索功能**: 支持书籍和笔记的搜索过滤
- 🚀 **高性能**: 基于Midway.js框架，支持高并发请求

## 🛠️ 技术栈

- **框架**: Midway.js 3.x
- **语言**: TypeScript
- **运行时**: Node.js >= 16.0.0
- **AI服务**: OpenAI API
- **HTTP客户端**: Axios
- **测试**: Jest
- **构建**: mwtsc

## 📦 安装与配置

### 环境要求

- Node.js >= 16.0.0
- npm 或 yarn

### 安装依赖

```bash
cd backend
npm install
```

### 环境变量配置

创建 `.env` 文件并配置以下变量：

```bash
# OpenAI配置
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo

# 服务配置
NODE_ENV=development
PORT=7001
```

详细配置说明请参考 [环境配置文档](./README_ENV.md)

## 🚀 启动服务

### 开发模式

```bash
npm run dev
```

服务将在 http://localhost:7001 启动

### 生产模式

```bash
npm start
```

### PM2部署

```bash
npm run pm2
```

## 📚 API接口

### 微信读书数据接口

#### 1. 获取用户数据
```http
POST /api/weRead/userData
Content-Type: application/json

{
  "cookie": "your_weread_cookie"
}
```

#### 2. 获取书籍列表
```http
POST /api/weRead/books
Content-Type: application/json

{
  "cookie": "your_weread_cookie"
}
```

#### 3. 获取笔记列表
```http
POST /api/weRead/notes
Content-Type: application/json

{
  "cookie": "your_weread_cookie",
  "bookId": "optional_book_id"
}
```

#### 4. 获取阅读统计
```http
POST /api/weRead/readingStats
Content-Type: application/json

{
  "cookie": "your_weread_cookie"
}
```

#### 5. 获取书籍详情
```http
POST /api/weRead/bookDetail
Content-Type: application/json

{
  "cookie": "your_weread_cookie",
  "bookId": "book_id"
}
```

#### 6. 搜索书籍
```http
POST /api/weRead/searchBooks
Content-Type: application/json

{
  "cookie": "your_weread_cookie",
  "keyword": "搜索关键词"
}
```

### AI智能接口

#### 1. AI问答
```http
POST /api/ai/ask
Content-Type: application/json

{
  "question": "你的问题",
  "context": "相关上下文"
}
```

#### 2. AI整理笔记
```http
POST /api/ai/organizeNotes
Content-Type: application/json

{
  "notes": "笔记内容",
  "options": {
    "theme": "整理主题",
    "format": "输出格式"
  }
}
```

## 🏗️ 项目结构

```
backend/
├── src/
│   ├── controller/     # 控制器层
│   │   ├── ai.controller.ts      # AI相关接口
│   │   ├── home.controller.ts    # 首页接口
│   │   └── we-read.controller.ts # 微信读书接口
│   ├── service/        # 服务层
│   │   ├── ai.service.ts         # AI服务
│   │   └── we-read.service.ts    # 微信读书服务
│   ├── config/         # 配置文件
│   │   ├── config.default.js     # 默认配置
│   │   ├── config.default.ts     # TypeScript配置
│   │   └── config.unittest.ts    # 测试配置
│   ├── types/          # 类型定义
│   │   └── we-read.types.ts      # 微信读书相关类型
│   └── configuration.ts # 应用配置
├── app/                # 应用目录
├── test/               # 测试文件
├── package.json        # 依赖配置
├── midway.config.ts    # Midway配置
├── jest.config.js      # Jest测试配置
├── ecosystem.config.js # PM2配置
└── Dockerfile          # Docker配置
```

## 🧪 测试

### 运行测试

```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm run cov

# 测试AI整理功能
npm run test:ai

# 测试API接口
npm run test:api "your_cookie_here"
```

### 测试配置

测试配置文件位于 `jest.config.js`，支持TypeScript和ES6模块。

## 🔧 开发工具

### 代码质量

```bash
# 代码风格检查
npm run lint

# 代码格式化
npm run format
```

### 构建

```bash
# 构建项目
npm run build

# 清理构建目录
npm run build:clean
```

## 🐳 Docker部署

### 构建镜像

```bash
docker build -t we-read-backend .
```

### 运行容器

```bash
docker run -p 7001:7001 \
  -e OPENAI_API_KEY=your_key \
  -e NODE_ENV=production \
  we-read-backend
```

### Docker Compose

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "7001:7001"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - NODE_ENV=production
```

## 📊 性能监控

### 日志配置

使用Midway.js内置的日志系统，支持不同级别的日志输出：

- `console.log` - 开发环境
- `winston` - 生产环境
- 结构化日志格式

### 健康检查

```http
GET /health
```

返回服务状态和基本信息。

## 🔒 安全特性

- **Cookie验证**: 严格的微信读书Cookie格式验证
- **API限流**: 防止恶意请求和滥用
- **环境变量**: 敏感信息通过环境变量管理
- **CORS配置**: 可配置的跨域访问控制

## 🚨 故障排除

### 常见问题

1. **OpenAI API错误**
   - 检查API密钥是否正确
   - 确认API配额是否充足

2. **微信读书Cookie失效**
   - 重新获取有效的Cookie
   - 检查Cookie格式是否正确

3. **服务启动失败**
   - 检查端口是否被占用
   - 确认环境变量配置

### 日志查看

```bash
# 查看实时日志
npm run logs

# 查看错误日志
tail -f logs/error.log
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

MIT License

## 🔗 相关链接

- [项目主页](../README.md)
- [前端文档](../frontend/README.md)
- [API详细文档](./README_API.md)
- [环境配置说明](./README_ENV.md)
- [Midway.js官方文档](https://midwayjs.org/)
