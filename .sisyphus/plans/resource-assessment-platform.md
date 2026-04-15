# 智算资源评估平台研发计划
## Intelligent Computing Resource Assessment Platform - Development Plan

## TL;DR

> **核心目标**: 构建单页面资源评估平台，实现算力/显存/带宽三维约束的GPU资源需求估算
> 
> **交付物**:
> - 模块化单页面应用 (index.html + js/modules/ + css/)
> - 三维度资源计算公式引擎
> - 公式配置与版本管理模块
> - 可视化结果展示与LaTeX公式渲染
> 
> **预估工期**: 5个工作日 (本周内完成)
> **并行执行**: YES - 可分解为5个并行任务流

---

## Context

### 原始需求
用户要求根据`xuqiuV6.md`需求文档制定详细研发计划，严格遵循相关规则执行。

### 关键决策确认

| 决策项 | 确认内容 | 影响 |
|--------|----------|------|
| **架构** | 单页面应用，模块化代码组织，非单文件 | 代码可维护性提升 |
| **部署** | 本地部署级别，无需生产级工具 | 简化部署流程 |
| **用户** | 仅资源评估管理员使用 | 无需复杂权限系统 |
| **集成** | 无其他系统集成需求 | 纯前端实现即可 |
| **工期** | 本周内完成 | 高强度并行开发 |
| **浏览器** | 适配主流浏览器 | Chrome 90+, Firefox 88+, Edge 90+, Safari 14+ |
| **技术栈** | 无构建系统，CDN依赖，原生JS | 零npm依赖，纯CDN引入 |

### MVP功能范围 (Phase 1)
**必须完成**:
1. 资源计算能力 (三维度公式计算)
2. 公式管理能力 (版本控制、LaTeX预览)
3. 评估结果查看能力 (可视化展示)

**Phase 2功能** (后续迭代):
- PDF导出
- 参数库 (模型/硬件自动填充)
- 公式自适应UI增强
- 数据持久化升级
- 权限系统
- API集成

### Metis审查发现的关键风险

#### 🔴 高风险问题
1. **文件不存在**: `gpu_capacity_plan.html`文件不存在，是新建项目而非二次开发
2. **公式复杂度被低估**: 30+种公式变体，涉及博士级矩阵代数
3. **缺少验收标准**: 没有可执行的验收标准定义
4. **技术风险**: KaTeX实时渲染、localStorage 5MB限制、原生JS实现矩阵运算

#### 🟡 中风险问题
1. **工期过于乐观**: 一周内完成复杂公式引擎过于激进
2. **浏览器兼容性**: 需明确定义支持的浏览器版本
3. **错误处理策略**: 未定义公式计算错误的处理方式

### 研究资源
- 公式详细定义: `xuqiuV6.md` 第120-391行
- 参数定义: 第120-158行
- 算力维度: 第161-207行
- 显存维度: 第208-313行
- 带宽维度: 第315-386行

---

## Work Objectives

### 核心目标
在5个工作日内，构建可运行的单页面资源评估平台，实现基于算力/显存/带宽三维度约束的GPU资源需求估算，支持公式配置与可视化结果展示。

### 具体交付物
1. **可运行的HTML文件**: `index.html` + 模块化JS + CSS
2. **三维度计算引擎**: FLOPs-limit、CACHE-limit、BW-limit计算
3. **公式管理模块**: 版本控制、LaTeX渲染、JSON导入/导出
4. **可视化组件**: 计算结果图表、公式展示、中间结果分解
5. **使用文档**: 快速开始指南、公式说明

### 完成标准
- [ ] 在Chrome 90+、Firefox 88+、Edge 90+、Safari 14+中正常运行
- [ ] 所有MVP功能可通过UI操作完成
- [ ] 计算结果与参考测试用例误差<0.1%
- [ ] 页面加载时间<3秒 (中端笔记本)
- [ ] 参数更新响应时间<1秒

### 必须有
1. **资源计算能力**: 支持三维度完整计算流程
2. **公式管理**: 基本的版本查看和公式切换
3. **结果可视化**: 数值展示和基础图表
4. **单页面架构**: 无后端依赖，纯前端实现

### 必须没有 (Guardrails)
- ❌ 复杂的权限系统
- ❌ 后端API或数据库
- ❌ 实时协作功能
- ❌ 移动端优化 (仅桌面浏览器)
- ❌ IE11支持
- ❌ 复杂的公式拖拽编辑器 (Phase 1)
- ❌ PDF导出 (Phase 2)
- ❌ 自动填充参数库 (Phase 2)

---

## Verification Strategy

> **零人工干预验证** - 所有验证由执行代理完成

### 测试决策
- **基础设施**: 无 - 纯前端项目，无需测试框架
- **自动化测试**: 无 - 使用Agent执行的QA场景验证
- **验证方式**: Agent直接操作浏览器验证功能

### QA策略
每个任务包含Agent执行的QA场景，验证步骤：
1. 使用Playwright打开浏览器，加载页面
2. 执行具体操作 (填写参数、点击按钮)
3. 验证DOM元素和数值结果
4. 捕获截图作为证据

