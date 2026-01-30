const a = {
  type: 'claude-permission-request',
  requestId: '13ba5b6b-b80b-4d9a-a1af-2a9d94f47df9',
  toolName: 'AskUserQuestion',
  input: {
    questions: [
      {
        question: '你想优化 broadcastProgress 的哪个方面？',
        header: '优化范围',
        options: [
          {
            label: '防止并发触发',
            description: '添加节流锁机制，确保 getProjects 不会同时执行多次，一个完成后才处理下一个',
          },
          {
            label: '减少监听器触发',
            description: '优化文件系统监听器，减少不必要的 getProjects 调用（比如增加防抖时间、过滤某些文件类型）',
          },
          {
            label: '两者都优化',
            description: '既添加防并发锁，又优化监听器触发频率',
          },
          {
            label: '只分析不修改',
            description: '先详细分析当前触发的所有场景，再决定如何优化',
          },
        ],
        multiSelect: false,
      },
    ],
  },
  sessionId: '830cfee5-42fd-436f-948d-5b5ffe009fca',
}

const b = {
  type: 'claude-permission-cancelled',
  requestId: '13ba5b6b-b80b-4d9a-a1af-2a9d94f47df9',
  reason: 'timeout',
  sessionId: '830cfee5-42fd-436f-948d-5b5ffe009fca',
}
