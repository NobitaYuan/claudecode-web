<template>
  <div class="file-tree-header">
    <div class="header-top">
      <h3 class="header-title">文件</h3>
      <div class="view-mode-buttons">
        <t-button :variant="viewMode === 'simple' ? 'base' : 'text'" size="small" @click="changeViewMode('simple')" title="简单视图">
          <template #icon>
            <t-icon name="list" />
          </template>
        </t-button>
        <t-button :variant="viewMode === 'compact' ? 'base' : 'text'" size="small" @click="changeViewMode('compact')" title="紧凑视图">
          <template #icon>
            <t-icon name="view-module" />
          </template>
        </t-button>
        <t-button :variant="viewMode === 'detailed' ? 'base' : 'text'" size="small" @click="changeViewMode('detailed')" title="详细视图">
          <template #icon>
            <t-icon name="table" />
          </template>
        </t-button>
      </div>
    </div>

    <div class="search-container">
      <t-input v-model="searchValue" placeholder="搜索文件和文件夹..." clearable :prefix-icon="() => h(SearchIcon)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import { SearchIcon } from 'tdesign-icons-vue-next'
import { ViewMode } from '../types/file'

const props = defineProps<{
  viewMode: ViewMode
  searchQuery: string
}>()

const emit = defineEmits<{
  'update:viewMode': [mode: ViewMode]
  'update:searchQuery': [query: string]
}>()

const searchValue = computed({
  get: () => props.searchQuery,
  set: (value: string) => emit('update:searchQuery', value),
})

const changeViewMode = (mode: ViewMode) => {
  emit('update:viewMode', mode)
  localStorage.setItem('file-tree-view-mode', mode)
}
</script>

<style scoped lang="scss">
.file-tree-header {
  padding: 16px;
  border-bottom: 1px solid var(--td-border-level-1-color);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--td-text-color-primary);
}

.view-mode-buttons {
  display: flex;
  gap: 4px;
}

.search-container {
  position: relative;
}
</style>
