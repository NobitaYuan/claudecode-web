<template>
  <div class="file-tree-empty">
    <!-- 无文件 -->
    <div v-if="!hasSearchQuery" class="empty-container">
      <div class="empty-icon">
        <t-icon name="folder" />
      </div>
      <h4 class="empty-title">未找到文件</h4>
      <p class="empty-description">检查项目路径是否可访问</p>
    </div>

    <!-- 搜索无结果 -->
    <div v-else class="empty-container">
      <div class="empty-icon">
        <t-icon name="search" />
      </div>
      <h4 class="empty-title">未找到匹配项</h4>
      <p class="empty-description">尝试不同的搜索词或清除搜索</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  hasSearchQuery: boolean
}>()
</script>

<style scoped lang="scss">
.file-tree-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 0;
  text-align: center;
}

.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--td-bg-color-container);
  border-radius: var(--td-radius-default);
  color: var(--td-text-color-secondary);
  font-size: 24px;
  margin: 0 auto 12px;

  :deep(.t-icon) {
    font-size: 24px;
  }
}

.empty-title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--td-text-color-primary);
}

.empty-description {
  margin: 0;
  font-size: 14px;
  color: var(--td-text-color-secondary);
}
</style>
