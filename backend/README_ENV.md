# 环境变量配置说明

## 必需的环境变量

### OpenAI配置
```bash
# OpenAI API密钥
OPENAI_API_KEY=your_openai_api_key_here

# OpenAI模型名称（可选，默认为gpt-3.5-turbo）
OPENAI_MODEL=gpt-3.5-turbo
```

## 配置方法

### 方法1：创建.env文件（推荐）
在backend目录下创建`.env`文件：
```bash
cd backend
cp .env.example .env
# 然后编辑.env文件，填入真实的API密钥
```

### 方法2：直接在终端设置
```bash
export OPENAI_API_KEY="your_api_key_here"
export OPENAI_MODEL="gpt-3.5-turbo"
```

### 方法3：在启动脚本中设置
```bash
OPENAI_API_KEY="your_api_key_here" npm run dev
```

## 安全提醒
- 永远不要将真实的API密钥提交到git仓库
- .env文件已经被添加到.gitignore中
- 如果意外提交了敏感信息，请立即轮换API密钥
