/**
 * FLOPs Calculation Engine
 * Intelligent Computing Resource Assessment Platform
 * 
 * Computes FLOPs (Floating Point Operations) for LLM inference
 * Formulas based on xuqiuV6.md section 4.2.1
 */

// ==================== Constants ====================

const DEFAULT_PARAMS = {
    // Model parameters
    B: 1,              // batch size
    S: 1024,           // input sequence length (s)
    s_out: 256,        // output sequence length
    H: 4096,           // hidden size
    L: 32,             // number of layers
    A: 32,             // number of attention heads
    A_kv: 32,          // number of KV heads (for GQA/MQA)
    I: 11008,          // ffn intermediate size
    V: 32000,          // vocab size
    E: 8,              // number of experts (MoE)
    k: 2,              // active experts (MoE)
    d_ff: 1408,        // single expert FFN dimension (MoE)
    Q: 1.0,            // quantization coefficient (1.0=FP16, 2.0=INT8, 4.0=INT4, 0.5=FP8)
    D_kv: 2,           // KV cache dtype byte
    D_act: 2,          // activation dtype byte
    
    // Hardware parameters
    FLOPS_percard: 1e15,   // single card FLOPs (e.g., 1 PFlops = 1e15)
    U_compute: 0.65,       // compute utilization (default 0.65)
    epsilon: 0.9,          // parallel efficiency (0.85-0.95 single node, 0.75-0.85 cross-node)
    is_cross_node: false,  // true if cross-node, false if single-node
    
    // Business parameters
    QPS_target: 1,     // target QPS
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

// ==================== Prefill FLOPs ====================

/**
 * Calculate Prefill FLOPs for MHA + Dense
 * Formula: FLOPs_prefill = L×(8BSH²+4BS²H+4BSHI)+2BSHV
 */
export function calculatePrefillMHA_Dense(params) {
    const { B, S, H, L, I, V } = params;
    const S_total = S + (params.s_out || 0);
    
    const attention = L * (8 * B * S * H * H + 4 * B * S * S * H + 4 * B * S * H * I);
    const lm_head = 2 * B * S * V;
    
    return attention + lm_head;
}

/**
 * Calculate Prefill FLOPs for MHA + MoE
 * Formula: FLOPs_prefill = L×(8BSH²+4BS²H+BSHE+2BSkHd_ff)+2BSHV
 */
export function calculatePrefillMHA_MoE(params) {
    const { B, S, H, L, E, k, d_ff, V } = params;
    const S_total = S + (params.s_out || 0);
    
    const attention = L * (8 * B * S * H * H + 4 * B * S * S * H);
    const moe = L * (B * S * H * E + 2 * B * S * k * d_ff);
    const lm_head = 2 * B * S * V;
    
    return attention + moe + lm_head;
}

/**
 * Calculate Prefill FLOPs for GQA + Dense
 * Formula: FLOPs_prefill = L×(4BSH²+4BSHℎ₁+4BHS²+4BSHI)+2BSHV
 * Note: ℎ₁ = d_h = H / A for GQA where each group shares KV
 *       A_kv = number of KV heads = number of groups
 *       d_h = H / A (head dimension)
 *       For GQA: the attention computation is A_kv groups × each group processes A/A_kv heads
 */
export function calculatePrefillGQA_Dense(params) {
    const { B, S, H, L, A, A_kv, I, V } = params;
    const d_h = H / A;  // head dimension
    const S_total = S + (params.s_out || 0);
    
    // GQA: fewer KV heads, so compute is reduced
    // Q computation: A heads × S × H
    // K/V computation: A_kv heads × S × H (but replicated to A heads)
    // For GQA, the attention is computed per group, then expanded
    const attention = L * (
        4 * B * S * H * H +           // Q projections
        4 * B * S * H * d_h +         // K/V projections (per group)
        4 * B * H * S * S +           // attention scores
        4 * B * S * H * I             // FFN
    );
    const lm_head = 2 * B * S * V;
    
    return attention + lm_head;
}

/**
 * Calculate Prefill FLOPs for GQA + MoE
 * Formula: FLOPs_prefill = L×(4BSH²+4BSHℎ₁+4BHS²+BSHE+2BSkHd_ff)+2BSHV
 */
export function calculatePrefillGQA_MoE(params) {
    const { B, S, H, L, A, A_kv, I, E, k, d_ff, V } = params;
    const d_h = H / A;
    
    const attention = L * (
        4 * B * S * H * H +
        4 * B * S * H * d_h +
        4 * B * H * S * S +
        B * S * H * E +
        2 * B * S * k * d_ff
    );
    const lm_head = 2 * B * S * V;
    
    return attention + lm_head;
}

/**
 * Calculate Prefill FLOPs for MQA + Dense
 * Formula: Similar to GQA but A_kv = 1 (single KV head)
 */
export function calculatePrefillMQA_Dense(params) {
    const { B, S, H, L, A, I, V } = params;
    const d_h = H / A;
    
    // MQA: single KV head shared by all Q heads
    const attention = L * (
        4 * B * S * H * H +
        4 * B * S * H * d_h +
        4 * B * H * S * S +
        4 * B * S * H * I
    );
    const lm_head = 2 * B * S * V;
    
    return attention + lm_head;
}

/**
 * Calculate Prefill FLOPs for MQA + MoE
 */
export function calculatePrefillMQA_MoE(params) {
    const { B, S, H, L, A, I, E, k, d_ff, V } = params;
    const d_h = H / A;
    
    const attention = L * (
        4 * B * S * H * H +
        4 * B * S * H * d_h +
        4 * B * H * S * S +
        B * S * H * E +
        2 * B * S * k * d_ff
    );
    const lm_head = 2 * B * S * V;
    
    return attention + lm_head;
}

// ==================== Decode FLOPs ====================

/**
 * Calculate Decode FLOPs for MHA + Dense
 * Formula: FLOPs_decode = L×(8BH²+4BHT+4BHI)+2BHV
 * Note: T = total sequence length (s + s_out)
 */
export function calculateDecodeMHA_Dense(params) {
    const { B, S, s_out, H, L, I, V } = params;
    const T = S + s_out;
    
    const attention = L * (8 * B * H * H + 4 * B * H * T + 4 * B * H * I);
    const lm_head = 2 * B * H * V;
    
    return attention + lm_head;
}

/**
 * Calculate Decode FLOPs for MHA + MoE
 * Formula: FLOPs_decode = L×(8BH²+4BHT+BHE+2BkHd_ff)+2BHV
 */
export function calculateDecodeMHA_MoE(params) {
    const { B, S, s_out, H, L, E, k, d_ff, V } = params;
    const T = S + s_out;
    
    const attention = L * (8 * B * H * H + 4 * B * H * T);
    const moe = L * (B * H * E + 2 * B * k * d_ff);
    const lm_head = 2 * B * H * V;
    
    return attention + moe + lm_head;
}

/**
 * Calculate Decode FLOPs for GQA + Dense
 */
export function calculateDecodeGQA_Dense(params) {
    const { B, S, s_out, H, L, A, A_kv, I, V } = params;
    const T = S + s_out;
    const d_h = H / A;
    
    const attention = L * (
        4 * B * H * H +
        4 * B * H * d_h +
        4 * B * H * T +
        4 * B * H * I
    );
    const lm_head = 2 * B * H * V;
    
    return attention + lm_head;
}

/**
 * Calculate Decode FLOPs for GQA + MoE
 */
export function calculateDecodeGQA_MoE(params) {
    const { B, S, s_out, H, L, A, A_kv, I, E, k, d_ff, V } = params;
    const T = S + s_out;
    const d_h = H / A;
    
    const attention = L * (
        4 * B * H * H +
        4 * B * H * d_h +
        4 * B * H * T +
        B * H * E +
        2 * B * k * d_ff
    );
    const lm_head = 2 * B * H * V;
    
    return attention + lm_head;
}

/**
 * Calculate Decode FLOPs for MQA + Dense
 */
export function calculateDecodeMQA_Dense(params) {
    const { B, S, s_out, H, L, A, I, V } = params;
    const T = S + s_out;
    const d_h = H / A;
    
    const attention = L * (
        4 * B * H * H +
        4 * B * H * d_h +
        4 * B * H * T +
        4 * B * H * I
    );
    const lm_head = 2 * B * H * V;
    
    return attention + lm_head;
}

/**
 * Calculate Decode FLOPs for MQA + MoE
 */
export function calculateDecodeMQA_MoE(params) {
    const { B, S, s_out, H, L, A, I, E, k, d_ff, V } = params;
    const T = S + s_out;
    const d_h = H / A;
    
    const attention = L * (
        4 * B * H * H +
        4 * B * H * d_h +
        4 * B * H * T +
        B * H * E +
        2 * B * k * d_ff
    );
    const lm_head = 2 * B * H * V;
    
    return attention + lm_head;
}

// ==================== Main Calculation Functions ====================

/**
 * Calculate FLOPs per sample based on attention and FFN architecture
 * 
 * @param {Object} params - Model parameters
 * @param {string} attentionArch - 'MHA', 'GQA', or 'MQA'
 * @param {string} ffnArch - 'Dense' or 'MoE'
 * @returns {Object} FLOPs breakdown
 */
export function calculateFLOPsPerSample(params, attentionArch, ffnArch) {
    const prefillFuncs = {
        'MHA-Dense': calculatePrefillMHA_Dense,
        'MHA-MoE': calculatePrefillMHA_MoE,
        'GQA-Dense': calculatePrefillGQA_Dense,
        'GQA-MoE': calculatePrefillGQA_MoE,
        'MQA-Dense': calculatePrefillMQA_Dense,
        'MQA-MoE': calculatePrefillMQA_MoE
    };
    
    const decodeFuncs = {
        'MHA-Dense': calculateDecodeMHA_Dense,
        'MHA-MoE': calculateDecodeMHA_MoE,
        'GQA-Dense': calculateDecodeGQA_Dense,
        'GQA-MoE': calculateDecodeGQA_MoE,
        'MQA-Dense': calculateDecodeMQA_Dense,
        'MQA-MoE': calculateDecodeMQA_MoE
    };
    
    const key = `${attentionArch}-${ffnArch}`;
    const prefillFLOPs = prefillFuncs[key]?.(params) || 0;
    const decodeFLOPs = decodeFuncs[key]?.(params) || 0;
    
    // Apply quantization coefficient
    const Q = params.Q || 1.0;
    const totalFLOPs = (prefillFLOPs + decodeFLOPs) / Q;
    
    return {
        prefill: prefillFLOPs,
        decode: decodeFLOPs,
        total: totalFLOPs,
        quantizationFactor: Q
    };
}

/**
 * Calculate total FLOPs requirement based on QPS
 * 
 * @param {Object} params - All parameters including QPS
 * @param {string} attentionArch - 'MHA', 'GQA', or 'MQA'
 * @param {string} ffnArch - 'Dense' or 'MoE'
 * @returns {Object} Total FLOPs requirement
 */
export function calculateTotalFLOPs(params, attentionArch, ffnArch) {
    const flopsPerSample = calculateFLOPsPerSample(params, attentionArch, ffnArch);
    
    const QPS_target = params.QPS_target || 1;
    const e = params.QPS_redundancy || 0.3;
    
    const totalFLOPs = QPS_target * (1 + e) * flopsPerSample.total;
    
    return {
        flopsPerSample: flopsPerSample.total,
        QPS_target,
        redundancyFactor: 1 + e,
        totalFLOPs
    };
}

/**
 * Calculate FLOPs-limit GPU count
 * 
 * @param {Object} params - All parameters including hardware
 * @param {string} attentionArch - 'MHA', 'GQA', or 'MQA'
 * @param {string} ffnArch - 'Dense' or 'MoE'
 * @returns {Object} GPU count calculation result
 */
export function calculateFLOPsLimit(params, attentionArch, ffnArch) {
    const totalResult = calculateTotalFLOPs(params, attentionArch, ffnArch);
    
    const FLOPS_percard = params.FLOPS_percard || 1e15;
    const U_compute = params.U_compute || 0.65;
    const epsilon = params.epsilon || 0.9;
    const is_cross_node = params.is_cross_node || false;
    
    // θ = 1 for cross-node, 0 for single-node
    const theta = is_cross_node ? 1 : 0;
    
    const denominator = FLOPS_percard * U_compute * epsilon * (1 - theta * 0.1);
    const gpuCount = ceil(totalResult.totalFLOPs / denominator);
    
    return {
        totalFLOPsRequired: totalResult.totalFLOPs,
        flopsPerSample: totalResult.flopsPerSample,
        FLOPS_percard,
        U_compute,
        parallelEfficiency: epsilon,
        isCrossNode: is_cross_node,
        gpuCount: Math.max(1, gpuCount)
    };
}

/**
 * Convenience function: Calculate all FLOPs metrics
 * 
 * @param {Object} params - All parameters
 * @param {string} attentionArch - 'MHA', 'GQA', or 'MQA'
 * @param {string} ffnArch - 'Dense' or 'MoE'
 * @returns {Object} Complete FLOPs calculation result
 */
export function calculate(params, attentionArch = 'MHA', ffnArch = 'Dense') {
    const mergedParams = { ...DEFAULT_PARAMS, ...params };
    
    const perSample = calculateFLOPsPerSample(mergedParams, attentionArch, ffnArch);
    const total = calculateTotalFLOPs(mergedParams, attentionArch, ffnArch);
    const limit = calculateFLOPsLimit(mergedParams, attentionArch, ffnArch);
    
    return {
        perSample,
        total,
        limit,
        attentionArch,
        ffnArch
    };
}

// Export for module usage
export default {
    calculate,
    calculateFLOPsPerSample,
    calculateTotalFLOPs,
    calculateFLOPsLimit,
    DEFAULT_PARAMS
};