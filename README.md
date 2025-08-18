# 📚 微信读书工具 (WeRead Tool)

一个功能强大的微信读书数据管理与AI分析工具，帮助用户深度分析阅读数据、管理读书笔记，并运用AI技术智能整理知识体系。

## ✨ 功能特性

- 📊 **阅读统计**: 统计阅读时长、书籍数量、阅读进度等
- 📚 **笔记管理**: 查看和管理所有读书笔记
- 🤖 **AI整理**: 使用AI智能整理和分析读书笔记
- 📈 **数据可视化**: 图表展示阅读数据和分类统计
- 🔍 **搜索过滤**: 支持按类型、内容搜索笔记
- 🌐 **Web界面**: 现代化的Vue3前端界面
- 🔒 **隐私保护**: 本地数据存储，不泄露用户信息

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- MongoDB (可选，用于数据持久化)

### 一键启动

```bash
# 克隆项目
git clone git@github.com:crazyJiaLin/we-read-tool.git
cd we-read-tool

# 安装所有依赖
npm run install:all

# 启动开发环境
npm run dev
```

### 手动启动

```bash
# 安装前端依赖
cd frontend
npm install
npm run dev

# 安装后端依赖
cd backend
npm install
npm run dev
```

### 配置环境变量

在 `backend` 目录下创建 `.env` 文件：

```bash
# OpenAI配置（用于AI整理功能）
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo
```

## 📖 使用指南

### 1. 设置Cookie

1. 打开微信读书网页版 (https://weread.qq.com)
2. 登录后按F12打开开发者工具
3. 在Network标签页中找到任意请求
4. 复制请求头中的Cookie值
5. 在工具中粘贴Cookie并点击"获取数据"

### 2. 查看阅读统计

- 总阅读时长
- 已读书籍数量
- 在读书籍数量
- 连续阅读天数
- 分类统计图表

### 3. 管理读书笔记

- 查看所有笔记
- 按类型筛选（划线/笔记）
- 搜索笔记内容
- 查看笔记详情

### 4. AI整理笔记

点击"AI整理"按钮，系统将：

1. 收集所有读书笔记
2. 调用AI接口进行分析
3. 按主题分类整理
4. 生成知识体系建议
5. 提供学习建议

AI整理功能特点：
- 🎯 **智能分类**: 自动按主题对笔记进行分类
- 🔗 **关联分析**: 发现笔记之间的联系
- 💡 **学习建议**: 提供个性化的学习建议
- 📊 **统计概览**: 显示笔记统计信息

## 🏗️ 项目结构

```
we-read-tool/
├── frontend/          # Vue3前端应用
│   ├── src/
│   │   ├── views/     # 页面组件
│   │   ├── api/       # API接口
│   │   └── router/    # 路由配置
│   ├── package.json   # 前端依赖
│   └── vite.config.ts # Vite配置
├── backend/           # Midway.js后端服务
│   ├── src/
│   │   ├── controller/# 控制器
│   │   ├── service/   # 服务层
│   │   └── config/    # 配置文件
│   ├── package.json   # 后端依赖
│   └── midway.config.ts
├── docker-compose.yml # Docker编排
├── start.sh          # 启动脚本
└── README.md         # 项目说明
```

## 🛠️ 技术栈

### 前端
- **Vue 3** + TypeScript
- **Ant Design Vue** - UI组件库
- **ECharts** - 数据可视化
- **Vite** - 构建工具
- **Vue Router** - 路由管理

### 后端
- **Midway.js** - Node.js框架
- **TypeScript** - 开发语言
- **OpenAI API** - AI服务
- **Axios** - HTTP客户端

## 📚 API接口

### 基础接口

- `POST /api/weRead/userData` - 获取用户数据
- `POST /api/weRead/books` - 获取书籍列表
- `POST /api/weRead/notes` - 获取笔记列表
- `POST /api/weRead/readingStats` - 获取阅读统计

### AI接口

- `POST /api/ai/ask` - AI问答
- `POST /api/ai/organizeNotes` - AI整理笔记

## 🐳 Docker部署

```bash
# 使用Docker Compose启动
docker-compose up -d

# 或分别构建
docker build -t we-read-frontend ./frontend
docker build -t we-read-backend ./backend
```

## ⚠️ 注意事项

1. **Cookie安全**: 请妥善保管您的微信读书Cookie，不要泄露给他人
2. **API限制**: OpenAI API有调用频率限制，请合理使用
3. **数据隐私**: 所有数据仅存储在本地，不会上传到第三方服务器
4. **环境变量**: 确保正确配置OpenAI API密钥

## 🤝 贡献指南

欢迎提交Issue和Pull Request来改进这个项目！

### 开发流程

```bash
# 开发模式启动
npm run dev

# 测试API
npm run test:api "your_cookie_here"

# 构建项目
npm run build
```

## 📄 许可证

MIT License

## 🔗 相关链接

- [前端文档](./frontend/README.md)
- [后端文档](./backend/README.md)
- [API文档](./backend/README_API.md)
- [环境配置](./backend/README_ENV.md) 