<script setup lang="ts">
import type { editor as editorType } from 'monaco-editor'
import * as monaco from 'monaco-editor'
import type { MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper'
import { onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'

import {
  disposeAllCompletionItemProvider,
  registerCompletionForCustom,
  // registerCompletionForMatlab,
  registerCompletionForPython,
  registerCompletionForSQL,
  registerCompletionForYAML,
} from './utils/langCompletion'
import { disposeAllTypeProvider } from './utils/langType'

export interface paramsType {
  value: string
  label: string
  type: string
}
interface IProps {
  modelValue: string
  language?: 'javascript' | 'python' | 'sql' | 'matlab' | 'json' | 'yaml'
  theme?: 'vs' | 'vs-dark' | 'hc-black' | 'hc-light'
  readonly?: boolean
  /** 自动补全的参数列表 */
  autoCompleteParams?: paramsType[]
}
const Props = withDefaults(defineProps<IProps>(), {
  modelValue: '',
  language: 'sql',
  theme: 'vs-dark',
  readonly: false,
  autoCompleteParams: () => [
    // { value: 'aaaaa', label: '参数aaaaa', type: 'STRING' },
    // { value: 'bbbbb', label: '参数bbbbb', type: 'STRING' },
    // { value: 'ccccc', label: '参数ccccc', type: 'STRING' }
  ],
})

const emit = defineEmits(['update:modelValue', 'change'])
/** dom */
const editorContainerRef = shallowRef<HTMLElement | null>(null)
/** editor实例 */
let Editor: editorType.IStandaloneCodeEditor
let wrapper: MonacoEditorLanguageClientWrapper

/** 初始化 */
const init = async () => {
  if (!editorContainerRef.value) return
  // 注册所有提示和类型;
  registerAllCompletionAndType()
  // 初始化编辑器;
  Editor = monaco.editor.create(editorContainerRef.value, {
    value: Props.modelValue,
    language: Props.language,
    theme: Props.theme,
    // automaticLayout: true,
    // 缩略图
    minimap: { enabled: false },
    fontSize: 14,
    scrollBeyondLastLine: false,
    readOnly: Props.readonly,
    automaticLayout: true,
  })

  // 监听内容变化
  Editor.onDidChangeModelContent(() => {
    if (!Editor) return
    const value = Editor.getValue() || ''
    emit('update:modelValue', value)
    emit('change', value)
  })
}

/** 设置语言 */
const setLanguage = (lang: string = Props.language) => {
  if (!Editor) return
  const model = Editor.getModel()
  if (!model) return
  monaco.editor.setModelLanguage(model, lang)
}

/** 设置内容 */
const setVal = (newValue: string) => {
  if (!Editor) return
  Editor.setValue(newValue)
}

/** 获取内容 */
const getVal = (options?: { preserveBOM: boolean; lineEnding: string }) => {
  if (!Editor) return ''
  return Editor.getValue(options)
}

/** 销毁实例 */
const destroy = () => {
  if (!Editor) return
  wrapper?.dispose()
  Editor?.dispose()
  editorContainerRef.value?.remove()
  disposeAllCompletionItemProvider()
  disposeAllTypeProvider()
}

/**
 * @description 设置主题
 * @param {string} theme 'vs' | 'vs-dark' | 'hc-black' | 'hc-light'
 */
const setTheme = (theme: string = Props.theme) => {
  monaco.editor.setTheme(theme)
}

/** 注册所有提示和类型 */
const registerAllCompletionAndType = () => {
  // 补全提示
  disposeAllCompletionItemProvider()
  registerCompletionForPython()
  registerCompletionForSQL()
  registerCompletionForYAML()
  // registerCompletionForMatlab();
  registerCompletionForCustom(Props.language, Props.autoCompleteParams)
  // 类型提示
  disposeAllTypeProvider()
}

/**
 * @description 此方法是为了解决报错
 * 具体看issues：https://github.com/microsoft/monaco-editor/issues/4739
 */
const ensureMonacoEnvironment = () => {
  window.MonacoEnvironment = {
    getWorkerUrl: () =>
      `data:text/javascript;charset=utf-8,${encodeURIComponent(`
        self.MonacoEnvironment = {
          baseUrl: 'https://unpkg.com/monaco-editor@0.50.0/min/'
        };
        importScripts('https://unpkg.com/monaco-editor@0.50.0/min/vs/base/worker/workerMain.js');`)}`,
  }
}

/** 监听参数变化，实时注册提示和类型 */
watch(
  () => {
    return Props.autoCompleteParams
  },
  () => {
    registerAllCompletionAndType()
  },
)

watch(
  () => Props.modelValue,
  (newValue) => {
    // 当外部v-model的值改变时，同步更新编辑器内容
    if (Editor && newValue !== getVal()) {
      setVal(newValue)
    }
  },
)

onMounted(() => {
  ensureMonacoEnvironment()
  init()
})

onBeforeUnmount(() => {
  destroy()
})

defineExpose({
  monaco,
  setVal,
  getVal,
  setLanguage,
  destroy,
  setTheme,
})
</script>
<template>
  <div class="monaco_editor_container">
    <div ref="editorContainerRef" class="monaco_editor"></div>
  </div>
</template>

<style scoped lang="scss">
.monaco_editor_container {
  width: 100%;
  height: 100%;
  position: relative;
  .monaco_editor {
    height: 100%;
    min-height: 200px;
  }
}
</style>
