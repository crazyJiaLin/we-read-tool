<template>
  <div class="ai-chat">
    <a-row :gutter="24">
      <a-col :span="24">
        <a-card title="智能功能">
          <a-row :gutter="16">
            <a-col :span="12">
              <a-card title="快速问题" size="small">
                <a-space direction="vertical" style="width: 100%; height: 142px;">
                  <a-button
                    block
                    @click="askQuickQuestion('根据我的读书内容，推荐一些适合我的书籍', 'all')"
                    :disabled="loading"
                  >
                    推荐书籍
                  </a-button>
                  <a-button
                    block
                    @click="askQuickQuestion('分析我的阅读习惯', 'all')"
                    :disabled="loading"
                  >
                    阅读习惯分析
                  </a-button>
                  <a-button
                    block
                    @click="askQuickQuestion('制定读书计划', 'all')"
                    :disabled="loading"
                  >
                    制定计划
                  </a-button>
                </a-space>
              </a-card>
            </a-col>

            <a-col :span="12">
              <a-card title="笔记分析" size="small">
                <a-form layout="vertical">
                  <a-form-item label="选择书籍">
                    <a-select
                      v-model:value="selectedBook"
                      placeholder="选择要分析的书籍"
                      :options="bookOptions"
                      :loading="booksLoading"
                    />
                  </a-form-item>
                  <a-form-item>
                    <a-button
                      type="primary"
                      block
                      @click="analyzeBookNotes"
                      :disabled="!selectedBook || loading"
                    >
                      分析笔记
                    </a-button>
                  </a-form-item>
                </a-form>
              </a-card>
            </a-col>
          </a-row>

          <a-divider />
        </a-card>
      </a-col>
      <a-col :span="24">
        <a-card title="AI助手" style="height: 600px; margin-top: 20px;">
          <div class="chat-container">
            <div class="chat-messages" ref="messagesRef">
              <div
                v-for="message in messagesArray"
                :key="message.id"
                :class="['message', message.type]"
              >
                <div class="message-content">
                  <div class="message-text" v-if="message.type === 'user'">
                    {{ message.content }}
                  </div>
                  <div
                    class="message-text ai-message"
                    v-else-if="message.type === 'ai'"
                    v-html="md.render(message.content)"
                  ></div>
                  <div class="message-time">{{ formatTime(message.time) }}</div>
                </div>
              </div>
            </div>

            <div class="chat-input">
              <a-textarea
                :value="inputMessage"
                placeholder="请输入您的问题..."
                :rows="3"
                :disabled="loading"
                @input="handleMessageInput"
                @keydown.enter.prevent="sendMessage"
              />
              <div class="input-actions">
                <a-button
                  type="primary"
                  @click="sendMessage"
                  :loading="loading"
                  :disabled="!inputMessage.trim()"
                >
                  发送
                </a-button>
                <a-button @click="clearChat">清空对话</a-button>
              </div>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from "vue";
import { message } from "ant-design-vue";
import dayjs from "dayjs";
import MarkdownIt from "markdown-it";
import { askAIStream, fetchBooks, type Book } from "../api/weRead";

// 初始化markdown-it
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
});

interface ChatMessage {
  id: string;
  type: "user" | "ai";
  content: string;
  time: Date;
}

const loading = ref(false);
const inputMessage = ref("");
const messages = ref<Record<string, ChatMessage>>({});
const messagesRef = ref<HTMLElement>();
const selectedBook = ref("");
const booksLoading = ref(false);
const books = ref<Book[]>([]);

const bookOptions = computed(() => {
  return books.value.map((book) => ({
    label: `《${book.book.title}》 - ${book.book.author}`,
    value: book.book.bookId,
  }));
});

// 添加计算属性来将对象转换为数组
const messagesArray = computed(() => {
  return Object.values(messages.value).sort((a, b) => a.time.getTime() - b.time.getTime());
});

const formatTime = (time: Date) => {
  return dayjs(time).format("HH:mm");
};

const scrollToBottom = async () => {
  await nextTick();
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
  }
};

const addMessage = (type: "user" | "ai", content: string) => {
  console.log("Adding message:", {
    type,
    content: content.substring(0, 50) + "...",
  });
  const message: ChatMessage = {
    id: Date.now().toString(),
    type,
    content,
    time: new Date(),
  };
  messages.value[`${message.id}-${message.type}`] = message;
  scrollToBottom();
};

const handleMessageInput = (event: Event) => {
  inputMessage.value = (event.target as HTMLTextAreaElement).value;
};

