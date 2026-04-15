# 计算结果导出功能实施计划

## 快速概览

> 快速添加计算结果导出功能，用户可通过按钮将当前参数配置下的详细计算结果导出为 DOCX 格式。

> **交付物**：
> - 导出按钮（页面头部）
> - DOCX 文件生成逻辑
> - 完整的计算结果报告

> **预计工作量**：Short（3-5 个任务）
> **并行执行**：是（2 waves）
> **关键路径**：设计导出模块 → 添加 UI 按钮 → 集成生成逻辑

---

## 背景

### 需求来源

用户希望将当前计算方案的详细结果导出为文档，便于：
- 记录和分享计算过程
- 审计和追溯计算依据
- 归档保存

### 技术约束

- **纯前端项目**：无后端服务器，所有逻辑在浏览器端执行
- **现有库**：TailwindCSS（样式）、KaTeX（公式渲染）、Chart.js（可视化）
- **新增库**：docx.js（DOCX 生成）

---

## 工作目标

### 核心目标

新增"导出计算结果"功能，生成包含以下内容的 DOCX 报告：
1. **参数信息**（分类表格）
   - 模型参数：模型名称、总参数量、注意力架构、FFN 架构、隐藏层维度、层数、注意力头数、词表大小等
   - 服务器参数：服务器型号、单卡算力、算力利用率、单卡显存、显存利用率、NVLink 带宽、网络带宽等
   - 业务参数：目标 QPS、QPS 冗余系数、输入/输出序列长度、Batch Size 等
2. **计算公式及结果**
   - 算力维度：Prefill FLOPs、Decode FLOPs、GPU 数量
   - 显存维度：模型权重、激活显存、KV Cache、GPU 数量
   - 带宽维度：高频通信量、低频通信量、单卡最大 QPS、GPU 数量
3. **最终推荐值**
   - 三个维度的 GPU 数量对比和最终推荐值

### 交付标准

- [x] 导出按钮显示在页面头部
- [x] 点击后生成包含完整内容的 DOCX 文件
- [x] 文件名智能推断为 `资源评估_{模型名}_{日期}.docx`
- [x] 所有参数以表格形式呈现
- [x] 公式使用纯文本展示（因 DOCX 不支持 LaTeX 渲染）

---

## 实施策略

### 模块设计

```
Wave 1 (立即开始 - 基础设施):
├── Task 1: 添加 docx.js 依赖并验证加载 [快速]
├── Task 2: 设计 ExportService 模块接口 [快速]
└── Task 3: 提取计算结果数据结构 [快速]

Wave 2 (Task 1-3 完成后 - 核心功能):
├── Task 4: 实现参数表格生成逻辑 [中等]
├── Task 5: 实现计算公式文本化 [中等]
├── Task 6: 添加导出按钮并绑定事件 [快速]
└── Task 7: 集成完整导出流程 [快速]

关键路径: Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6 → Task 7
```

### 依赖矩阵

| Task | 依赖 |
|------|------|
| 1 | - |
| 2 | 1 |
| 3 | 1 |
| 4 | 2, 3 |
| 5 | 2, 3 |
| 6 | 4, 5 |
| 7 | 4, 5, 6 |

---

## 详细任务

### Task 1: 添加 docx.js 依赖

**完成标准**：
- `index.html` 中引入 docx.js CDN
- 验证全局变量 `docx` 可用

**实施步骤**：
1. 在 `index.html` 的 `<head>` 中添加 docx.js CDN
2. 验证引入成功

### Task 2: 设计 ExportService 模块接口

**完成标准**：
- 创建 `js/modules/export-service.js`
- 导出函数签名设计完成

**接口设计**：
```javascript
// 模块导出
export function exportCalculationResults(params, results, config);
export function generateParameterTable(params);
export function generateFormulaText(params, results);
export function generateFinalResults(results);
```

**参考资料**：
- `js/modules/state-manager.js` - 参数结构 参考
- `js/modules/flops-engine.js` - 计算引擎结构

