# Tools

该包定义了代码分析与生成服务器。目前实现以下功能：

- 分析各方法是否是重载方法以及是否调用了父类方法
- 实现了类/方法/全局语句的标签功能，用于代码生成。目前有效的标签包括：
  - `#exportGlobal`（见[`export-global.ts`](../screeps/src/base/export-global.ts)）