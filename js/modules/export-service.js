/**
 * Export Service Module
 * Intelligent Computing Resource Assessment Platform
 * 
 * Generates DOCX export files with calculation results
 */

const { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, AlignmentType, TextRun } = docx;

// ==================== Parameter Groups ====================

const PARAM_GROUPS = {
    model: {
        title: '模型参数',
        params: [
            { key: 'modelName', label: '模型名称', format: 'string' },
            { key: 'N_total', label: '总参数量', format: 'number', unit: '' },
            { key: 'attentionArch', label: '注意力架构', format: 'string' },
            { key: 'ffnArch', label: 'FFN架构', format: 'string' },
            { key: 'H', label: '隐藏层维度', format: 'number', unit: '' },
            { key: 'L', label: '层数', format: 'number', unit: '' },
            { key: 'A', label: '注意力头数', format: 'number', unit: '' },
            { key: 'A_kv', label: 'KV头数', format: 'number', unit: '' },
            { key: 'd_h', label: '注意力头维度', format: 'number', unit: '' },
            { key: 'I', label: 'FFN中间层维度', format: 'number', unit: '' },
            { key: 'V', label: '词表大小', format: 'number', unit: '' },
            { key: 'D', label: '权重精度', format: 'string' },
            { key: 'N_total_act', label: '激活参数量', format: 'number', unit: '' },
            { key: 'E', label: '专家数量', format: 'number', unit: '' },
            { key: 'k', label: '激活专家数', format: 'number', unit: '' },
            { key: 'd_ff', label: '单专家维度', format: 'number', unit: '' }
        ]
    },
    server: {
        title: '服务器参数',
        params: [
            { key: 'serverType', label: '服务器型号', format: 'string' },
            { key: 'FLOPS_percard', label: '单卡算力', format: 'number', unit: 'FLOPs' },
            { key: 'U_compute', label: '算力利用率', format: 'percent' },
            { key: 'M_card', label: '单卡显存', format: 'number', unit: 'B' },
            { key: 'U_memory', label: '显存利用率', format: 'percent' },
            { key: 'M_reserve', label: '预留显存', format: 'number', unit: 'B' },
            { key: 'BW_nvlink', label: 'NVLink带宽', format: 'number', unit: 'B/s' },
            { key: 'BW_net', label: '网络带宽', format: 'number', unit: 'B/s' },
            { key: 'n_gpu_per_node', label: '每节点GPU数', format: 'number', unit: '' },
            { key: 'is_cross_node', label: '跨节点部署', format: 'boolean' },
            { key: 'eta_nvlink', label: 'NVLink效率', format: 'percent' },
            { key: 'eta_net', label: '网络效率', format: 'percent' },
            { key: 'epsilon', label: '并行效率', format: 'percent' },
            { key: 'n_tp', label: 'TP并行度', format: 'number', unit: '' },
            { key: 'n_pp', label: 'PP并行度', format: 'number', unit: '' },
            { key: 'n_ep', label: 'EP并行度', format: 'number', unit: '' }
        ]
    },
    business: {
        title: '业务参数',
        params: [
            { key: 'QPS_target', label: '目标QPS', format: 'number', unit: 'QPS' },
            { key: 'QPS_redundancy', label: 'QPS冗余系数', format: 'percent' },
            { key: 'S', label: '输入序列长度', format: 'number', unit: 'tokens' },
            { key: 's_out', label: '输出序列长度', format: 'number', unit: 'tokens' },
            { key: 'B', label: '批次大小', format: 'number', unit: '' },
            { key: 'Q', label: '量化系数', format: 'string' }
        ]
    }
};

// ==================== Number Formatting ====================

