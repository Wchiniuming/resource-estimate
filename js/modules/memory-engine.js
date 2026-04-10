/**
 * Memory Calculation Engine
 * Intelligent Computing Resource Assessment Platform
 * 
 * Computes Memory requirements for LLM inference
 * Formulas based on xuqiuV6.md section 4.2.2
 */

// ==================== Constants ====================

const DEFAULT_PARAMS = {
    // Model parameters
    N_total: 7e9,         // total model parameters
    D: 2,                 // precision bytes (2=FP16, 1=INT8, 0.5=INT4, 1=FP8)
    D_kv: 2,              // KV cache dtype byte
    D_act: 2,             // activation dtype byte
    B: 1,                 // batch size
    S: 1024,              // input sequence length (s)
    s_out: 256,           // output sequence length
    H: 4096,              // hidden size
    L: 32,                // number of layers
    A: 32,                // number of attention heads
    A_kv: 32,             // number of KV heads (for GQA/MQA)
    ffnArch: 'Dense',     // 'Dense' or 'MoE'
    N_total_act: 7e9,     // active parameters (MoE)
    E: 8,                 // number of experts (MoE)
    k: 2,                 // active experts (MoE)
    
    // Hardware parameters
    M_card: 80e9,         // single card memory (e.g., 80GB = 80e9 bytes)
    U_memory: 0.8,        // memory utilization (default 0.8)
    M_reserve: 1e9,       // reserved memory (default 1GB)
    
    // Parallel parameters
    n_tp: 1,              // tensor parallel degree
    n_pp: 1,              // pipeline parallel degree
    n_ep: 1,              // expert parallel degree
    
    // Business parameters
    QPS_target: 1,        // target QPS
    QPS_redundancy: 0.3   // QPS redundancy (default 0.3)
};

// ==================== Helper Functions ====================

/**
 * Safe ceiling function
 */
function ceil(x) {
    if (!isFinite(x) || isNaN(x)) return 0;
    return Math.ceil(x);
}

/**
 * Safe division with epsilon check
 */
function safeDivide(numerator, denominator, epsilon = 1e-10) {
    if (Math.abs(denominator) < epsilon) return 0;
    return numerator / denominator;
}

// ==================== Model Weight Memory ====================

/**
 * Calculate model weight memory (M_model)
 * Formula: M_model = N_total × D
 */
export function calculateModelWeight(params) {
    const { N_total, D } = params;
    return N_total * D;
}

// ==================== Activation Memory ====================

/**
 * Calculate activation memory for Dense FFN
 * Formula: M_act = B×(s+s_out)×H×L×D_act
 */
export function calculateActivationDense(params) {
    const { B, S, s_out, H, L, D_act } = params;
    const S_total = S + s_out;
    return B * S_total * H * L * D_act;
}

/**
 * Calculate activation memory for MoE FFN
 * Formula: M_act = B×(s+s_out)×H×L×D_act × (N_total_act / N_total)
 */
export function calculateActivationMoE(params) {
    const { B, S, s_out, H, L, D_act, N_total_act, N_total } = params;
    const S_total = S + s_out;
    const moeRatio = safeDivide(N_total_act, N_total);
    return B * S_total * H * L * D_act * moeRatio;
}

/**
 * Calculate activation memory based on FFN architecture
 */
export function calculateActivation(params, ffnArch = 'Dense') {
    if (ffnArch === 'MoE') {
        return calculateActivationMoE(params);
    }
    return calculateActivationDense(params);
}

// ==================== KV Cache Memory ====================

/**
 * Calculate single token KV Cache for MHA
 * Formula: 单token = 2×L×H×D_kv (since A_kv = A, d_h = H/A, 2×L×A×d_h×D_kv = 2×L×H×D_kv)
 */
export function calculateKVTokenMHA(params) {
    const { L, H, D_kv } = params;
    return 2 * L * H * D_kv;
}

/**
 * Calculate single token KV Cache for GQA
 * Formula: 单token = 2×L×A_kv×d_h×D_kv, where d_h = H/A
 */
export function calculateKVTokenGQA(params) {
    const { L, A, A_kv, H, D_kv } = params;
    const d_h = H / A;
    return 2 * L * A_kv * d_h * D_kv;
}

/**
 * Calculate single token KV Cache for MQA
 * Formula: 单token = 2×L×d_h×D_kv (A_kv = 1), where d_h = H/A
 */
export function calculateKVTokenMQA(params) {
    const { L, A, H, D_kv } = params;
    const d_h = H / A;
    return 2 * L * d_h * D_kv;
}

/**
 * Calculate single token KV Cache based on attention architecture
 */
export function calculateKVToken(params, attentionArch = 'MHA') {
    switch (attentionArch) {
        case 'GQA':
            return calculateKVTokenGQA(params);
        case 'MQA':
            return calculateKVTokenMQA(params);
        case 'MHA':
        default:
            return calculateKVTokenMHA(params);
    }
}

/**
 * Calculate KV Cache for single request
 * Formula: M_kv_single = 单tokenKV显存 × (s + s_out)
 */
export function calculateKVSingleRequest(params, attentionArch = 'MHA') {
    const { S, s_out } = params;
    const kvToken = calculateKVToken(params, attentionArch);
    const S_total = S + s_out;
    return kvToken * S_total;
}

/**
 * Calculate total KV Cache for target QPS
 * Formula: M_kv = QPS_target × M_kv_single
 */
export function calculateKVTotal(params, attentionArch = 'MHA') {
    const { QPS_target, QPS_redundancy } = params;
    const kvSingle = calculateKVSingleRequest(params, attentionArch);
    const Q = QPS_target * (1 + (QPS_redundancy || 0.3));
    return Q * kvSingle;
}

