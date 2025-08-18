<template>
  <div class="dashboard">
    <a-row :gutter="24">
      <a-col :span="24">
        <a-card title="Cookie设置" style="margin-bottom: 24px">
          <a-form layout="inline" @submit.prevent="fetchData">
            <a-form-item label="微信读书Cookie">
              <a-input
                :value="userCookie"
                placeholder="请输入微信读书的cookie"
                style="width: 400px"
                :disabled="loading"
                @change="handleCookieChange"
              />
            </a-form-item>
            <a-form-item>
              <a-button type="primary" html-type="submit" :loading="loading">
                获取数据
              </a-button>
            </a-form-item>
            <a-form-item>
              <a-button @click="clearCookie"> 清空 </a-button>
            </a-form-item>
          </a-form>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="24" v-if="userData">
      <a-col :span="6">
        <a-card>
          <a-statistic
            title="全部书籍"
            :value="userData.stats?.totalBooks"
            suffix="本"
          />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <a-statistic
            title="已完成"
            :value="userData.stats?.finishedBooks"
            suffix="本"
          />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <a-statistic
            title="在读"
            :value="userData.recentBooks?.length"
            suffix="本"
          />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <a-statistic
            title="连续阅读天数"
            :value="userData.stats?.readingStreak"
            suffix="天"
          />
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="24" style="margin-top: 24px" v-if="userData">
      <a-col :span="12">
        <a-card title="书籍分类统计（一级分类）">
          <v-chart :option="primaryCategoryChart" style="height: 300px" />
        </a-card>
      </a-col>
      <a-col :span="12">
        <a-card title="书籍分类统计（详细）">
          <v-chart :option="categoryChart" style="height: 300px" />
        </a-card>
      </a-col>
    </a-row>

    <a-row
      :gutter="24"
      style="margin-top: 24px"
      v-if="userData && userData.recentBooks"
    >
      <a-col :span="24">
        <a-card title="最近阅读">
          <a-table
            :columns="bookColumns"
            :data-source="userData.recentBooks"
            :pagination="false"
            :row-key="getRecentBookKey"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'cover'">
                <img
                  :src="record.cover"
                  alt="cover"
                  style="width: 40px; height: 56px; object-fit: cover"
                />
              </template>
              <template v-else-if="column.key === 'progress'">
                <a-progress :percent="record.progress" size="small" />
              </template>
              <template v-else-if="column.key === 'action'">
                <a-button type="link" size="small" @click="viewBook(record)">
                  查看详情
                </a-button>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>
    </a-row>

    <a-row
      :gutter="24"
      style="margin-top: 24px"
      v-if="userData && userData.entireShelf"
    >
      <a-col :span="24">
        <a-card title="我的全部书籍">
          <a-table
            :columns="allBookColumns"
            :data-source="userData.entireShelf"
            :pagination="false"
            :row-key="getBookKey"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'cover'">
                <img
                  :src="record.cover"
                  alt="cover"
                  style="width: 40px; height: 56px; object-fit: cover"
                />
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from "vue";
import { message } from "ant-design-vue";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { LineChart, PieChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from "echarts/components";
import VChart from "vue-echarts";
import { fetchUserData } from "../api/weRead";

interface RecentBook {
  id: string;
  title: string;
  author: string;
  cover: string;
  progress: number;
  lastRead: string;
  category: string;
}

interface BookItem {
  bookId: string;
  title: string;
  author: string;
  cover: string;
  category?: string;
  readUpdateTime?: number;
}

interface Stats {
  totalBooks: number;
  finishedBooks: number;
  readingBooks: number;
  totalReadingTime: number;
  totalWords: number;
  averageReadingTime: number;
  readingStreak: number;
  lastReadingDate: string;
}

interface UserData {
  stats: Stats;
  entireShelf: BookItem[];
  totalReadingTime: number;
  totalBooks: number;
  monthlyBooks: number;
  categoryData: Array<{ name: string; value: number }>;
  recentBooks: RecentBook[];
}

use([
  CanvasRenderer,
  LineChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
]);

const userCookie = ref(localStorage.getItem("weReadCookie") || "");
const loading = ref(false);
const userData = ref<UserData | null>(null);

const bookColumns = [
  { title: "封面", dataIndex: "cover", key: "cover" },
  { title: "书名", dataIndex: "title", key: "title" },
  { title: "作者", dataIndex: "author", key: "author" },
  { title: "分类", dataIndex: "category", key: "category", width: 180 },
  {
    title: "进度",
    dataIndex: "progress",
    key: "progress",
    customRender: ({ text }: { text: number }) => `${text}%`,
  },
  {
    title: "最后阅读",
    dataIndex: "lastRead",
    key: "lastRead",
    customRender: ({ text }: { text: string }) =>
      new Date(text).toLocaleDateString(),
  },
  { title: "操作", key: "action" },
];

const allBookColumns = [
  { title: "ID", dataIndex: "bookId", key: "bookId" },
  { title: "封面", dataIndex: "cover", key: "cover" },
  { title: "书名", dataIndex: "title", key: "title" },
  { title: "作者", dataIndex: "author", key: "author" },
  { title: "分类", dataIndex: "category", key: "category", width: 180 },
  {
    title: "最近阅读",
    dataIndex: "readUpdateTime",
    key: "readUpdateTime",
    customRender: ({ text }: { text: number }) =>
      text ? new Date(text * 1000).toLocaleDateString() : "",
  },
];

const categoryChart = reactive({
  tooltip: {
    trigger: "item",
  },
  series: [
    {
      type: "pie",
      radius: "50%",
      data: [] as any[],
    },
  ],
});

// 安全的row-key生成函数
const getRecentBookKey = (record: RecentBook, index: number) => {
  return record.id || `recent-${index}`;
};

const getBookKey = (record: BookItem, index: number) => {
  return record.bookId || `book-${index}`;
};

const fetchData = async () => {
  if (!userCookie.value) {
    message.error("请输入微信读书Cookie");
    return;
  }

  loading.value = true;
  try {
    const data: any = await fetchUserData(userCookie.value);
    // recentBooks 兼容性处理，确保 cover 和 category 字段存在
    let fixedData = { ...(data?.data || {}) };
    if (fixedData.recentBooks && fixedData.recentBooks.length > 0) {
      fixedData.recentBooks = fixedData.recentBooks
        // ?.filter((item: any) => {
        //   const now = new Date();
        //   const lastRead = new Date(item.lastRead);
        //   const diffTime = Math.abs(now.getTime() - lastRead.getTime());
        //   const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        //   return diffDays <= 30;
        // })
        .map((b: any) => ({
          cover: b.cover || "",
          category: b.category || "",
          ...b,
        }));
    }
    console.log("fixedData", fixedData);
    userData.value = fixedData as UserData;
    updateCharts(fixedData as UserData);
    localStorage.setItem("weReadCookie", userCookie.value);
    message.success("数据获取成功");
  } catch (error: any) {
    message.error("数据获取失败：" + (error.message || error));
  } finally {
    loading.value = false;
  }
};

// 添加一级分类图表配置
const primaryCategoryChart = reactive({
  tooltip: {
    trigger: "item",
    formatter: "{a} <br/>{b}: {c} ({d}%)",
  },
  series: [
    {
      name: "一级分类",
      type: "pie",
      radius: "50%",
      data: [] as any[],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: "rgba(0, 0, 0, 0.5)",
        },
      },
    },
  ],
});

