/**
 * Model Library - 模型参数库
 * 预置主流大模型参数，支持自动填充
 */

/**
 * 模型库数据结构
 * N_total: 总参数量 (B)
 * attention_arch: 注意力架构 (MHA/GQA/MQA)
 * H: 隐藏层维度
 * L: 层数
 * A: 注意力头数
 * A_kv: KV注意力头数 (MHA中=A, GQA中<A, MQA中=1)
 * I: FFN中间层维度
 * V: 词表大小
 * MoE参数 (可选): is_moe, num_experts, active_experts
 */
const MODEL_LIBRARY = {
    // ========== Qwen系列 ==========
    'Qwen-7B': {
        name: 'Qwen-7B',
        N_total: 7.7,
        attention_arch: 'MHA',
        H: 4096,
        L: 32,
        A: 32,
        A_kv: 32,
        I: 11008,
        V: 151936
    },
    'Qwen-14B': {
        name: 'Qwen-14B',
        N_total: 14.2,
        attention_arch: 'MHA',
        H: 5120,
        L: 40,
        A: 40,
        A_kv: 40,
        I: 13696,
        V: 152064
    },
    'Qwen-72B': {
        name: 'Qwen-72B',
        N_total: 72.7,
        attention_arch: 'MHA',
        H: 8192,
        L: 80,
        A: 64,
        A_kv: 64,
        I: 24576,
        V: 152064
    },

    // ========== Qwen2系列 ==========
    'Qwen2-7B': {
        name: 'Qwen2-7B',
        N_total: 7.6,
        attention_arch: 'GQA',
        H: 3584,
        L: 28,
        A: 28,
        A_kv: 4,
        I: 18944,
        V: 152064
    },
    'Qwen2-72B': {
        name: 'Qwen2-72B',
        N_total: 72.1,
        attention_arch: 'GQA',
        H: 8192,
        L: 80,
        A: 64,
        A_kv: 8,
        I: 29568,
        V: 152064
    },

    // ========== Llama系列 ==========
    'Llama-2-7B': {
        name: 'Llama-2-7B',
        N_total: 6.7,
        attention_arch: 'MHA',
        H: 4096,
        L: 32,
        A: 32,
        A_kv: 32,
        I: 11008,
        V: 32000
    },
    'Llama-2-70B': {
        name: 'Llama-2-70B',
        N_total: 68.9,
        attention_arch: 'GQA',
        H: 8192,
        L: 80,
        A: 64,
        A_kv: 8,
        I: 28672,
        V: 32000
    },
    'Llama-3-8B': {
        name: 'Llama-3-8B',
        N_total: 8.0,
        attention_arch: 'MHA',
        H: 4096,
        L: 32,
        A: 32,
        A_kv: 8,
        I: 14336,
        V: 128256
    },
    'Llama-3-70B': {
        name: 'Llama-3-70B',
        N_total: 70.0,
        attention_arch: 'GQA',
        H: 8192,
        L: 80,
        A: 64,
        A_kv: 8,
        I: 28672,
        V: 128256
    },

    // ========== Baichuan系列 ==========
    'Baichuan2-7B': {
        name: 'Baichuan2-7B',
        N_total: 7.0,
        attention_arch: 'MHA',
        H: 4096,
        L: 32,
        A: 32,
        A_kv: 32,
        I: 11008,
        V: 125696
    },
    'Baichuan2-13B': {
        name: 'Baichuan2-13B',
        N_total: 13.0,
        attention_arch: 'MHA',
        H: 5120,
        L: 40,
        A: 40,
        A_kv: 40,
        I: 13696,
        V: 125696
    },

    // ========== ChatGLM系列 ==========
    'ChatGLM3-6B': {
        name: 'ChatGLM3-6B',
        N_total: 6.2,
        attention_arch: 'MQA',
        H: 4096,
        L: 28,
        A: 1,
        A_kv: 1,
        I: 13696,
        V: 65024
    },
    'ChatGLM4-9B': {
        name: 'ChatGLM4-9B',
        N_total: 9.2,
        attention_arch: 'GQA',
        H: 4096,
        L: 40,
        A: 32,
        A_kv: 2,
        I: 13696,
        V: 151552
    },

    // ========== GLM系列 (Zhipu AI) ==========
    'GLM-4-9B': {
        name: 'GLM-4-9B',
        N_total: 9.0,
        attention_arch: 'GQA',
        H: 4096,
        L: 40,
        A: 32,
        A_kv: 4,
        I: 13696,
        V: 151552
    },
    'GLM-4-32B': {
        name: 'GLM-4-32B',
        N_total: 32.0,
        attention_arch: 'GQA',
        H: 6144,
        L: 56,
        A: 48,
        A_kv: 8,
        I: 20480,
        V: 151552
    },
    'GLM-4-128B': {
        name: 'GLM-4-128B',
        N_total: 128.0,
        attention_arch: 'GQA',
        H: 8192,
        L: 80,
        A: 64,
        A_kv: 8,
        I: 32768,
        V: 151552
    },
    'GLM-4V': {
        name: 'GLM-4V',
        N_total: 9.0,
        attention_arch: 'GQA',
        H: 4096,
        L: 40,
        A: 32,
        A_kv: 4,
        I: 13696,
        V: 151552
    },
    'GLMEdge-7B': {
        name: 'GLMEdge-7B',
        N_total: 7.0,
        attention_arch: 'GQA',
        H: 4096,
        L: 32,
        A: 32,
        A_kv: 4,
        I: 13696,
        V: 151552
    },
    'GLMEdge-14B': {
        name: 'GLMEdge-14B',
        N_total: 14.0,
        attention_arch: 'GQA',
        H: 5120,
        L: 40,
        A: 40,
        A_kv: 4,
        I: 19456,
        V: 151552
    },

    // ========== MoE模型 ==========
    'Mixtral-8x7B': {
        name: 'Mixtral-8x7B',
        N_total: 46.7,
        attention_arch: 'GQA',
        H: 4096,
        L: 32,
        A: 32,
        A_kv: 8,
        I: 14336,
        V: 32000,
        is_moe: true,
        num_experts: 8,
        active_experts: 2,
        expert_dim: 14336
    },

    // ========== Qwen3 Dense系列 (2025) ==========
    'Qwen3-0.6B': {
        name: 'Qwen3-0.6B',
        N_total: 0.6,
        attention_arch: 'GQA',
        H: 896,
        L: 28,
        A: 14,
        A_kv: 2,
        I: 2816,
        V: 151936
    },
    'Qwen3-1.7B': {
        name: 'Qwen3-1.7B',
        N_total: 1.7,
        attention_arch: 'GQA',
        H: 1536,
        L: 28,
        A: 12,
        A_kv: 2,
        I: 5632,
        V: 151936
    },
    'Qwen3-4B': {
        name: 'Qwen3-4B',
        N_total: 4.0,
        attention_arch: 'GQA',
        H: 2560,
        L: 36,
        A: 20,
        A_kv: 2,
        I: 10240,
        V: 151936
    },
    'Qwen3-8B': {
        name: 'Qwen3-8B',
        N_total: 8.0,
        attention_arch: 'GQA',
        H: 3584,
        L: 36,
        A: 28,
        A_kv: 4,
        I: 18944,
        V: 151936
    },
    'Qwen3-14B': {
        name: 'Qwen3-14B',
        N_total: 14.4,
        attention_arch: 'GQA',
        H: 4608,
        L: 40,
        A: 36,
        A_kv: 4,
        I: 22016,
        V: 151936
    },
    'Qwen3-32B': {
        name: 'Qwen3-32B',
        N_total: 32.1,
        attention_arch: 'GQA',
        H: 6144,
        L: 64,
        A: 48,
        A_kv: 8,
        I: 32768,
        V: 151936
    },
    'Qwen3-110B': {
        name: 'Qwen3-110B',
        N_total: 110.0,
        attention_arch: 'GQA',
        H: 8192,
        L: 80,
        A: 64,
        A_kv: 8,
        I: 40960,
        V: 151936
    },

    // ========== Qwen3 MoE系列 (2025) ==========
    'Qwen3-30B-A3B': {
        name: 'Qwen3-30B-A3B',
        N_total: 30.5,
        attention_arch: 'GQA',
        H: 2048,
        L: 48,
        A: 32,
        A_kv: 4,
        I: 6144,
        V: 151936,
        is_moe: true,
        num_experts: 128,
        active_experts: 8,
        d_ff: 768
    },
    'Qwen3-235B-A22B': {
        name: 'Qwen3-235B-A22B',
        N_total: 235.0,
        attention_arch: 'GQA',
        H: 3584,
        L: 94,
        A: 64,
        A_kv: 4,
        I: 12288,
        V: 151936,
        is_moe: true,
        num_experts: 128,
        active_experts: 8,
        d_ff: 1536
    },

    // ========== Kimi系列 (Moonshot AI) ==========
    'Kimi-V1-8B': {
        name: 'Kimi-V1-8B',
        N_total: 8.0,
        attention_arch: 'GQA',
        H: 3072,
        L: 32,
        A: 24,
        A_kv: 8,
        I: 12288,
        V: 200000
    },
    'Kimi-V1-32B': {
        name: 'Kimi-V1-32B',
        N_total: 32.0,
        attention_arch: 'GQA',
        H: 6144,
        L: 56,
        A: 48,
        A_kv: 8,
        I: 24576,
        V: 200000
    },
    'Kimi-V1-72B': {
        name: 'Kimi-V1-72B',
        N_total: 72.0,
        attention_arch: 'GQA',
        H: 8192,
        L: 80,
        A: 64,
        A_kv: 8,
        I: 32768,
        V: 200000
    },
    'Kimi-k2': {
        name: 'Kimi-k2',
        N_total: 56.0,
        attention_arch: 'GQA',
        H: 6144,
        L: 64,
        A: 48,
        A_kv: 8,
        I: 24576,
        V: 200000,
        is_moe: true,
        num_experts: 64,
        active_experts: 8,
        d_ff: 12288
    },

    // ========== Kimi Moonlight系列 (Moonshot AI MoE) ==========
    'Moonlight-16B-A3B': {
        name: 'Moonlight-16B-A3B',
        N_total: 16.0,
        attention_arch: 'MHA',
        H: 2048,
        L: 24,
        A: 16,
        A_kv: 16,
        I: 5632,
        V: 151936,
        is_moe: true,
        num_experts: 384,
        active_experts: 8,
        d_ff: 2048
    },

    // ========== MiniMax系列 ==========
    'MiniMax-M2': {
        name: 'MiniMax-M2',
        N_total: 229.0,
        attention_arch: 'GQA',
        H: 4096,
        L: 32,
        A: 32,
        A_kv: 8,
        I: 14336,
        V: 200000,
        is_moe: true,
        num_experts: 8,
        active_experts: 2,
        d_ff: 14336
    },
    'MiniMax-M2.5': {
        name: 'MiniMax-M2.5',
        N_total: 230.0,
        attention_arch: 'GQA',
        H: 4096,
        L: 32,
        A: 32,
        A_kv: 8,
        I: 14336,
        V: 200000,
        is_moe: true,
        num_experts: 8,
        active_experts: 2,
        d_ff: 14336
    },
    'MiniMax-Text-01': {
        name: 'MiniMax-Text-01',
        N_total: 456.0,
        attention_arch: 'GQA',
        H: 6144,
        L: 80,
        A: 64,
        A_kv: 8,
        I: 9216,
        V: 200000,
        is_moe: true,
        num_experts: 32,
        active_experts: 2,
        d_ff: 9216
    },
    'MiniMax-Echo': {
        name: 'MiniMax-Echo',
        N_total: 7.0,
        attention_arch: 'GQA',
        H: 4096,
        L: 28,
        A: 32,
        A_kv: 4,
        I: 14336,
        V: 200000
    },
    'MiniMax-Text-01-RC': {
        name: 'MiniMax-Text-01-RC',
        N_total: 456.0,
        attention_arch: 'GQA',
        H: 6144,
        L: 80,
        A: 64,
        A_kv: 8,
        I: 9216,
        V: 200000,
        is_moe: true,
        num_experts: 32,
        active_experts: 2,
        d_ff: 9216
    }
};