### Task 3: 提取计算结果数据

**完成标准**：
- 确认 `lastCalculation` 结果结构
- 确认参数获取方式

**关键数据结构**：
```javascript
{
  // 参数 (从 stateManager)
  params: { ... },
  // 计算结果
  results: {
    flops: { prefill, decode, total, limit: { gpuCount } },
    memory: { modelWeight, activation, kvCache, cacheLimit: { gpuCount } },
    bandwidth: { highFreq, lowFreq, qpsMax, bwLimit: { gpuCount } },
    finalGPUCount: number,
    isValid: boolean,
    config: { attentionArch, ffnArch }
  }
}
```

### Task 4: 实现参数表格生成

**完成标准**：
- 生成三个分类的参数表格
- 表格样式符合 UI 风格

**参数分组**：
| 分类 | 参数 |
|------|------|
| 模型 | modelName, N_total, attentionArch, ffnArch, H, L, A, A_kv, I, V, N_total_act, E, k, d_ff |
| 服务器 | serverType, FLOPS_percard, U_compute, M_card, U_memory, M_reserve, BW_nvlink, BW_net, n_gpu_per_node, is_cross_node |
| 业务 | QPS_target, QPS_redundancy, S, s_out, B |

### Task 5: 实现计算公式文本化

**完成标准**：
- 三个维度的公式以纯文本形式展示
- 计算结果数值正确

**文本化公式示例**：
- `FLOPs_prefill = L × (8×B×S×H² + 4×B×S²×H + 4×B×S×H×I) + 2×B×S×V`
- 最终数值：`1.23e12 FLOPs`

### Task 6: 添加导出按钮

**完成标准**：
- 按钮位于页面头部
- 事件绑定正确

**UI 位置**：
- 现有按钮结构：`header-actions` 区域
- 新按钮：`重置` 按钮右侧

### Task 7: 集成完整导出流程

**完成标准**：
- 点击按钮 → 生成完整 DOCX → 浏览器下载
- 文件名：`资源评估_{模型名}_{YYYYMMDD}.docx`

---

## 验证策略

### 测试决策

- **自动化测试**：无（纯前端项目）
- **测试框架**：无
- **验证方式**：Agent-Executed QA（手动验证）

### QA 场景

> **场景 1：正常导出流程**
> - 工具：浏览器交互
> - 步骤：
>   1. 打开应用首页
>   2. 选择预设模型（如 Qwen3-8B）
>   3. 选择预设服务器（如 H100）
>   4. 设置业务参数（QPS=1, S=1024, s_out=256, B=1）
>   5. 点击「计算」按钮
>   6. 等待计算完成
>   7. 点击「导出计算结果」按钮
> - 预期结果：浏览器下载 DOCX 文件
> - 证据：`资源评估_Qwen3-8B_20260414.docx` 存在于下载目录

> **场景 2：自定义参数导出**
> - 工具：浏览器交互
> - 步骤：
>   1. 选择「自定义模型」
>   2. 输入自定义参数
>   3. 点击计算
>   4. 导出
> - 预期结果：文件名包含日期，文件内容完整

> **场景 3：内容完整性**
> - 工具：文件检查
> - 步骤：打开导出的 DOCX
> - 预期结果：包含三张参数表格 + 三个维度的公式结果 + 最终推荐值

---

## 提交策略

1. **初始提交**：添加 docx.js 依赖
2. **核心提交**：创建 export-service.js 模块
3. **功能提交**：添加导出按钮
4. **最终提交**：集成完整流程并测试

---

## 成功标准

### 功能验收
- [x] 导出按钮在页面头部显示
- [x] 点击后生成 DOCX 文件
- [x] 文件名格式正确
- [x] 参数表格内容完整
- [x] 计算公式和结果正确显示
- [x] 最终推荐值准确

### 代码质量
- [ ] 无新增 ESLint 错误
- [ ] 代码遵循现有规范
- [ ] 新模块结构清晰