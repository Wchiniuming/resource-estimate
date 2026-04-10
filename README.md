# 智算资源（推理任务）申请合理性评估平台

Intelligent Computing Resource Assessment Platform for Inference Tasks

## 快速开始

### 运行方式

直接在浏览器中打开 `index.html` 文件即可使用。

```bash
# 使用 Python 临时服务器（推荐）
python3 -m http.server 8000

# 或使用 Node.js
npx serve .

# 然后在浏览器中访问 http://localhost:8000
```

## 参数说明

### 模型参数

| 参数名 | 符号 | 说明 | 示例值 |
|--------|------|------|--------|
| 模型名称 | modelName | 用户自定义模型名称 | Llama-2-7B |
| 总参数量 | N_total | 模型总参数数量 | 7e9 (70亿) |
| 注意力架构 | attentionArch | MHA/GQA/MQA | MHA |
| FFN架构 | ffnArch | Dense/MoE | Dense |
| 隐藏层维度 | H | Transformer隐藏层大小 | 4096 |
| Transformer层数 | L | 模型层数 | 32 |
| 注意力头数 | A | 注意力头数量 | 32 |
| KV头数 | A_kv | GQA/MQA时使用 | 32 |

### 硬件参数

| 参数名 | 符号 | 说明 | 示例值 |
|--------|------|------|--------|
| 服务器型号 | serverType | 用户自定义服务器型号 | H100-SXM5 |
| 单卡算力 | FLOPS_percard | 单GPU浮点运算能力 | 1e15 (1 PFLOPS) |
| 算力利用率 | U_compute | 实际算力使用比例 | 0.65 |
| 单卡显存 | M_card | 单GPU显存容量 | 80e9 (80GB) |
| 显存利用率 | U_memory | 实际显存使用比例 | 0.8 |
| 预留显存 | M_reserve | 系统预留显存 | 1e9 (1GB) |
| NVLink带宽 | BW_nvlink | 节点内高速带宽 | 900e9 (900GB/s) |
| 网络带宽 | BW_net | 节点间网络带宽 | 50e9 (50GB/s) |
| 跨节点部署 | is_cross_node | 是否跨多节点部署 | false |

### 业务参数

| 参数名 | 符号 | 说明 | 示例值 |
|--------|------|------|--------|
| 目标QPS | QPS_target | 期望的每秒查询次数 | 1 |
| QPS冗余系数 | QPS_redundancy | 预留的QPS冗余比例 | 0.3 (30%) |
| 输入序列长度 | S | 输入token数量 | 1024 |
| 输出序列长度 | s_out | 输出token数量 | 256 |
| Batch Size | B | 批次大小 | 1 |

## 公式概述

### 最终GPU数量计算公式

$$N_{gpu} = \max(N_{FLOPS-limit}, N_{CACHE-limit}, N_{BW-limit})$$

### 三维度约束

1. **算力维度 (FLOPs-limit)**:
   - Prefill FLOPs + Decode FLOPs
   - 考虑注意力架构 (MHA/GQA/MQA) 和 FFN架构 (Dense/MoE)

2. **显存维度 (CACHE-limit)**:
   - 模型权重 + 激活值 + KV Cache
   - 支持多种并行策略 (TP/PP/EP)

3. **带宽维度 (BW-limit)**:
   - 高频通信 (NVLink/HCCS): All-Reduce (TP), All-to-All (MoE/EP)
   - 低频通信 (PCIe/RDMA): PP激活值传输

## 浏览器兼容性

- Chrome (推荐)
- Firefox
- Edge
- Safari

**注意**: 需要支持 ES6 Modules 和现代 JavaScript API。