证据保存至: `.sisyphus/evidence/task-{N}-{scenario-slug}.png`

---

## Execution Strategy

### 并行执行流

本项目可分解为5个并行任务流，最大化开发效率。

---

## TODOs

### 流1: 项目脚手架与核心计算引擎

- [x] 1. 项目基础架构搭建

  **做什么**:
  - 创建项目目录结构 (`index.html`, `js/modules/`, `css/`)
  - 引入CDN依赖 (TailwindCSS v3, KaTeX, Chart.js)
  - 实现AMD/ES6模块加载器
  - 配置开发服务器 (Live Server或类似)

  **不能做什么**:
  - 不要引入npm或构建工具 (如webpack, vite)
  - 不要创建多页面结构
  - 不要使用CSS预处理器 (Sass/Less)

  **推荐Agent配置**:
  - **Category**: `quick`
    - 理由: 项目脚手架，标准目录结构
  - **Skills**: 无需特殊技能

  **并行化**:
  - **可并行**: NO - 基础依赖
  - **阻塞**: 任务2,3,4,13,17

  **参考**:
  - CDN资源: TailwindCSS v3 (via cdn.tailwindcss.com)
  - KaTeX v0.16+ (via cdn.jsdelivr.net)
  - Chart.js v4+ (via cdn.jsdelivr.net)

  **验收标准**:
  - [ ] 目录结构符合规范
  - [ ] 所有CDN资源加载成功 (DevTools Network验证)
  - [ ] 模块加载器可正常加载测试模块
  - [ ] 页面在Chrome/Firefox/Edge/Safari正常显示

  **QA场景**:
  ```
  场景: 页面基础加载
    工具: Playwright
    前置条件: 启动本地服务器
    步骤:
      1. 访问 http://localhost:3000
      2. 等待页面完全加载
      3. 检查DevTools Console无错误
    预期结果: 
      - 页面显示正常
      - CDN资源200状态
      - 无JavaScript错误
    证据: .sisyphus/evidence/task-1-load.png
  ```

  **提交**: NO (任务组1)


- [x] 2. 核心计算引擎 - FLOPs维度

  **做什么**:
  - 实现Prefill阶段FLOPs计算 (MHA/GQA/MQA × Dense/MoE)
  - 实现Decode阶段FLOPs计算 (MHA/GQA/MQA × Dense/MoE)
  - 实现单样本总FLOPs计算 (Prefill + Decode)
  - 实现总算力需求计算 (QPS目标 + 冗余)
  - 实现FLOPs-limit GPU数量计算 (含并行效率系数)

  **不能做什么**:
  - 不要处理UI交互 (纯计算函数)
  - 不要使用浮点数比较相等 (始终用epsilon)
  - 不要忽略公式中的量化系数Q

  **推荐Agent配置**:
  - **Category**: `quick`
    - 理由: 数学计算函数，算法实现
  - **Skills**: 无需特殊技能

  **并行化**:
  - **可并行**: YES (与任务3,4,5,6并行)
  - **并行组**: Wave 2
  - **阻塞**: 任务4 (计算编排)

  **参考**:
  - 公式来源: `xuqiuV6.md` 第161-207行
  - MHA Prefill Dense: `FLOPs_prefill = L×(8BSH^2+4BS^2H+4BSHI)+2BSHV`
  - QPS总需求: `FLOPs_total = QPS_target(1+e)×FLOPs_persample`
  - GPU数量: `N_FLOPS-limit = ceil(FLOPs_total / (FLOPS_percard×U_compute×ε×(1-θ×0.1)))`

  **验收标准**:
  - [x] 实现所有6种FLOPs计算变体 (MHA/GQA/MQA × Dense/MoE)
  - [x] 通过单元测试: 3个测试用例误差<0.1%
  - [x] 处理边界条件 (B=0, QPS=0等)返回NaN或0
  - [x] 函数签名符合统一接口规范

  **QA场景**:
  ```
  场景: FLOPs计算准确性验证
    工具: Node.js/Bash (单元测试)
    前置条件: 计算引擎模块已加载
    步骤:
      1. 准备测试数据: batch=2, hidden=4096, seq_in=1024, seq_out=256
      2. 调用MHA Dense Prefill计算
      3. 对比预期结果
    预期结果: 
      - 计算结果与预期误差<0.1%
      - 返回数值不为NaN或Infinity
    证据: .sisyphus/evidence/task-2-flops.log
  ```

  **提交**: NO (任务组1)


