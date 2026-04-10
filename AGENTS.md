# Repository Guidance

## Project Overview

**Chinese Name**: 智算资源（推理任务）申请合理性评估平台
**English Name**: Intelligent Computing Resource Assessment Platform for Inference Tasks
**Purpose**: Automated evaluation of resource application rationality for Decode-Only Transformer LLM inference

## Core Evaluation Logic

Three-dimensional constraint evaluation system (compute all three, take maximum):

1. **Compute Dimension (算力/FLOPs-limit)**
   - Prefill + Decode FOPs calculation
   - Architecture variants: MHA/GQA/MQA attention, Dense/MoE FFN
   - Formula location: `xuqiuV6.md` section 4.2.1

2. **Memory Dimension (显存/CACHE-limit)**
   - Model weights + activation + KV Cache
   - Parallel strategies: TP (tensor parallel), PP (pipeline parallel), TP+PP, EP (expert parallel)
   - Formula location: `xuqiuV6.md` section 4.2.2

3. **Bandwidth Dimension (带宽/BW-limit)**
   - High-frequency: NVLink/HCCS for All-Reduce (TP) and All-to-All (MoE/EP)
   - Low-frequency: PCIe/RDMA for PP activation transfer
   - Formula location: `xuqiuV6.md` section 4.2.3

Final GPU count: `N_gpu = max(N_FLOPS-limit, N_CACHE-limit, N_BW-limit)`


## Parameter Library Requirements

Maintain structured libraries for:

**Model Parameters** (auto-fill by model name):
- Total parameters, attention architecture (MHA/GQA/MQA)
- FFN architecture (Dense/MoE), active parameters (MoE)
- Hidden size, attention heads, layers, vocab size
- Precision (FP16/INT8/INT4/FP8)

**Hardware Parameters** (auto-fill by server model):
- Single-card FLOPs, memory capacity
- NVLink/HCCS bandwidth (intra-node)
- PCIe/RDMA bandwidth (inter-node)
- Utilization coefficients (compute ~0.6-0.7, memory ~0.7-0.8)

**Business Parameters**:
- Target QPS, sequence lengths, batch size
- QPS redundancy (default 0.3), parallel efficiency coefficients

## Formula System Requirements

- Configurable formulas with version control and rollback capability
- Syntax/logic validation before applying formula changes
- LaTeX preview for all formulas
- Auto-adaptation based on:
  - Attention: MHA (multi-head), GQA (grouped-query), MQA (multi-query)
  - FFN: Dense, MoE (expert count k, total experts E)
  - Parallel: TP (degree n_tp), PP (degree n_pp), EP (degree n_ep)

## Implementation Priorities

1. **Core Formulas**: Implement all formulas from `xuqiuV6.md` section 4 accurately
2. **Formula Adaptation**: Map (attention_arch, ffn_arch, parallel_strategy) to correct formula variants
3. **Parameter Libraries**: CRUD UI for model/hardware libraries
4. **Visualization**: Charts for compute/memory/bandwidth breakdown, intermediate results
5. **Persistence**: Application → formula → calculation → adjustment history chain
6. **PDF Export**: Complete traceability with formulas and results

## Formula Reference (xuqiuV6.md line numbers)

- Parameter definitions: lines 120-158
- Compute (FLOPs): lines 161-207
- Memory (weights + activation + KV Cache): lines 208-313
- Bandwidth (high/low frequency communication): lines 315-386
- Final evaluation: line 388-391

## Language Context

- Requirements documentation is in Chinese (`xuqiuV6.md`)
- Variable names and formulas use mathematical notation with Chinese descriptions
- Consider bilingual UI/labels if target users include Chinese speakers
