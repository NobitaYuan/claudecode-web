# Vue Events Best Practices

> Event passing and parameter handling for advanced Vue developers

This guide covers best practices for event passing and parameter handling in Vue 3 Composition API with TypeScript.

## Table of Contents

- [Parameter Passing Patterns](#parameter-passing-patterns)
- [Type Declaration Strategies](#type-declaration-strategies)
- [Performance Optimization](#performance-optimization)
- [Real-World Scenarios](#real-world-scenarios)

---

## Parameter Passing Patterns

### Single Parameter

**✅ Recommended**: Use simple primitives for single values

```vue
<script setup lang="ts">
const emit = defineEmits<{
  change: [value: string]
  increment: [amount: number]
  toggle: [isActive: boolean]
}>()

function handleChange() {
  emit('change', 'new value')
}
</script>
```

**❌ Avoid**: Wrapping single values in objects unnecessarily

```vue
<script setup lang="ts">
const emit = defineEmits<{
  change: [payload: { value: string }] // Unnecessary wrapper
}>()

function handleChange() {
  emit('change', { value: 'new value' })
}
</script>
```

### Multiple Parameters

**✅ Recommended**: Use named tuple syntax (Vue 3.3+)

```vue
<script setup lang="ts">
const emit = defineEmits<{
  update: [id: number, status: 'active' | 'inactive']
  filter: [category: string, page: number, limit: number]
}>()

function handleUpdate(id: number) {
  emit('update', id, 'active')
}
</script>
```

**Parent component**:

```vue
<script setup lang="ts">
function onUpdate(id: number, status: 'active' | 'inactive') {
  console.log(id, status)
}
</script>

<template>
  <ChildComponent @update="onUpdate" />
</template>
```

**❌ Avoid**: Using object for multiple parameters when order matters

```vue
<script setup lang="ts">
// Loses type safety and parameter order
const emit = defineEmits<{
  update: [params: Record<string, unknown]>
}>()
</script>
```

### Complex Objects

**✅ Recommended**: Define interfaces for complex data

```vue
<script setup lang="ts">
interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'user'
}

const emit = defineEmits<{
  select: [user: User]
  'batch-update': [users: User[], changes: Partial<User>]
}>()

function handleSelect(user: User) {
  emit('select', user)
}
</script>
```

**⚡️ Performance Tip**: Use `markRaw` for large immutable objects

```vue
<script setup lang="ts">
import { markRaw } from 'vue'

interface LargeConfig {
  // 100+ properties...
}

const emit = defineEmits<{
  load: [config: LargeConfig]
}>()

function handleLoad(config: LargeConfig) {
  // Skip reactivity overhead for read-only large objects
  emit('load', markRaw(config))
}
</script>
```

### Optional Parameters

**✅ Recommended**: Mark optional parameters explicitly

```vue
<script setup lang="ts">
const emit = defineEmits<{
  save: [data: string, options?: { autoClose?: boolean }]
}>()

function handleSave() {
  emit('save', 'data')
  emit('save', 'data', { autoClose: true })
}
</script>
```

---

## Type Declaration Strategies

### Named Tuple Syntax (Vue 3.3+)

**✅ Recommended**: Most concise type declaration

```vue
<script setup lang="ts">
const emit = defineEmits<{
  // Named tuple - clear parameter names
  submit: [formData: FormData, mode: 'create' | 'edit']
  delete: [id: number]
}>()
</script>
```

### Function Signature Syntax

**Use when**: You need validation functions

```vue
<script setup lang="ts">
const emit = defineEmits<{
  (e: 'submit', payload: { email: string }): boolean
  (e: 'cancel', reason?: string): void
}>()

// With validation
const emit = defineEmits({
  submit: (payload: { email: string }) => {
    return !!payload.email?.includes('@')
  },
  cancel: null,
})
</script>
```

### Generic Event Types

**✅ Recommended**: Create reusable event types

```ts
// types/events.ts
export type DataTableEvents<T> = {
  'row-click': [row: T, index: number]
  'selection-change': [selected: T[]]
  'sort-change': [column: keyof T, direction: 'asc' | 'desc']
}

interface User {
  id: number
  name: string
}
```

```vue
<script setup lang="ts">
import type { DataTableEvents } from '@/types/events'

interface User {
  id: number
  name: string
}

const emit = defineEmits<DataTableEvents<User>>()

function handleRowClick(user: User, index: number) {
  emit('row-click', user, index)
}
</script>
```

### Union Types

**✅ Recommended**: Use union types for related events

```vue
<script setup lang="ts">
type Status = 'loading' | 'success' | 'error'

const emit = defineEmits<{
  status: [status: Status, data?: unknown, error?: Error]
}>()

function handleSuccess(data: unknown) {
  emit('status', 'success', data)
}

function handleError(error: Error) {
  emit('status', 'error', undefined, error)
}
</script>
```

---

## Performance Optimization

### ⚠️ Reactive Trap: Unnecessary Reactivity

**❌ Avoid**: Making event parameters reactive unnecessarily

```vue
<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  process: [items: Item[]]
}>()

function handleProcess() {
  const items = ref<Item[]>([...]) // ❌ Unnecessary reactivity
  emit('process', items.value)
}
</script>
```

**✅ Recommended**: Use plain objects for event payloads

```vue
<script setup lang="ts">
const emit = defineEmits<{
  process: [items: Item[]]
}>()

function handleProcess() {
  const items: Item[] = [...] // ✅ Plain array
  emit('process', items)
}
</script>
```

### ⚡️ Use `markRaw` for Large Objects

```vue
<script setup lang="ts">
import { markRaw } from 'vue'

const emit = defineEmits<{
  'config-load': [config: ComplexConfig]
}>()

async function loadConfig() {
  const response = await fetch('/large-config.json')
  const config = await response.json()

  // Skip proxy overhead for large read-only objects
  emit('config-load', markRaw(config))
}
</script>
```

### ⚡️ Event Throttling/Debouncing

```vue
<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'

const emit = defineEmits<{
  search: [query: string]
}>()

// Debounce rapid events
const debouncedEmit = useDebounceFn((query: string) => {
  emit('search', query)
}, 300)

function onInput(query: string) {
  debouncedEmit(query)
}
</script>
```

### ⚠️ Memory Leaks: Event Listeners

**❌ Avoid**: Not cleaning up event listeners

```vue
<script setup lang="ts">
import { onMounted } from 'vue'

const emit = defineEmits<{
  update: [value: number]
}>()

onMounted(() => {
  window.addEventListener('resize', handler) // ❌ Never removed
})

function handler() {
  emit('update', window.innerWidth)
}
</script>
```

**✅ Recommended**: Always clean up listeners

```vue
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

const emit = defineEmits<{
  update: [value: number]
}>()

function handler() {
  emit('update', window.innerWidth)
}

onMounted(() => {
  window.addEventListener('resize', handler)
})

onUnmounted(() => {
  window.removeEventListener('resize', handler) // ✅ Cleanup
})
</script>
```

---

## Real-World Scenarios

### Form Submission with Validation

```vue
<script setup lang="ts">
interface LoginForm {
  email: string
  password: string
  rememberMe?: boolean
}

interface FormErrors {
  email?: string
  password?: string
}

const emit = defineEmits<{
  submit: [data: LoginForm]
  'validation-error': [errors: FormErrors]
}>()

const formData = reactive<LoginForm>({
  email: '',
  password: '',
})

const errors = reactive<FormErrors>({})

function handleSubmit() {
  // Validate
  if (!formData.email) {
    errors.email = 'Email is required'
    emit('validation-error', errors)
    return
  }

  if (!formData.password) {
    errors.password = 'Password is required'
    emit('validation-error', errors)
    return
  }

  // Success
  emit('submit', { ...formData })
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="formData.email" type="email" />
    <span v-if="errors.email">{{ errors.email }}</span>

    <input v-model="formData.password" type="password" />
    <span v-if="errors.password">{{ errors.password }}</span>

    <button type="submit">Submit</button>
  </form>
</template>
```

### Pagination Table with Row Actions

```vue
<script setup lang="ts">
interface User {
  id: number
  name: string
  email: string
  status: 'active' | 'inactive'
}

const emit = defineEmits<{
  'page-change': [page: number, pageSize: number]
  'row-click': [user: User]
  'row-delete': [id: number]
  'row-status-toggle': [id: number, newStatus: User['status']]
}>()

function onPageChange(page: number) {
  emit('page-change', page, 10)
}

function onRowClick(user: User) {
  emit('row-click', user)
}

function onRowDelete(id: number) {
  emit('row-delete', id)
}

function onStatusToggle(user: User) {
  const newStatus: User['status'] = user.status === 'active' ? 'inactive' : 'active'
  emit('row-status-toggle', user.id, newStatus)
}
</script>

<template>
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Email</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="user in users" :key="user.id" @click="onRowClick(user)">
        <td>{{ user.id }}</td>
        <td>{{ user.name }}</td>
        <td>{{ user.email }}</td>
        <td>{{ user.status }}</td>
        <td>
          <button @click.stop="onRowDelete(user.id)">Delete</button>
          <button @click.stop="onStatusToggle(user)">Toggle Status</button>
        </td>
      </tr>
    </tbody>
  </table>

  <pagination @page-change="onPageChange" />
</template>
```

### File Upload with Progress

```vue
<script setup lang="ts">
interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

interface UploadResult {
  url: string
  filename: string
  size: number
}

const emit = defineEmits<{
  start: [file: File]
  progress: [progress: UploadProgress]
  success: [result: UploadResult]
  error: [error: Error]
}>()

async function uploadFile(file: File) {
  emit('start', file)

  const xhr = new XMLHttpRequest()

  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      emit('progress', {
        loaded: e.loaded,
        total: e.total,
        percentage: Math.round((e.loaded / e.total) * 100),
      })
    }
  }

  xhr.onload = () => {
    if (xhr.status === 200) {
      const result = JSON.parse(xhr.responseText)
      emit('success', result)
    }
  }

  xhr.onerror = () => {
    emit('error', new Error('Upload failed'))
  }

  xhr.open('POST', '/api/upload')
  xhr.send(file)
}
</script>
```

### Custom v-model with Multiple Values

```vue
<!-- DatePicker.vue -->
<script setup lang="ts">
interface DateRange {
  start: Date
  end: Date
}

// Single v-model
const selected = defineModel<Date>()

// Named v-model for multiple bindings
const range = defineModel<DateRange>('range')

// v-model with modifiers
const formatted = defineModel<string>('formatted', {
  // Optional: set default value
  default: '',
})

function emitChanges() {
  // v-model automatically emits update:propName events
}
</script>

<template>
  <input type="date" v-model="selected" />
  <input type="date" v-model="range.start" />
  <input type="date" v-model="range.end" />
  <input type="text" v-model="formatted" />
</template>
```

```vue
<!-- Parent.vue -->
<script setup lang="ts">
import { ref } from 'vue'

const selectedDate = ref<Date>()
const dateRange = ref<DateRange>({ start: new Date(), end: new Date() })
const formattedDate = ref('')
</script>

<template>
  <DatePicker v-model="selectedDate" v-model:range="dateRange" v-model:formatted="formattedDate" />
</template>
```

---

## Quick Reference

### Event Naming Convention

- **Emit**: camelCase (`submitForm`, `updateUser`)
- **Listen**: kebab-case (`@submit-form`, `@update-user`)

### Type Declaration Comparison

| Syntax             | Best For           | Example                                |
| ------------------ | ------------------ | -------------------------------------- |
| Named Tuple        | Most cases         | `click: [x: number, y: number]`        |
| Function Signature | Validation         | `(e: 'submit', data: Data) => boolean` |
| Object Syntax      | Runtime validation | `submit: (data) => validate(data)`     |

### Performance Checklist

- [ ] Use `markRaw()` for large read-only objects
- [ ] Avoid making event parameters reactive
- [ ] Clean up event listeners in `onUnmounted`
- [ ] Debounce/throttle rapid events
- [ ] Prefer plain objects over reactive refs for payloads

---

## References

- [Vue 3 Events Documentation](https://vuejs.org/guide/components/events.html)
- [Vue 3 TypeScript Guide](https://vuejs.org/guide/typescript/composition-api.html)
- [defineEmits API Reference](https://vuejs.org/api/sfc-script-setup.html#defineemits)