const sendMessage = async () => {
  if (!inputMessage.value.trim() || loading.value) return;

  const selectedBookInfo = books.value?.find(
    (b) => b.book.bookId === selectedBook.value
  );
  console.log("选择的书籍", selectedBookInfo);

  const userMessage = inputMessage.value;
  addMessage("user", userMessage);
  inputMessage.value = "";
  loading.value = true;

  // 创建AI消息
  const aiMessageId = Date.now().toString();
  const aiMessage: ChatMessage = {
    id: aiMessageId,
    type: "ai",
    content: "",
    time: new Date(),
  };
  messages.value[`${aiMessageId}-ai`] = aiMessage;

  scrollToBottom();

  // 防抖滚动优化
  let scrollTimeout: number = 0;
  const debouncedScroll = () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      scrollToBottom();
    }, 100);
  };

  try {
    await askAIStream({
      books: selectedBookInfo ? [selectedBookInfo.book] : undefined,
      question: userMessage,
      onChunk: (chunk: string) => {
        // 更新AI消息内容
        if (messages.value[`${aiMessageId}-ai`].type === "ai") {
          messages.value[`${aiMessageId}-ai`].content += chunk;
          debouncedScroll();
        }
      },
      onComplete: () => {
        // 完成时的回调
        loading.value = false;
        scrollToBottom();
        clearTimeout(scrollTimeout);
      },
      onError: (error: string) => {
        // 错误处理
        message.error("发送失败：" + error);
        if (messages.value[`${aiMessageId}-ai`].type === "ai") {
          messages.value[`${aiMessageId}-ai`].content =
            "抱歉，我遇到了一些问题，请稍后再试。";
        }
        loading.value = false;
        clearTimeout(scrollTimeout);
      }
    });
  } catch (error: any) {
    message.error("发送失败：" + error.message);
    if (messages.value[`${aiMessageId}-ai`].type === "ai") {
      messages.value[`${aiMessageId}-ai`].content =
        "抱歉，我遇到了一些问题，请稍后再试。";
    }
    loading.value = false;
    clearTimeout(scrollTimeout);
  }
};

const askQuickQuestion = async (question: string, type?: 'all' | 'single') => {
  // 直接添加用户消息，不设置输入框
  addMessage("user", question);
  loading.value = true;

  // 创建AI消息
  const aiMessageId = Date.now().toString();
  const aiMessage: ChatMessage = {
    id: aiMessageId,
    type: "ai",
    content: "",
    time: new Date(),
  };
  console.log("askQuickQuestion: Creating AI message:", {
    id: aiMessageId,
    type: aiMessage.type,
  });
  messages.value[`${aiMessageId}-ai`] = aiMessage;
  scrollToBottom();

  // 防抖滚动优化
  let scrollTimeout: number = 0;
  const debouncedScroll = () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      scrollToBottom();
    }, 100);
  };

  let booksList:any[] = []
  if (type === 'single') {
    const book = books.value.find((b:any) => b.book.bookId === selectedBook.value)
    if (book) {
      booksList = [book.book]
    }
  } else if (type === 'all') {
    booksList = books.value.map((b:any) => b.book)
  }
  try {
    await askAIStream({
      books: booksList,
      question,
      onChunk: (chunk: string) => {
        // 更新AI消息内容
        if (messages.value[`${aiMessageId}-ai`].type === "ai") {
          messages.value[`${aiMessageId}-ai`].content += chunk;
          debouncedScroll();
        }
      },
      onComplete: () => {
        // 完成时的回调
        loading.value = false;
        scrollToBottom();
        clearTimeout(scrollTimeout);
      },
      onError: (error: string) => {
        // 错误处理
        message.error("发送失败：" + error);
        if (messages.value[`${aiMessageId}-ai`].type === "ai") {
          messages.value[`${aiMessageId}-ai`].content =
            "抱歉，我遇到了一些问题，请稍后再试。";
        }
        loading.value = false;
        clearTimeout(scrollTimeout);
      }
    });
  } catch (error: any) {
    message.error("发送失败：" + error.message);
    if (messages.value[`${aiMessageId}-ai`].type === "ai") {
      messages.value[`${aiMessageId}-ai`].content =
        "抱歉，我遇到了一些问题，请稍后再试。";
    }
    loading.value = false;
    clearTimeout(scrollTimeout);
  }
};