/**
 * 获取所有可用模型列表
 * @returns {Array<{name: string, displayName: string}>}
 */
export function getModelList() {
    return Object.values(MODEL_LIBRARY).map(model => ({
        name: model.name,
        displayName: `${model.name} (${model.N_total}B, ${model.attention_arch})`
    }));
}

/**
 * 获取指定模型的完整参数
 * @param {string} modelName - 模型名称
 * @returns {Object|null} 模型参数对象
 */
export function getModel(modelName) {
    return MODEL_LIBRARY[modelName] || null;
}

/**
 * 填充模型参数到状态管理器
 * @param {Object} stateManager - 状态管理器实例
 * @param {string} modelName - 模型名称
 * @returns {boolean} 是否成功填充
 */
export function fillModelParams(stateManager, modelName) {
    const model = MODEL_LIBRARY[modelName];
    if (!model) {
        console.warn(`Model "${modelName}" not found in library`);
        return false;
    }

    const paramMapping = {
        'N_total': model.N_total * 1e9,
        'V': model.V,
        'L': model.L,
        'H': model.H,
        'A': model.A,
        'A_kv': model.A_kv,
        'I': model.I,
        'attentionArch': model.attention_arch,
        'ffnArch': model.is_moe ? 'MoE' : 'Dense'
    };

    Object.entries(paramMapping).forEach(([stateKey, value]) => {
        if (value !== undefined) {
            stateManager.setParam(stateKey, value);
        }
    });

    if (model.is_moe) {
        stateManager.setParam('E', model.num_experts);
        stateManager.setParam('k', model.active_experts);
        stateManager.setParam('d_ff', model.d_ff || model.I);
        stateManager.setParam('N_total_act', model.active_experts * (model.d_ff || model.I) * 2 * model.L / 1e9);
    }

    stateManager.setParam('modelName', model.name);
    console.log(`Model "${modelName}" parameters filled successfully`);
    return true;
}

// 默认导出
export default {
    getModelList,
    getModel,
    fillModelParams
};
