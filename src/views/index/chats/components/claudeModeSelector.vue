<script setup lang="ts">
interface PermissionModeConfig {
  label: string
  buttonClass: string
  indicatorClass: string
}

const PERMISSION_MODE_MAP: Record<string, PermissionModeConfig> = {
  default: {
    label: '默认模式',
    buttonClass: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600',
    indicatorClass: 'bg-gray-500 dark:bg-gray-400',
  },
  acceptEdits: {
    label: '编辑模式',
    buttonClass:
      'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-300 dark:border-green-600 hover:bg-green-100 dark:hover:bg-green-900/30',
    indicatorClass: 'bg-green-500 dark:bg-green-400',
  },
  plan: {
    label: '计划模式',
    buttonClass:
      'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30',
    indicatorClass: 'bg-blue-500 dark:bg-blue-400',
  },
  // bypassPermissions: {
  //   label: '无限制模式',
  //   buttonClass:
  //     'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/30',
  //   indicatorClass: 'bg-orange-500 dark:bg-orange-400',
  // },
}

const modes = Object.keys(PERMISSION_MODE_MAP)
const permissionMode = defineModel<keyof typeof PERMISSION_MODE_MAP>('mode', { default: 'default' })
const currentConfig = computed(() => PERMISSION_MODE_MAP[permissionMode.value])

const handleModeSwitch = () => {
  const currentIndex = modes.indexOf(permissionMode.value)
  const nextIndex = (currentIndex + 1) % modes.length
  const newMode = modes[nextIndex]
  permissionMode.value = newMode as keyof typeof PERMISSION_MODE_MAP
}
</script>

<template>
  <div class="flex items-center justify-center gap-3">
    <button
      type="button"
      @click="handleModeSwitch"
      :class="['px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200', currentConfig.buttonClass]"
      title="点击切换模式"
    >
      <div class="flex items-center gap-2">
        <div :class="['w-2 h-2 rounded-full', currentConfig.indicatorClass]" />
        <span>{{ currentConfig.label }}</span>
      </div>
    </button>
  </div>
</template>
