/*
 * 这里放所有的语言补全提示支持
 */

import * as monaco from 'monaco-editor'
// @ts-ignore
import { language as pythonLanguage } from 'monaco-editor/esm/vs/basic-languages/python/python.js'
// @ts-ignore
import { language as sqlLanguage } from 'monaco-editor/esm/vs/basic-languages/sql/sql.js'
// @ts-ignore
import { language as yamlLanguage } from 'monaco-editor/esm/vs/basic-languages/yaml/yaml.js'

import type { paramsType } from '../index.vue'

/** 注册提示提供程序的数组 */
export let completionItemProviderDisposable: monaco.IDisposable[] = []

/** 销毁所有提示提供 */
export const disposeAllCompletionItemProvider = () => {
  try {
    completionItemProviderDisposable.forEach((item) => {
      item.dispose()
    })
    completionItemProviderDisposable = []
  } catch (error) {
    console.error('销毁所有completionItemProvider失败', error)
  }
}

/** 增加Python关键词支持 */
export const registerCompletionForPython = () => {
  monaco.languages.setMonarchTokensProvider('python', pythonLanguage)
  const dps = monaco.languages.registerCompletionItemProvider('python', {
    provideCompletionItems: () => {
      const suggestions: monaco.languages.CompletionItem[] = []
      // 这个keywords就是python.js文件中有的
      pythonLanguage.keywords.forEach((item: any) => {
        suggestions.push({
          label: item,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: item,
        } as monaco.languages.CompletionItem)
      })
      return {
        // 最后要返回一个数组
        suggestions,
      }
    },
  })
  completionItemProviderDisposable.push(dps)
}

/** 增加matlab关键词支持 */
export const registerCompletionForMatlab = () => {
  // 注册matlab
  // https://juejin.cn/post/6844903734607085582?searchId=20250225161355EFF2F197797F48082A7E#heading-2
  monaco.languages.register({ id: 'matlab' })
  const keywords = [
    'break',
    'case',
    'catch',
    'classdef',
    'continue',
    'else',
    'elseif',
    'end',
    'for',
    'function',
    'global',
    'if',
    'otherwise',
    'parfor',
    'persistent',
    'return',
    'spmd',
    'switch',
    'try',
    'while',
    'labindex',
    'codistributed',
  ]
  const dps = monaco.languages.registerCompletionItemProvider('matlab', {
    provideCompletionItems: () => {
      const suggestions: monaco.languages.CompletionItem[] = []
      keywords.forEach((item) => {
        suggestions.push({
          label: item,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: item,
        } as monaco.languages.CompletionItem)
      })
      return {
        suggestions,
      }
    },
  })
  completionItemProviderDisposable.push(dps)
}

/** 增加用户自定义参数提示 */
export const registerCompletionForCustom = (lang: string, paramsArr: paramsType[]) => {
  // 注册提示提供程序
  const dps = monaco.languages.registerCompletionItemProvider(lang, {
    provideCompletionItems: () => {
      // 获取当前行的文本
      //   const textUntilPosition = model.getValueInRange({
      //     startLineNumber: position.lineNumber,
      //     startColumn: 1,
      //     endLineNumber: position.lineNumber,
      //     endColumn: position.column,
      //   });

      // 自定义变量提示列表
      // https://juejin.cn/post/7431957272983650339?searchId=2025022515040734908FE352BF9803BBF4#heading-5
      // https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/f924487d3e6f47bca699c05c8f200e02~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg5qSN54mp57O76Z2S5bm0:q75.awebp?rk3s=f64ab15b&x-expires=1740700676&x-signature=mjLv3a7sVrJ9A3Bt0uyAE9rHM2c%3D
      const suggestions = [] as monaco.languages.CompletionItem[]
      paramsArr.forEach((item, index) => {
        suggestions.push({
          label: item.value,
          insertText: item.value,
          kind: monaco.languages.CompletionItemKind.Constant,
          sortText: `${index}_${item.value}`,
          detail: item.label,
          documentation: item.label,
        } as monaco.languages.CompletionItem)
      })

      return {
        suggestions,
      }
    },
    // triggerCharacters: ['.', '$'], // 触发提示的字符
  })
  completionItemProviderDisposable.push(dps)
}

export const registerCompletionForSQL = () => {
  // 注册SQL关键字提示
  const dps = monaco.languages.registerCompletionItemProvider('sql', {
    provideCompletionItems: () => {
      const suggestions: monaco.languages.CompletionItem[] = []
      // language.keywords 是获取内置的SQL关键字
      sqlLanguage.keywords.map((item: string) => {
        suggestions.push({
          label: item,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: `${item}`,
          detail: '',
        } as monaco.languages.CompletionItem)
      })
      return {
        suggestions,
      }
    },
  })
  completionItemProviderDisposable.push(dps)
}

export const registerCompletionForYAML = () => {
  // 注册SQL关键字提示
  const dps = monaco.languages.registerCompletionItemProvider('yaml', {
    provideCompletionItems: () => {
      const suggestions: monaco.languages.CompletionItem[] = []
      // language.keywords 是获取内置的SQL关键字
      yamlLanguage.keywords.map((item: string) => {
        suggestions.push({
          label: item,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: `${item}`,
          detail: '',
        } as monaco.languages.CompletionItem)
      })
      return {
        suggestions,
      }
    },
  })
  completionItemProviderDisposable.push(dps)
}