function formatNumber(value, format = 'number', unit = '') {
    if (value === null || value === undefined || value === '') return '-';
    
    if (format === 'string') return String(value);
    if (format === 'boolean') return value ? '是' : '否';
    if (format === 'percent') return (Number(value) * 100).toFixed(1) + '%';
    
    let num = Number(value);
    if (!isFinite(num)) return String(value);
    
    let suffix = '';
    let displayUnit = unit;
    
    if (unit === 'B') {
        if (Math.abs(num) >= 1e12) {
            num /= 1e12;
            suffix = 'T';
        } else if (Math.abs(num) >= 1e9) {
            num /= 1e9;
            suffix = 'G';
        } else if (Math.abs(num) >= 1e6) {
            num /= 1e6;
            suffix = 'M';
        }
        displayUnit = suffix + 'B';
    } else if (unit === 'FLOPs') {
        if (Math.abs(num) >= 1e15) {
            num /= 1e15;
            suffix = 'P';
        } else if (Math.abs(num) >= 1e12) {
            num /= 1e12;
            suffix = 'T';
        } else if (Math.abs(num) >= 1e9) {
            num /= 1e9;
            suffix = 'G';
        }
        displayUnit = suffix + 'FLOPs';
    } else if (unit === 'B/s') {
        if (Math.abs(num) >= 1e12) {
            num /= 1e12;
            suffix = 'T';
        } else if (Math.abs(num) >= 1e9) {
            num /= 1e9;
            suffix = 'G';
        } else if (Math.abs(num) >= 1e6) {
            num /= 1e6;
            suffix = 'M';
        }
        displayUnit = suffix + 'B/s';
    } else if (format === 'number' && Math.abs(num) >= 1e6) {
        if (Math.abs(num) >= 1e12) {
            num /= 1e12;
            suffix = 'T';
        } else if (Math.abs(num) >= 1e9) {
            num /= 1e9;
            suffix = 'G';
        } else if (Math.abs(num) >= 1e6) {
            num /= 1e6;
            suffix = 'M';
        }
    }
    
    const formatted = num % 1 === 0 ? num.toString() : num.toFixed(2);
    return displayUnit ? `${formatted} ${displayUnit}` : formatted;
}



// ==================== Formula Text Rendering ====================

function getFormulaText(attentionArch, ffnArch) {
    const archKey = `${attentionArch}_${ffnArch}`;
    
    const formulas = {
        flops: {
            prefill: {
                'MHA_Dense': 'FLOPs_prefill = L × (8×B×S×H² + 4×B×S²×H + 4×B×S×H×I) + 2×B×S×V',
                'MHA_MoE': 'FLOPs_prefill = L x (8xBxSxH^2 + 4xBxS^2xH + BxSxHxE + 2xBxSxkxd_ff) + 2xBxSxV',
                'GQA_Dense': 'FLOPs_prefill = L × (4×B×S×H² + 4×B×S×H×d_h + 4×B×H×S² + 4×B×S×H×I) + 2×B×S×V',
                'GQA_MoE': 'FLOPs_prefill = L × (4×B×S×H² + 4×B×S×H×d_h + 4×B×H×S² + B×S×H×E + 2×B×S×k×d_ff) + 2×B×S×V',
                'MQA_Dense': 'FLOPs_prefill = L × (2×B×S×H² + 2×B×S×H×d_h + 4×B×H×S² + 4×B×S×H×I) + 2×B×S×V',
                'MQA_MoE': 'FLOPs_prefill = L × (2×B×S×H² + 2×B×S×H×d_h + 4×B×H×S² + B×S×H×E + 2×B×S×k×d_ff) + 2×B×S×V'
            },
            decode: {
                'MHA_Dense': 'FLOPs_decode = L × (8×B×H² + 4×B×H×T + 4×B×H×I) + 2×B×H×V',
                'MHA_MoE': 'FLOPs_decode = L × (8×B×H² + 4×B×H×T + B×H×E + 2×B×k×d_ff) + 2×B×H×V',
                'GQA_Dense': 'FLOPs_decode = L × (4×B×H² + 4×B×H×d_h + 4×B×H×T + 4×B×H×I) + 2×B×H×V',
                'GQA_MoE': 'FLOPs_decode = L × (4×B×H² + 4×B×H×d_h + 4×B×H×T + B×H×E + 2×B×k×d_ff) + 2×B×H×V',
                'MQA_Dense': 'FLOPs_decode = L × (2×B×H² + 2×B×H×d_h + 4×B×H×T + 4×B×H×I) + 2×B×H×V',
                'MQA_MoE': 'FLOPs_decode = L × (2×B×H² + 2×B×H×d_h + 4×B×H×T + B×H×E + 2×B×k×d_ff) + 2×B×H×V'
            }
        },
        memory: {
            modelWeight: 'M_model = N_total × D',
            activation: {
                'Dense': 'M_act = B × T × H × L × D_act',
                'MoE': 'M_act = B × T × H × L × D_act × (N_total_act / N_total)'
            },
            kvCache: {
                'MHA': 'M_kv = 2 × L × H × D_kv × T',
                'GQA': 'M_kv = 2 × L × A_kv × d_h × D_kv × T',
                'MQA': 'M_kv = 2 × L × d_h × D_kv × T'
            }
        },
        bandwidth: {
            highFreq: {
                'Dense': 'V_high = (L/n_pp) × 4 × S × H × D_act × (n_tp-1)/n_tp',
                'MoE': 'V_high = (L/n_pp) × 2 × S × H × D_act × [(n_tp-1)/n_tp + k×(n_ep-1)/n_ep]'
            },
            lowFreq: 'V_low = 2 × S × H × D_act / n_tp'
        }
    };
    
    return {
        flops: formulas.flops,
        memory: formulas.memory,
        bandwidth: formulas.bandwidth
    };
}

