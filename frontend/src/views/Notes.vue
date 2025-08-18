<template>
  <div class="notes">
    <a-row :gutter="24">
      <a-col :span="24">
        <a-card title="笔记整理">
          <template #extra>
            <a-space>
              <a-select
                v-model="filterType"
                style="width: 120px"
                placeholder="笔记类型"
              >
                <a-select-option value="">全部</a-select-option>
                <a-select-option value="1">划线</a-select-option>
                <a-select-option value="2">笔记</a-select-option>
              </a-select>
              <a-input-search
                v-model="searchText"
                placeholder="搜索笔记内容"
                style="width: 200px"
                @search="handleSearch"
              />
              <a-button type="primary" @click="refreshNotes" :loading="loading">
                刷新笔记
              </a-button>
              <a-button
                type="primary"
                @click="openAIOrganize"
                :loading="aiLoading"
              >
                AI整理
              </a-button>
            </a-space>
          </template>

          <a-table
            :columns="columns"
            :data-source="filteredNotes"
            :loading="loading"
            :pagination="pagination"
            :row-key="getRowKey"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'bookTitle'">
                <div class="book-info">
                  <img
                    :src="record.bookCover"
                    class="book-cover"
                    v-if="record.bookCover"
                  />
                  <div class="book-details">
                    <div class="book-title">{{ record.bookTitle }}</div>
                    <div class="book-author">{{ record.bookAuthor }}</div>
                  </div>
                </div>
              </template>
              <template v-else-if="column.key === 'type'">
                <a-tag :color="record.type === 1 ? 'green' : 'orange'">
                  {{ record.type === 1 ? "划线" : "笔记" }}
                </a-tag>
              </template>
              <template v-else-if="column.key === 'chapter'">
                <a-tag v-if="record.type === 1" color="blue">{{
                  record.chapterTitle.length > 10
                    ? record.chapterTitle.slice(0, 10) + "..."
                    : record.chapterTitle
                }}</a-tag>
                <a-tag v-else color="blue">{{
                  record.chapterTitle.length > 10
                    ? record.chapterTitle.slice(0, 10) + "..."
                    : record.chapterTitle
                }}</a-tag>
              </template>
              <template v-else-if="column.key === 'content'">
                <div class="note-content" :title="record.markText">
                  {{ record.markText }}
                </div>
              </template>
              <template v-else-if="column.key === 'style'">
                <div
                  class="style-indicator"
                  :style="{ backgroundColor: getColorStyle(record.colorStyle) }"
                ></div>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>
    </a-row>

    <!-- AI整理结果弹窗 -->
    <a-modal
      :visible="aiModalVisible"
      title="AI笔记整理结果"
      width="1000px"
      :footer="null"
      @cancel="closeAIModal"
    >
      <div v-if="aiResult">
        <a-card
          title="统计信息"
          size="small"
          style="text-align: center; margin: 10px 0"
        >
          <a-row :gutter="16">
            <a-col :span="6">
              <a-statistic
                title="总笔记数"
                :value="aiResult.summary?.totalNotes"
              />
            </a-col>
            <a-col :span="6">
              <a-statistic
                title="涉及书籍"
                :value="aiResult.summary?.booksCount"
              />
            </a-col>
            <a-col :span="6">
              <a-statistic
                title="划线笔记"
                :value="aiResult.summary?.types?.highlights"
              />
            </a-col>
            <a-col :span="6">
              <a-statistic
                title="个人笔记"
                :value="aiResult.summary?.types?.notes"
              />
            </a-col>
          </a-row>
        </a-card>

        <a-card title="整理结果" size="small">
          <div
            class="ai-content"
            v-html="formatAIContent(aiResult?.organizedContent || '')"
          ></div>
        </a-card>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { message } from "ant-design-vue";
import dayjs from "dayjs";
import MarkdownIt from "markdown-it";
import {
  fetchNotes,
  organizeNotes,
  type NoteResponse,
  type NoteWithBook,
} from "../api/weRead";

