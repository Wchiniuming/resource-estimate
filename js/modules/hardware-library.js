/**
 * Hardware Library - 硬件参数库
 * 预置主流AI服务器和GPU参数，支持自动填充
 */

/**
 * 服务器库数据结构
 * name: 服务器显示名称
 * gpu_model: GPU型号
 * FLOPS_percard: 单卡算力 (FLOPS)
 * M_card: 单卡显存 (bytes)
 * BW_nvlink: 卡间互联带宽 (NVLink/HCCS)
 * BW_net: 网络带宽 (PCIe/RDMA)
 */
const SERVER_LIBRARY = {
    // ========== NVIDIA HGX系列 ==========
    'HGX-H100': {
        name: 'NVIDIA HGX H100',
        shortName: 'HGX H100',
        gpu_model: 'H100 SXM5',
        FLOPS_percard: 1.979e15,  // 1979 TFLOPS (FP16/BF16)
        M_card: 80e9,  // 80 GB HBM3
        BW_nvlink: 900e9,  // 900 GB/s NVLink
        BW_net: 128e9,  // 128 GB/s InfiniBand
        n_gpu_per_node: 8,
        vendor: 'NVIDIA'
    },
    'HGX-A100': {
        name: 'NVIDIA HGX A100',
        shortName: 'HGX A100',
        gpu_model: 'A100 SXM4',
        FLOPS_percard: 0.624e15,  // 624 TFLOPS (FP16/BF16)
        M_card: 80e9,  // 80 GB HBM2e
        BW_nvlink: 600e9,  // 600 GB/s NVLink
        BW_net: 64e9,  // 64 GB/s InfiniBand
        n_gpu_per_node: 8,
        vendor: 'NVIDIA'
    },
    'HGX-H800': {
        name: 'NVIDIA HGX H800',
        shortName: 'HGX H800 (中国特供)',
        gpu_model: 'H800 SXM',
        FLOPS_percard: 1.513e15,  // 1513 TFLOPS (FP16, export restricted)
        M_card: 80e9,  // 80 GB HBM3
        BW_nvlink: 400e9,  // 400 GB/s NVLink (reduced)
        BW_net: 64e9,  // 64 GB/s
        n_gpu_per_node: 8,
        vendor: 'NVIDIA'
    },
    'HGX-A800': {
        name: 'NVIDIA HGX A800',
        shortName: 'HGX A800 (中国特供)',
        gpu_model: 'A800 SXM',
        FLOPS_percard: 0.624e15,  // 624 TFLOPS (FP16)
        M_card: 80e9,  // 80 GB HBM2e
        BW_nvlink: 400e9,  // 400 GB/s NVLink (reduced)
        BW_net: 64e9,
        n_gpu_per_node: 8,
        vendor: 'NVIDIA'
    },

    // ========== NVIDIA DGX系列 ==========
    'DGX-H100': {
        name: 'NVIDIA DGX H100',
        shortName: 'DGX H100',
        gpu_model: 'H100 NVLink',
        FLOPS_percard: 1.979e15,
        M_card: 80e9,
        BW_nvlink: 900e9,
        BW_net: 128e9,
        n_gpu_per_node: 8,
        vendor: 'NVIDIA'
    },
    'DGX-A100': {
        name: 'NVIDIA DGX A100',
        shortName: 'DGX A100',
        gpu_model: 'A100 NVLink',
        FLOPS_percard: 0.624e15,
        M_card: 80e9,
        BW_nvlink: 600e9,
        BW_net: 100e9,
        n_gpu_per_node: 8,
        vendor: 'NVIDIA'
    },

    // ========== 华为Atlas系列 ==========
    'Atlas-800T-A2': {
        name: '华为Atlas 800T A2',
        shortName: 'Atlas 800T A2',
        gpu_model: '昇腾910B',
        FLOPS_percard: 0.28e15,  // 280 TFLOPS (FP16)
        M_card: 64e9,  // 64 GB HBM2e
        BW_nvlink: 392e9,  // 392 GB/s HCCS
        BW_net: 64e9,  // 64 GB/s RoCE
        n_gpu_per_node: 8,
        vendor: 'Huawei'
    },
    'Atlas-800T-A2-32GB': {
        name: '华为Atlas 800T A2 (32GB)',
        shortName: 'Atlas 800T A2 32GB',
        gpu_model: '昇腾910B',
        FLOPS_percard: 0.256e15,  // 256 TFLOPS (FP16)
        M_card: 32e9,  // 32 GB HBM2e
        BW_nvlink: 392e9,
        BW_net: 64e9,
        n_gpu_per_node: 8,
        vendor: 'Huawei'
    },
    'Atlas-900': {
        name: '华为Atlas 900',
        shortName: 'Atlas 900',
        gpu_model: '昇腾910C',
        FLOPS_percard: 0.8e15,  // ~800 TFLOPS (FP16/BF16)
        M_card: 96e9,  // 96 GB HBM2e
        BW_nvlink: 450e9,  // HCCS
        BW_net: 100e9,
        n_gpu_per_node: 8,
        vendor: 'Huawei'
    },

    // ========== 寒武纪系列 ==========
    'MLU290-M5': {
        name: '寒武纪MLU290-M5',
        shortName: 'MLU290-M5',
        gpu_model: '思元290',
        FLOPS_percard: 0.256e15,  // 256 TFLOPS (FP16)
        M_card: 32e9,  // 32 GB HBM2
        BW_nvlink: 600e9,  // 600 GB/s MLU-Link
        BW_net: 64e9,  // PCIe 4.0
        n_gpu_per_node: 8,
        vendor: 'Cambricon'
    },
    'MLU370-X8': {
        name: '寒武纪MLU370-X8',
        shortName: 'MLU370-X8',
        gpu_model: '思元370',
        FLOPS_percard: 0.256e15,  // 256 TFLOPS (FP16)
        M_card: 48e9,  // 48 GB LPDDR5
        BW_nvlink: 200e9,  // 200 GB/s MLU-Link
        BW_net: 32e9,  // 32 GB/s PCIe
        n_gpu_per_node: 8,
        vendor: 'Cambricon'
    },
    'MLU370-X4': {
        name: '寒武纪MLU370-X4',
        shortName: 'MLU370-X4',
        gpu_model: '思元370',
        FLOPS_percard: 0.128e15,  // 128 TFLOPS (FP16)
        M_card: 24e9,  // 24 GB LPDDR5
        BW_nvlink: 200e9,
        BW_net: 32e9,
        n_gpu_per_node: 8,
        vendor: 'Cambricon'
    },
    'MLU370-S4': {
        name: '寒武纪MLU370-S4',
        shortName: 'MLU370-S4',
        gpu_model: '思元370',
        FLOPS_percard: 0.096e15,  // 96 TFLOPS (FP16)
        M_card: 24e9,  // 24 GB LPDDR5
        BW_nvlink: 0,  // 无卡间互联
        BW_net: 16e9,
        n_gpu_per_node: 8,
        vendor: 'Cambricon'
    },

    // ========== 海光系列 ==========
    'DCU-Z100': {
        name: '海光DCU Z100',
        shortName: 'DCU Z100',
        gpu_model: 'DCU Z100',
        FLOPS_percard: 0.28e15,  // 280 TFLOPS (FP16)
        M_card: 32e9,  // 32 GB HBM2
        BW_nvlink: 256e9,  // 256 GB/s XGMI
        BW_net: 32e9,  // 32 GB/s 网络
        n_gpu_per_node: 8,
        vendor: 'Hygon'
    },
    'DCU-Z100L': {
        name: '海光DCU Z100L',
        shortName: 'DCU Z100L',
        gpu_model: 'DCU Z100L',
        FLOPS_percard: 0.24e15,  // 240 TFLOPS (FP16)
        M_card: 32e9,  // 32 GB HBM2
        BW_nvlink: 256e9,
        BW_net: 32e9,
        n_gpu_per_node: 8,
        vendor: 'Hygon'
    },

    // ========== 摩尔线程 ==========
    'MTT-S4000': {
        name: '摩尔线程MTT S4000',
        shortName: 'MTT S4000',
        gpu_model: 'MTT S4000',
        FLOPS_percard: 0.1e15,  // 100 TFLOPS (FP16)
        M_card: 24e9,  // 24 GB GDDR6
        BW_nvlink: 128e9,  // 128 GB/s MTLink
        BW_net: 16e9,  // 16 GB/s 网络
        n_gpu_per_node: 8,
        vendor: 'MooreThreads'
    }
};

