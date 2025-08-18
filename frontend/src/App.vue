<template>
  <div id="app">
    <a-layout style="min-height: 100vh">
      <a-layout-header style="background: #fff; padding: 0 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.1)">
        <div style="display: flex; align-items: center; height: 100%">
          <h1 style="margin: 0; color: #1890ff">微信读书统计工具</h1>
          <a-menu mode="horizontal" :selected-keys="[activeTab]" @click="onTabChange" style="margin-left: 40px; flex: 1">
            <a-menu-item key="/dashboard">统计概览</a-menu-item>
            <a-menu-item key="/notes">笔记整理</a-menu-item>
            <a-menu-item key="/ai">AI问答</a-menu-item>
          </a-menu>
        </div>
      </a-layout-header>
      <a-layout-content style="padding: 24px">
        <router-view />
      </a-layout-content>
    </a-layout>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const activeTab = ref(route.path)

watch(route, (val) => {
  activeTab.value = val.path
})

const onTabChange = (e: any) => {
  if (e.key !== route.path) {
    router.push(e.key)
  }
}
</script>

<style>
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
</style> 