// ==================== Per-GPU Memory Calculation ====================

/**
 * Calculate per-GPU memory distribution based on parallel strategy
 * 
 * @param {Object} params - All parameters
 * @param {number} totalModelWeight - Total model weight memory
 * @param {number} totalActivation - Total activation memory
 * @param {number} totalKV - Total KV cache memory
 * @returns {Object} Per-GPU memory breakdown
 */
export function calculatePerGPUMemory(params, totalModelWeight, totalActivation, totalKV) {
    const { n_tp, n_pp, n_ep } = params;
    const N_parallel = n_tp * n_pp;
    
    // Per-GPU model weights: divided by parallel degree
    const modelPerGPU = safeDivide(totalModelWeight, N_parallel);
    
    // Per-GPU activation: divided by parallel degree
    const activationPerGPU = safeDivide(totalActivation, N_parallel);
    
    // KV cache is typically not divided by parallel degree (handled per request)
    // But for the total memory calculation, we need to consider the QPS×M_kv_single part
    return {
        modelWeight: modelPerGPU,
        activation: activationPerGPU,
        totalKV: totalKV,
        parallelDegree: N_parallel,
        n_tp,
        n_pp,
        n_ep
    };
}

// ==================== CACHE-limit GPU Count ====================

/**
 * Calculate CACHE-limit GPU count
 * Formula: N_CACHE-limit = ceil((QPS×M_kv_single + M_model + M_act) / (M_card×U_memory - M_reserve))
 * 
 * @param {Object} params - All parameters
 * @param {string} attentionArch - 'MHA', 'GQA', or 'MQA'
 * @param {string} ffnArch - 'Dense' or 'MoE'
 * @returns {Object} CACHE-limit calculation result
 */
export function calculateCACHELimit(params, attentionArch = 'MHA', ffnArch = 'Dense') {
    const { M_card, U_memory, M_reserve, n_tp, n_pp, QPS_target, QPS_redundancy } = params;
    
    // Calculate all memory components
    const M_model = calculateModelWeight(params);
    const M_act = calculateActivation(params, ffnArch);
    const M_kv_single = calculateKVSingleRequest(params, attentionArch);
    
    // Calculate total memory needed with redundancy
    const Q = QPS_target * (1 + (QPS_redundancy || 0.3));
    const totalMemoryNeeded = Q * M_kv_single + M_model + M_act;
    
    // Calculate available memory per GPU
    const availablePerGPU = M_card * U_memory - M_reserve;
    
    // Parallel degree
    const N_parallel = n_tp * n_pp;
    
    // Adjust for parallel strategy
    // For parallel strategies, the model weights and activations are divided
    // but the KV cache per request remains the same (since each request is processed in parallel)
    const adjustedModel = safeDivide(M_model, N_parallel);
    const adjustedActivation = safeDivide(M_act, N_parallel);
    const adjustedMemoryNeeded = Q * M_kv_single + adjustedModel + adjustedActivation;
    
    // Calculate GPU count
    const gpuCount = ceil(safeDivide(adjustedMemoryNeeded, availablePerGPU));
    
    // For single GPU verification
    const singleGPUMemoryAvailable = M_card * U_memory - M_reserve;
    const singleGPUMemoryNeeded = Q * M_kv_single + M_model + M_act;
    const singleGPUFeasible = singleGPUMemoryNeeded <= singleGPUMemoryAvailable;
    
    return {
        modelWeight: M_model,
        activation: M_act,
        kvSingleRequest: M_kv_single,
        totalKVWithQPS: Q * M_kv_single,
        totalMemoryNeeded,
        availablePerGPU,
        parallelDegree: N_parallel,
        adjustedModelWeight: adjustedModel,
        adjustedActivation: adjustedActivation,
        adjustedMemoryNeeded,
        singleGPUFeasible,
        gpuCount: Math.max(1, gpuCount)
    };
}

// ==================== Main Calculation Functions ====================

/**
 * Calculate complete memory breakdown
 * 
 * @param {Object} params - All parameters
 * @param {string} attentionArch - 'MHA', 'GQA', or 'MQA'
 * @param {string} ffnArch - 'Dense' or 'MoE'
 * @returns {Object} Complete memory calculation result
 */
export function calculate(params, attentionArch = 'MHA', ffnArch = 'Dense') {
    const mergedParams = { ...DEFAULT_PARAMS, ...params };
    
    const modelWeight = calculateModelWeight(mergedParams);
    const activation = calculateActivation(mergedParams, ffnArch);
    const kvToken = calculateKVToken(mergedParams, attentionArch);
    const kvSingleRequest = calculateKVSingleRequest(mergedParams, attentionArch);
    const kvTotal = calculateKVTotal(mergedParams, attentionArch);
    const cacheLimit = calculateCACHELimit(mergedParams, attentionArch, ffnArch);
    
    return {
        modelWeight,
        activation,
        kv: {
            perToken: kvToken,
            perRequest: kvSingleRequest,
            totalWithQPS: kvTotal
        },
        cacheLimit,
        attentionArch,
        ffnArch
    };
}

// Export for module usage
export default {
    calculate,
    calculateModelWeight,
    calculateActivation,
    calculateActivationDense,
    calculateActivationMoE,
    calculateKVToken,
    calculateKVTokenMHA,
    calculateKVTokenGQA,
    calculateKVTokenMQA,
    calculateKVSingleRequest,
    calculateKVTotal,
    calculateCACHELimit,
    DEFAULT_PARAMS
};