/**
 * 获取所有可用服务器列表
 * @returns {Array<{name: string, displayName: string}>}
 */
export function getServerList() {
    return Object.values(SERVER_LIBRARY).map(server => ({
        name: Object.keys(SERVER_LIBRARY).find(key => SERVER_LIBRARY[key] === server),
        displayName: `${server.name} (${server.gpu_model})`
    }));
}

/**
 * 获取指定服务器的完整参数
 * @param {string} serverName - 服务器名称
 * @returns {Object|null} 服务器参数对象
 */
export function getServer(serverName) {
    return SERVER_LIBRARY[serverName] || null;
}

/**
 * 填充服务器参数到状态管理器
 * @param {Object} stateManager - 状态管理器实例
 * @param {string} serverName - 服务器名称
 * @returns {boolean} 是否成功填充
 */
export function fillServerParams(stateManager, serverName) {
    const server = SERVER_LIBRARY[serverName];
    if (!server) {
        console.warn(`Server "${serverName}" not found in library`);
        return false;
    }

    const paramMapping = {
        'FLOPS_percard': server.FLOPS_percard,
        'M_card': server.M_card,
        'BW_nvlink': server.BW_nvlink,
        'BW_net': server.BW_net,
        'n_gpu_per_node': server.n_gpu_per_node,
        'serverType': server.name
    };

    Object.entries(paramMapping).forEach(([stateKey, value]) => {
        if (value !== undefined) {
            stateManager.setParam(stateKey, value);
        }
    });

    stateManager.setParam('U_compute', 0.65);
    stateManager.setParam('U_memory', 0.75);

    console.log(`Server "${serverName}" parameters filled successfully`);
    return true;
}

// 默认导出
export default {
    getServerList,
    getServer,
    fillServerParams
};