const updateCharts = (data: UserData) => {

  // 更新分类图表（详细分类）
  categoryChart.series[0].data = data.categoryData || [];

  // 更新一级分类图表
  const primaryCategoryMap = new Map<string, number>();

  // 处理categoryData，提取一级分类
  (data.categoryData || []).forEach((item) => {
    const categoryName = item.name;
    // 如果包含"-"，取"-"前面的部分作为一级分类
    const primaryCategory = categoryName.includes("-")
      ? categoryName.split("-")[0].trim()
      : categoryName;

    primaryCategoryMap.set(
      primaryCategory,
      (primaryCategoryMap.get(primaryCategory) || 0) + item.value
    );
  });

  // 转换为图表数据格式
  const primaryCategoryData = Array.from(primaryCategoryMap.entries()).map(
    ([name, value]) => ({
      name,
      value,
    })
  );

  primaryCategoryChart.series[0].data = primaryCategoryData;
};

const viewBook = (book: RecentBook) => {
  // 查看书籍详情
  console.log("查看书籍:", book);
};

onMounted(() => {
  const cookie = localStorage.getItem("weReadCookie");
  console.log("cookie", cookie);
  if (cookie) {
    userCookie.value = cookie;
    fetchData();
  }
});

const clearCookie = () => {
  userCookie.value = "";
  localStorage.removeItem("weReadCookie");
};

const handleCookieChange = (e: any) => {
  userCookie.value = e.target.value;
  localStorage.setItem("weReadCookie", userCookie.value);
};
</script>

<style scoped>
.dashboard {
  padding: 0;
}
</style>
