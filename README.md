# SCREEPS BOT 20241129

Screeps游戏AI的第四次尝试。尝试做出以下改进：
- 将所有AI彻底模块化，最大化代码可复用度
- 引入自己开发的代码检查与生成系统，彻底杜绝常见bug并简化开发流程
- 增加“手动重置”功能，删除所有临时对象，模仿全局重置

## 安装

项目使用`pnpm`作为包管理器。确保用`pnpm`执行以下所有操作。（由于项目使用了`pnpm workspace`，`npm`无法使用）

在根目录下执行`pnpm install`即可安装依赖并且构建所有内置依赖。如果使用vscode，重新加载窗口来启动代码分析服务器。

## 代码分析服务器

代码分析服务器位于`packages/tools`下，用于自动分析代码中的自定义错误并生成`src/generated`文件夹下的代码。