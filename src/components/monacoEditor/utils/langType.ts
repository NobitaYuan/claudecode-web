/*
 * 这里放所有的语言类型支持
 */

import type * as monaco from 'monaco-editor'

/** 注册类型提示程序的数组 */
export const typeProviderDisposable: monaco.IDisposable[] = []

/** 销毁所有类型提示 */
export const disposeAllTypeProvider = () => {
  try {
    typeProviderDisposable.forEach((item) => {
      item.dispose()
    })
  } catch (error) {
    console.error('销毁所有disposeAllTypeProvider失败', error)
  }
}
