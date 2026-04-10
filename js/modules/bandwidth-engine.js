/**
 * Bandwidth Calculation Engine
 * Intelligent Computing Resource Assessment Platform
 * 
 * Computes Bandwidth requirements for LLM inference
 * Formulas based on xuqiuV6.md section 4.2.3
 */

// ==================== Constants ====================

const DEFAULT_PARAMS = {
    // Model parameters
    B: 1,                 // batch size
    S: 1024,              // input sequence length (s)
    s_out: 256,           // output sequence length
    H: 4096,              // hidden size
    L: 32,                // number of layers
    D_act: 2,             // activation dtype byte
    k: 2,                 // active experts (MoE)
    
    // Hardware parameters
    BW_nvlink: 900e9,     // NVLink/HCCS bandwidth (e.g., 900 GB/s for H100)
    BW_net: 50e9,         // PCIe/RDMA bandwidth (e.g., 50 GB/s for PCIe 4.0 x16)
    eta_nvlink: 0.8,      // NVLink efficiency (default 0.8)
    eta_net: 0.6,          // network efficiency (default 0.6)
    
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

// ==================== High-Frequency Communication ====================

/**
 * Calculate high-frequency communication (V_high) for Dense FFN with TP
 * Formula: V_high_dense = (L/n_pp) × 4 × S × H × D_act × (n_tp - 1) / n_tp
 */
export function calculateHighFreqDense(params) {
    const { L, n_pp, S, H, D_act, n_tp } = params;
    const layersPerStage = safeDivide(L, n_pp);
    const tpFactor = safeDivide(n_tp - 1, n_tp);
    return layersPerStage * 4 * S * H * D_act * tpFactor;
}

/**
 * Calculate high-frequency communication (V_high) for MoE FFN with TP+EP
 * Formula: V_high_moe = (L/n_pp) × 2 × S × H × D_act × [(n_tp-1)/n_tp + k(n_ep-1)/n_ep]
 */
export function calculateHighFreqMoE(params) {
    const { L, n_pp, S, H, D_act, n_tp, n_ep, k } = params;
    const layersPerStage = safeDivide(L, n_pp);
    const tpFactor = safeDivide(n_tp - 1, n_tp);
    const epFactor = safeDivide(k * (n_ep - 1), n_ep);
    return layersPerStage * 2 * S * H * D_act * (tpFactor + epFactor);
}

/**
 * Calculate high-frequency communication based on FFN architecture
 */
export function calculateHighFreq(params, ffnArch = 'Dense') {
    if (ffnArch === 'MoE') {
        return calculateHighFreqMoE(params);
    }
    return calculateHighFreqDense(params);
}

// ==================== Low-Frequency Communication ====================

/**
 * Calculate low-frequency communication (V_low) for PP stage boundary
 * Formula: V_low = 2 × S × H × D_act / n_tp
 */
export function calculateLowFreq(params) {
    const { S, H, D_act, n_tp } = params;
    return (2 * S * H * D_act) / n_tp;
}

// ==================== QPS Max Calculation ====================

/**
 * Calculate single GPU max QPS
 * Formula: QPS_max = min(BW_nvlink × η_nvlink / V_high, BW_net × η_net / V_low)
 */
export function calculateQPSMax(params, ffnArch = 'Dense') {
    const { BW_nvlink, eta_nvlink, BW_net, eta_net } = params;
    
    const V_high = calculateHighFreq(params, ffnArch);
    const V_low = calculateLowFreq(params);
    
    const qpsHighFreq = safeDivide(BW_nvlink * eta_nvlink, V_high);
    const qpsLowFreq = safeDivide(BW_net * eta_net, V_low);
    
    return {
        qpsHighFreq,
        qpsLowFreq,
        qpsMax: Math.min(qpsHighFreq, qpsLowFreq),
        V_high,
        V_low
    };
}

// ==================== BW-limit GPU Count ====================

/**
 * Calculate BW-limit GPU count
 * Formula: N_BW-limit = ceil(QPS_target / QPS_max) × single_replica_GPU_count
 * where single_replica_GPU_count = n_tp × n_pp
 */
export function calculateBWLimit(params, ffnArch = 'Dense') {
    const { QPS_target, QPS_redundancy, n_tp, n_pp } = params;
    
    const qpsResult = calculateQPSMax(params, ffnArch);
    const singleReplicaGPUCount = n_tp * n_pp;
    const Q = QPS_target * (1 + (QPS_redundancy || 0.3));
    
    const gpuCount = ceil(safeDivide(Q, qpsResult.qpsMax)) * singleReplicaGPUCount;
    
    return {
        qpsTarget: QPS_target,
        qpsWithRedundancy: Q,
        qpsMax: qpsResult.qpsMax,
        qpsHighFreq: qpsResult.qpsHighFreq,
        qpsLowFreq: qpsResult.qpsLowFreq,
        V_high: qpsResult.V_high,
        V_low: qpsResult.V_low,
        singleReplicaGPUCount,
        gpuCount: Math.max(1, gpuCount)
    };
}

// ==================== Main Calculation Functions ====================

/**
 * Calculate complete bandwidth breakdown
 * 
 * @param {Object} params - All parameters
 * @param {string} ffnArch - 'Dense' or 'MoE'
 * @returns {Object} Complete bandwidth calculation result
 */
export function calculate(params, ffnArch = 'Dense') {
    const mergedParams = { ...DEFAULT_PARAMS, ...params };
    
    const V_high = calculateHighFreq(mergedParams, ffnArch);
    const V_low = calculateLowFreq(mergedParams);
    const qpsMaxResult = calculateQPSMax(mergedParams, ffnArch);
    const bwLimit = calculateBWLimit(mergedParams, ffnArch);
    
    return {
        highFreq: V_high,
        lowFreq: V_low,
        qpsMax: qpsMaxResult,
        bwLimit,
        ffnArch
    };
}

// Export for module usage
export default {
    calculate,
    calculateHighFreq,
    calculateHighFreqDense,
    calculateHighFreqMoE,
    calculateLowFreq,
    calculateQPSMax,
    calculateBWLimit,
    DEFAULT_PARAMS
};