// ==================== Filter Parameters by Architecture ====================

function shouldIncludeParam(key, params, group) {
    if (group === 'model') {
        const ffnArch = params.ffnArch || 'Dense';
        const attentionArch = params.attentionArch || 'MHA';
        
        if (ffnArch === 'Dense') {
            if (['E', 'k', 'd_ff'].includes(key)) return false;
        }
        
        if (attentionArch === 'MHA') {
            if (['A_kv', 'd_h'].includes(key)) return false;
        } else if (attentionArch === 'MQA') {
            if (['A_kv'].includes(key)) return false;
        }
    }
    else if (group === 'server') {
        if (!params.is_cross_node) {
            if (['BW_net', 'eta_net'].includes(key)) return false;
        }
    }
    
    return true;
}

export async function exportCalculationResults(params, results) {
    if (!params || !results) {
        throw new Error('参数或结果为空');
    }
    
    const children = [];
    
    children.push(new Paragraph({
        children: [new TextRun({
            text: '智算资源评估报告',
            bold: true,
            size: 48
        })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
    }));
    
    children.push(new Paragraph({
        children: [new TextRun({
            text: `生成时间: ${new Date().toLocaleString('zh-CN')}`,
            italic: true,
            size: 20
        })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 }
    }));
    
    const modelParams = Object.entries(params)
        .filter(([key]) => PARAM_GROUPS.model.params.find(p => p.key === key))
        .filter(([key]) => shouldIncludeParam(key, params, 'model'))
        .map(([key, value]) => ({ key, value }));
    
    children.push(new Paragraph({
        children: [new TextRun({ text: '一、模型参数', bold: true, size: 28 })],
        spacing: { before: 400, after: 200 }
    }));
    children.push(new Table({ rows: createParameterTableRows(modelParams, 'model'), width: { size: 100, type: WidthType.PERCENTAGE } }));
    
    const serverParams = Object.entries(params)
        .filter(([key]) => PARAM_GROUPS.server.params.find(p => p.key === key))
        .filter(([key]) => shouldIncludeParam(key, params, 'server'))
        .map(([key, value]) => ({ key, value }));
    
    children.push(new Paragraph({
        children: [new TextRun({ text: '二、服务器参数', bold: true, size: 28 })],
        spacing: { before: 400, after: 200 }
    }));
    children.push(new Table({ rows: createParameterTableRows(serverParams, 'server'), width: { size: 100, type: WidthType.PERCENTAGE } }));
    
    const businessParams = Object.entries(params)
        .filter(([key]) => PARAM_GROUPS.business.params.find(p => p.key === key))
        .map(([key, value]) => ({ key, value }));
    
    children.push(new Paragraph({
        children: [new TextRun({ text: '三、业务参数', bold: true, size: 28 })],
        spacing: { before: 400, after: 200 }
    }));
    children.push(new Table({ rows: createParameterTableRows(businessParams, 'business'), width: { size: 100, type: WidthType.PERCENTAGE } }));
    
    if (results.isValid) {
        const { attentionArch, ffnArch } = results.config || { attentionArch: 'MHA', ffnArch: 'Dense' };
        const formulas = getFormulaText(attentionArch, ffnArch);
        
children.push(new Paragraph({
        children: [new TextRun({ text: '四、计算公式及结果', bold: true, size: 28 })],
        spacing: { before: 400, after: 200 }
    }));
    
    children.push(new Paragraph({
        children: [new TextRun({ text: '4.1 算力维度 (FLOPs-limit)', bold: true, size: 24 })],
        spacing: { before: 200, after: 100 }
    }));
    
    if (results.flops) {
        children.push(new Paragraph({
            children: [new TextRun({
                text: `公式: ${formulas.flops.prefill[attentionArch + '_' + ffnArch] || formulas.flops.prefill['MHA_Dense']}`
            })],
            spacing: { after: 100 }
        }));
        children.push(new Paragraph({
            children: [new TextRun({
                text: `Prefill FLOPs: ${formatNumber(results.flops.perSample?.prefill)}`
            })]
        }));
        children.push(new Paragraph({
            children: [new TextRun({
                text: `Decode FLOPs: ${formatNumber(results.flops.perSample?.decode)}`
            })]
        }));
        children.push(new Paragraph({
            children: [new TextRun({
                text: `GPU数量: ${results.flops.limit?.gpuCount || 0}`
            })],
            spacing: { after: 200 }
        }));
    }
    
    children.push(new Paragraph({
        children: [new TextRun({ text: '4.2 显存维度 (CACHE-limit)', bold: true, size: 24 })],
        spacing: { before: 200, after: 100 }
    }));
    
    if (results.memory) {
        children.push(new Paragraph({
            children: [new TextRun({
                text: `公式: M_total = M_model + M_act + M_kv + M_reserve`
            })]
        }));
        children.push(new Paragraph({
            children: [new TextRun({
                text: `模型权重: ${formatNumber(results.memory.modelWeight)}`
            })]
        }));
        children.push(new Paragraph({
            children: [new TextRun({
                text: `激活显存: ${formatNumber(results.memory.activation)}`
            })]
        }));
        children.push(new Paragraph({
            children: [new TextRun({
                text: `KV Cache: ${formatNumber(results.memory.kv?.totalWithQPS)}`
            })]
        }));
        children.push(new Paragraph({
            children: [new TextRun({
                text: `GPU数量: ${results.memory.cacheLimit?.gpuCount || 0}`
            })],
            spacing: { after: 200 }
        }));
    }
    
    children.push(new Paragraph({
        children: [new TextRun({ text: '4.3 带宽维度 (BW-limit)', bold: true, size: 24 })],
        spacing: { before: 200, after: 100 }
    }));
    
    if (results.bandwidth) {
        children.push(new Paragraph({
            children: [new TextRun({
                text: `高频通信量: ${formatNumber(results.bandwidth.highFreq)}`
            })]
        }));
        children.push(new Paragraph({
            children: [new TextRun({
                text: `低频通信量: ${formatNumber(results.bandwidth.lowFreq)}`
            })]
        }));
        children.push(new Paragraph({
            children: [new TextRun({
                text: `单卡最大QPS: ${formatNumber(results.bandwidth.qpsMax)}`
            })]
        }));
        children.push(new Paragraph({
            children: [new TextRun({
                text: `GPU数量: ${results.bandwidth.bwLimit?.gpuCount || 0}`
            })],
            spacing: { after: 200 }
        }));
    }
        
        children.push(new Paragraph({
            children: [new TextRun({ text: '五、最终推荐值', bold: true, size: 28 })],
            spacing: { before: 400, after: 200 }
        }));
        
        children.push(new Table({
            rows: [
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '维度', bold: true })] })] }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'GPU数量', bold: true })] })] })
                    ],
                    tableHeader: true
                }),
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph('算力维度')] }),
                        new TableCell({ children: [new Paragraph(String(results.flops?.limit?.gpuCount || 0))] })
                    ]
                }),
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph('显存维度')] }),
                        new TableCell({ children: [new Paragraph(String(results.memory?.cacheLimit?.gpuCount || 0))] })
                    ]
                }),
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph('带宽维度')] }),
                        new TableCell({ children: [new Paragraph(String(results.bandwidth?.bwLimit?.gpuCount || 0))] })
                    ]
                }),
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '最终推荐', bold: true })] })] }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(results.finalGPUCount), bold: true })] })] })
                    ]
                })
            ],
            width: { size: 100, type: WidthType.PERCENTAGE }
        }));
    }
    
    const doc = new Document({
        sections: [{
            properties: {},
            children: children
        }]
    });
    
    const blob = await Packer.toBlob(doc);
    downloadBlob(blob, generateFilename(params));
}

function createParameterTableRows(paramsData, groupKey) {
    const group = PARAM_GROUPS[groupKey];
    if (!group) return [];
    
    const headerRow = new TableRow({
        children: [
            new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: '参数', bold: true })] })],
                shading: { fill: 'E6F2FF' }
            }),
            new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: '值', bold: true })] })],
                shading: { fill: 'E6F2FF' }
            })
        ]
    });
    
    const rows = [headerRow];
    
    paramsData.forEach(param => {
        const def = group.params.find(p => p.key === param.key);
        if (!def) return;
        
        rows.push(new TableRow({
            children: [
                new TableCell({
                    children: [new Paragraph(def.label)]
                }),
                new TableCell({
                    children: [new Paragraph(formatNumber(param.value, def.format, def.unit))]
                })
            ]
        }));
    });
    
    return rows;
}

function generateFilename(params) {
    const modelName = params.modelName || 'custom';
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `资源评估_${modelName}_${date}.docx`;
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export default {
    exportCalculationResults
};