const analyzeBookNotes = async () => {
  if (!selectedBook.value) return;

  const book = books.value.find((b) => b.book.bookId === selectedBook.value);
  if (!book) return;

  const question = `请分析《${book.book.title}》这本书的笔记内容，总结主要观点和重要知识点。`;

  // 直接添加用户消息，不设置输入框
  addMessage("user", question);
  loading.value = true;

  // 创建AI消息
  const aiMessageId = Date.now().toString();
  const aiMessage: ChatMessage = {
    id: aiMessageId,
    type: "ai",
    content: "",
    time: new Date(),
  };
  messages.value[`${aiMessageId}-ai`] = aiMessage;
  scrollToBottom();

  // 防抖滚动优化
  let scrollTimeout: number = 0;
  const debouncedScroll = () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      scrollToBottom();
    }, 100);
  };

  try {
    await askAIStream({
      books: [book.book],
      question,
      onChunk: (chunk: string) => {
        // 更新AI消息内容
        if (messages.value[`${aiMessageId}-ai`].type === "ai") {
          messages.value[`${aiMessageId}-ai`].content += chunk;
          debouncedScroll();
        }
      },
      onComplete: () => {
        // 完成时的回调
        loading.value = false;
        scrollToBottom();
        clearTimeout(scrollTimeout);
      },
      onError: (error: string) => {
        // 错误处理
        message.error("发送失败：" + error);
        if (messages.value[`${aiMessageId}-ai`].type === "ai") {
          messages.value[`${aiMessageId}-ai`].content =
            "抱歉，我遇到了一些问题，请稍后再试。";
        }
        loading.value = false;
        clearTimeout(scrollTimeout);
      }
    });
  } catch (error: any) {
    message.error("发送失败：" + error.message);
    if (messages.value[`${aiMessageId}-ai`].type === "ai") {
      messages.value[`${aiMessageId}-ai`].content =
        "抱歉，我遇到了一些问题，请稍后再试。";
    }
    loading.value = false;
    clearTimeout(scrollTimeout);
  }
};

const clearChat = () => {
  messages.value = {};
};

const loadBooks = async () => {
  booksLoading.value = true;
  try {
    const cookie = localStorage.getItem("weReadCookie");
    if (!cookie) {
      message.warning("请先在统计页面设置Cookie以获取书籍列表");
      return;
    }

    books.value = await fetchBooks(cookie);
  } catch (error: any) {
    message.error("加载书籍失败：" + error.message);
  } finally {
    booksLoading.value = false;
  }
};

onMounted(() => {
  loadBooks();
  // 添加欢迎消息
  addMessage(
    "ai",
    "你好！我是你的AI读书助手，可以帮助你分析阅读数据、总结笔记、推荐书籍等。有什么问题都可以问我！"
  );
});
</script>

<style scoped>
.ai-chat {
  padding: 0;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 500px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 16px;
}

.message {
  margin-bottom: 16px;
  display: flex;
}

.message.user {
  justify-content: flex-end;
}

.message.ai {
  justify-content: flex-start;
}

.message-content {
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 12px;
  position: relative;
}

.message.user .message-content {
  background: #1890ff;
  color: white;
}

.message.ai .message-content {
  background: white;
  border: 1px solid #d9d9d9;
}

.message-text {
  margin-bottom: 4px;
  line-height: 1.5;
}

.message-time {
  font-size: 12px;
  opacity: 0.7;
}

.chat-input {
  flex-shrink: 0;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
}

/* Markdown样式 */
.ai-message {
  line-height: 1.6;
}

.ai-message :deep(h1) {
  font-size: 1.5em;
  font-weight: bold;
  margin: 16px 0 8px 0;
  color: #333;
}

.ai-message :deep(h2) {
  font-size: 1.3em;
  font-weight: bold;
  margin: 14px 0 6px 0;
  color: #333;
}

.ai-message :deep(h3) {
  font-size: 1.1em;
  font-weight: bold;
  margin: 12px 0 4px 0;
  color: #333;
}

.ai-message :deep(h4) {
  font-size: 1em;
  font-weight: bold;
  margin: 10px 0 4px 0;
  color: #333;
}

.ai-message :deep(p) {
  margin: 8px 0;
  line-height: 1.6;
}

.ai-message :deep(ul),
.ai-message :deep(ol) {
  margin: 8px 0;
  padding-left: 20px;
}

.ai-message :deep(li) {
  margin: 4px 0;
  line-height: 1.5;
}

.ai-message :deep(blockquote) {
  margin: 8px 0;
  padding: 8px 12px;
  border-left: 4px solid #1890ff;
  background-color: #f8f9fa;
  color: #666;
  font-style: italic;
}

.ai-message :deep(code) {
  background-color: #f1f3f4;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: "Courier New", monospace;
  font-size: 0.9em;
  color: #d73a49;
}

.ai-message :deep(pre) {
  background-color: #f6f8fa;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 8px 0;
  border: 1px solid #e1e4e8;
}

.ai-message :deep(pre code) {
  background-color: transparent;
  padding: 0;
  color: #333;
}

.ai-message :deep(strong) {
  font-weight: bold;
  color: #333;
}

.ai-message :deep(em) {
  font-style: italic;
  color: #666;
}

.ai-message :deep(a) {
  color: #1890ff;
  text-decoration: none;
}

.ai-message :deep(a:hover) {
  text-decoration: underline;
}

.ai-message :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 8px 0;
}

.ai-message :deep(th),
.ai-message :deep(td) {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.ai-message :deep(th) {
  background-color: #f8f9fa;
  font-weight: bold;
}

.ai-message :deep(hr) {
  border: none;
  border-top: 1px solid #ddd;
  margin: 16px 0;
}
</style>