// 初始化markdown-it
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

const loading = ref(false);
const aiLoading = ref(false);
const notes = ref<NoteWithBook[]>([]);
const filterType = ref("");
const searchText = ref("");
const aiModalVisible = ref(false);
const aiResult = ref<any>(null);

const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条笔记`,
});

const columns = [
  {
    title: "书籍信息",
    key: "bookTitle",
    width: 180,
  },
  {
    title: "章节",
    key: "chapter",
    width: 150,
  },
  {
    title: "笔记类型",
    key: "type",
    width: 100,
  },
  {
    title: "样式",
    key: "style",
    width: 60,
  },
  {
    title: "笔记内容",
    key: "content",
    ellipsis: true,
  },
  {
    title: "创建时间",
    dataIndex: "createTime",
    key: "createTime",
    width: 180,
    customRender: ({ text }: { text: number }) => formatDate(text),
  },
];

const filteredNotes = computed(() => {
  if (!Array.isArray(notes.value) || notes.value.length === 0) {
    pagination.total = 0;
    return [];
  }

  let filtered = notes.value;

  if (filterType.value) {
    filtered = filtered.filter(
      (note) => note.type.toString() === filterType.value
    );
  }

  if (searchText.value) {
    const search = searchText.value.toLowerCase();
    filtered = filtered.filter(
      (note) =>
        note.markText.toLowerCase().includes(search) ||
        (note.bookTitle && note.bookTitle.toLowerCase().includes(search)) ||
        (note.chapterTitle && note.chapterTitle.toLowerCase().includes(search))
    );
  }

  pagination.total = filtered.length;
  return filtered;
});

const getRowKey = (record: NoteWithBook, index: number) => {
  return record.bookmarkId || `note-${index}`;
};

const formatDate = (timestamp: number) => {
  return dayjs(timestamp * 1000).format("YYYY-MM-DD HH:mm");
};

const getColorStyle = (colorStyle: number) => {
  const colors = [
    "#FFE4E1", // 浅红
    "#E6F3FF", // 浅蓝
    "#FFF2CC", // 浅黄
    "#E8F5E8", // 浅绿
    "#F3E5F5", // 浅紫
    "#FFE6CC", // 浅橙
  ];
  return colors[colorStyle] || "#F5F5F5";
};

const processNotesData = (data: NoteResponse[]): NoteWithBook[] => {
  const processedNotes: NoteWithBook[] = [];

  data.forEach((response) => {
    const { updated, chapters, book } = response;

    // 创建章节映射
    const chapterMap = new Map();
    chapters.forEach((chapter: any) => {
      chapterMap.set(chapter.chapterUid, chapter);
    });

    // 处理每个笔记
    updated.forEach((note: any) => {
      const chapter = chapterMap.get(note.chapterUid);
      processedNotes.push({
        ...note,
        bookTitle: book.title,
        bookAuthor: book.author,
        bookCover: book.cover,
        chapterTitle: chapter?.title || note.chapterTitle || "未知章节",
        chapterIdx: chapter?.chapterIdx || 0,
      });
    });
  });

  return processedNotes;
};

const loadNotes = async () => {
  loading.value = true;
  try {
    const cookie = localStorage.getItem("weReadCookie");
    if (!cookie) {
      message.error("请先在统计页面设置Cookie");
      return;
    }

    const result = await fetchNotes(cookie);
    // 处理新的数据结构
    if (Array.isArray(result)) {
      // result是一个数组，包含多个NoteResponse对象
      notes.value = processNotesData(result as unknown as NoteResponse[]);
    } else {
      notes.value = [];
    }

    if (notes.value.length === 0) {
      message.info("暂无笔记数据");
    } else {
      message.success(`成功加载 ${notes.value.length} 条笔记`);
    }
  } catch (error: any) {
    message.error("加载笔记失败：" + error.message);
    notes.value = [];
  } finally {
    loading.value = false;
  }
};

const refreshNotes = () => {
  loadNotes();
};

const handleSearch = () => {
  pagination.current = 1;
};

const openAIOrganize = async () => {
  if (notes.value.length === 0) {
    message.warning("暂无笔记数据，请先加载笔记");
    return;
  }

  aiLoading.value = true;
  try {
    const cookie = localStorage.getItem("weReadCookie");
    if (!cookie) {
      message.error("请先在统计页面设置Cookie");
      return;
    }

    const result = await organizeNotes(notes.value, cookie);
    console.log("ai 接口 result", result);
    aiResult.value = result.data;
    aiModalVisible.value = true;
    message.success("AI整理完成");
  } catch (error: any) {
    message.error("AI整理失败：" + error.message);
  } finally {
    aiLoading.value = false;
  }
};

const closeAIModal = () => {
  aiModalVisible.value = false;
  aiResult.value = null;
};

const formatAIContent = (content: string) => {
  // 使用markdown-it渲染markdown内容
  return md.render(content);
};

onMounted(() => {
  loadNotes();
});
</script>

<style scoped>
.notes {
  padding: 0;
}

.book-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.book-cover {
  width: 40px;
  height: 50px;
  object-fit: cover;
  border-radius: 4px;
}

.book-details {
  display: flex;
  flex-direction: column;
}

.book-title {
  font-weight: 500;
  font-size: 14px;
  line-height: 1.2;
}

.book-author {
  font-size: 12px;
  color: #666;
  line-height: 1.2;
}

.note-content {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.style-indicator {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid #d9d9d9;
}

.ai-content {
  max-height: 550px;
  overflow-y: auto;
  line-height: 1.6;
}

/* Markdown样式 */
.ai-content :deep(h1) {
  font-size: 24px;
  font-weight: bold;
  margin: 16px 0 12px 0;
  color: #1890ff;
  border-bottom: 2px solid #1890ff;
  padding-bottom: 8px;
}

.ai-content :deep(h2) {
  font-size: 20px;
  font-weight: bold;
  margin: 14px 0 10px 0;
  color: #1890ff;
}

.ai-content :deep(h3) {
  font-size: 16px;
  font-weight: bold;
  margin: 12px 0 8px 0;
  color: #52c41a;
}

.ai-content :deep(h4) {
  font-size: 14px;
  font-weight: bold;
  margin: 10px 0 6px 0;
  color: #722ed1;
}

.ai-content :deep(strong) {
  font-weight: bold;
  color: #52c41a;
}

.ai-content :deep(em) {
  font-style: italic;
  color: #722ed1;
}

.ai-content :deep(ul) {
  margin: 8px 0;
  padding-left: 20px;
}

.ai-content :deep(ol) {
  margin: 8px 0;
  padding-left: 20px;
}

.ai-content :deep(li) {
  margin: 4px 0;
}

.ai-content :deep(blockquote) {
  margin: 8px 0;
  padding: 8px 12px;
  background-color: #f5f5f5;
  border-left: 4px solid #1890ff;
  color: #666;
}

.ai-content :deep(code) {
  background-color: #f0f0f0;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: "Courier New", monospace;
  font-size: 12px;
}

.ai-content :deep(pre) {
  background-color: #f6f8fa;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 8px 0;
}

.ai-content :deep(pre code) {
  background-color: transparent;
  padding: 0;
}

.ai-content :deep(p) {
  margin: 8px 0;
}

.ai-content :deep(hr) {
  border: none;
  border-top: 1px solid #e8e8e8;
  margin: 16px 0;
}

.ai-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 8px 0;
}

.ai-content :deep(th),
.ai-content :deep(td) {
  border: 1px solid #d9d9d9;
  padding: 8px 12px;
  text-align: left;
}

.ai-content :deep(th) {
  background-color: #fafafa;
  font-weight: bold;
}
</style>