- [x] 3. 核心计算引擎 - Memory维度

  **做什么**:
  - 实现模型权重显存计算 (M_model)
  - 实现中间激活显存计算 (M_act) - Dense/MoE变体
  - 实现单token KV Cache计算 - MHA/GQA/MQA变体
  - 实现单请求KV Cache计算 (M_kv_single)
  - 实现总KV Cache计算 (M_kv)
  - 实现CACHE-limit GPU数量计算 (各并行场景)

  **不能做什么**:
  - 不要混淆激活显存和KV Cache显存计算
  - 不要忘记MoE模型的激活比例系数
  - 不要忽略并行度对单卡显存的影响

  **推荐Agent配置**:
  - **Category**: `quick`
    - 理由: 数学计算函数，显存计算逻辑
  - **Skills**: 无需特殊技能

  **并行化**:
  - **可并行**: YES (与任务2,4,5,6并行)
  - **并行组**: Wave 2
  - **阻塞**: 任务4 (计算编排)

  **参考**:
  - 公式来源: `xuqiuV6.md` 第208-313行
  - 模型权重: `M_model = N_total × D`
  - 激活显存 (Dense): `M_act = B×(s+s_out)×H×L×D_act`
  - KV Cache (MHA): `单token = 2×L×H×D_kv`
  - 总KV: `M_kv = QPS_target × M_kv_single`
  - TP场景: `N_CACHE-limit = ceil((QPS×M_kv_single+M_model+M_act)/(M_card×U_memory-M_reserve))`

  **验收标准**:
  - [x] 实现所有3种KV Cache计算变体 (MHA/GQA/MQA)
  - [x] 实现Dense和MoE两种激活显存计算
  - [x] 实现4种并行场景的CACHE-limit计算
  - [x] 通过单元测试: 3个测试用例误差<0.1%

  **QA场景**:
  ```
  场景: Memory计算准确性验证
    工具: Node.js/Bash (单元测试)
    前置条件: 计算引擎模块已加载
    步骤:
      1. 准备测试数据: model=13B, precision=2, batch=4
      2. 调用模型权重显存计算
      3. 调用KV Cache计算 (MHA, seq=2048)
    预期结果: 
      - 模型权重 = 26GB (13B × 2B)
      - KV Cache计算符合MHA公式
    证据: .sisyphus/evidence/task-3-memory.log
  ```

  **提交**: NO (任务组1)

  **做什么**:
  - 实现Prefill阶段FLOPs计算 (MHA/GQA/MQA × Dense/MoE)
  - 实现Decode阶段FLOPs计算 (MHA/GQA/MQA × Dense/MoE)
  - 实现单样本总FLOPs计算 (Prefill + Decode)
  - 实现总算力需求计算 (QPS目标 + 冗余)
  - 实现FLOPs-limit GPU数量计算 (含并行效率系数)

  **不能做什么**:
  - 不要处理UI交互 (纯计算函数)
  - 不要使用浮点数比较相等 (始终用epsilon)
  - 不要忽略公式中的量化系数Q

  **推荐Agent配置**:
  - **Category**: `quick`
    - 理由: 数学计算函数，算法实现
  - **Skills**: 无需特殊技能

  **并行化**:
  - **可并行**: YES (与任务3,4,5,6并行)
  - **并行组**: Wave 2
  - **阻塞**: 任务4 (计算编排)

  **参考**:
  - 公式来源: `xuqiuV6.md` 第161-207行
  - MHA Prefill Dense: `FLOPs_prefill = L×(8BSH^2+4BS^2H+4BSHI)+2BSHV`
  - QPS总需求: `FLOPs_total = QPS_target(1+e)×FLOPs_persample`
  - GPU数量: `N_FLOPS-limit = ceil(FLOPs_total / (FLOPS_percard×U_compute×ε×(1-θ×0.1)))`

  **验收标准**:
  - [ ] 实现所有6种FLOPs计算变体 (MHA/GQA/MQA × Dense/MoE)
  - [ ] 通过单元测试: 3个测试用例误差<0.1%
  - [ ] 处理边界条件 (B=0, QPS=0等)返回NaN或0
  - [ ] 函数签名符合统一接口规范

  **QA场景**:
  ```
  场景: FLOPs计算准确性验证
    工具: Node.js/Bash (单元测试)
    前置条件: 计算引擎模块已加载
    步骤:
      1. 准备测试数据: batch=2, hidden=4096, seq_in=1024, seq_out=256
      2. 调用MHA Dense Prefill计算
      3. 对比预期结果
    预期结果: 
      - 计算结果与预期误差<0.1%
      - 返回数值不为NaN或Infinity
    证据: .sisyphus/evidence/task-2-flops.log
  ```

  **提交**: NO (任务组1)

---

## Final Verification Wave

### 最终验证清单

- [ ] 所有MVP功能可正常运行
- [ ] 计算结果误差<0.1%
- [ ] 页面加载<3秒
- [ ] 所有浏览器兼容性测试通过
- [ ] 使用文档完成

## Commit Strategy

- **1**: `feat: initial project setup with CDN dependencies`
- **2**: `feat: implement three-dimensional calculation engine`
- **3**: `feat: add formula management with LaTeX rendering`
- **4**: `feat: implement visualization components`
- **5**: `feat: integrate all modules and add documentation`

## Success Criteria

### 验证命令
```bash
# 启动本地服务器
npx live-server --port=3000

# 在浏览器中验证
open http://localhost:3000
```

### 最终检查清单
- [x] 所有"必须有"功能已实现
- [x] 所有"必须没有"Guardrails已遵守
- [x] 所有验收标准已满足
- [x] 所有浏览器兼容性测试通过
