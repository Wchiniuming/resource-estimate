/**
 * Formula Renderer Module
 * 公式渲染模块 - 根据参数动态生成LaTeX公式
 */

// 公式模板定义
export const FORMULA_TEMPLATES = {
    // ========== 算力维度公式 ==========
    flops: {
        // Prefill阶段FLOPs
        prefill: {
            // MHA + Dense
            'MHA_Dense': `FLOPs_{prefill} = L \\times (8BSH^2 + 4BS^2H + 4BSHI) + 2BSHV`,
            // MHA + MoE
            'MHA_MoE': `FLOPs_{prefill} = L \\times (8BSH^2 + 4BS^2H + BSHE + 2BSkHd_{ff}) + 2BSHV`,
            // GQA + Dense
            'GQA_Dense': `FLOPs_{prefill} = L \\times (4BSH^2 + 4BSH\\cdot d_h + 4BHS^2 + 4BSHI) + 2BSHV`,
            // GQA + MoE
            'GQA_MoE': `FLOPs_{prefill} = L \\times (4BSH^2 + 4BSH\\cdot d_h + 4BHS^2 + BSHE + 2BSkHd_{ff}) + 2BSHV`,
            // MQA + Dense
            'MQA_Dense': `FLOPs_{prefill} = L \\times (2BSH^2 + 2BSHd_h + 4BHS^2 + 4BSHI) + 2BSHV`,
            // MQA + MoE
            'MQA_MoE': `FLOPs_{prefill} = L \\times (2BSH^2 + 2BSHd_h + 4BHS^2 + BSHE + 2BSkHd_{ff}) + 2BSHV`
        },
        // Decode阶段FLOPs
        decode: {
            // MHA + Dense
            'MHA_Dense': `FLOPs_{decode} = L \\times (8BH^2 + 4BHT + 4BHI) + 2BHV`,
            // MHA + MoE
            'MHA_MoE': `FLOPs_{decode} = L \\times (8BH^2 + 4BHT + BHE + 2BkHd_{ff}) + 2BHV`,
            // GQA + Dense
            'GQA_Dense': `FLOPs_{decode} = L \\times (4BH^2 + 4BHd_h + 4BHT + 4BHI) + 2BHV`,
            // GQA + MoE
            'GQA_MoE': `FLOPs_{decode} = L \\times (4BH^2 + 4BHd_h + 4BHT + BHE + 2BkHd_{ff}) + 2BHV`,
            // MQA + Dense
            'MQA_Dense': `FLOPs_{decode} = L \\times (2BH^2 + 2BHd_h + 4BHT + 4BHI) + 2BHV`,
            // MQA + MoE
            'MQA_MoE': `FLOPs_{decode} = L \\times (2BH^2 + 2BHd_h + 4BHT + BHE + 2BkHd_{ff}) + 2BHV`
        },
        // 总FLOPs
        total: `FLOPs_{persample} = \\frac{FLOPs_{prefill} + FLOPs_{decode}}{Q}`,
        // GPU数量
        gpuCount: `N_{FLOPS-limit} = \\left\\lceil\\frac{FLOPs_{total}}{FLOPS_{percard} \\times U_{compute} \\times \\varepsilon \\times (1 - \\theta \\times 0.1)}\\right\\rceil`
    },

    // ========== 显存维度公式 ==========
    memory: {
        // 模型权重
        modelWeight: `M_{model} = N_{total} \\times D`,
        // 激活显存
        activation: {
            // Dense
            'Dense': `M_{act} = B \\times (s + s_{out}) \\times H \\times L \\times D_{act}`,
            // MoE
            'MoE': `M_{act} = B \\times (s + s_{out}) \\times H \\times L \\times D_{act} \\times \\frac{N_{total_{act}}}{N_{total}}`
        },
        // KV Cache - 根据注意力架构
        kvCache: {
            // MHA
            'MHA': `M_{kv} = 2 \\times L \\times H \\times D_{kv} \\times (s + s_{out})`,
            // GQA
            'GQA': `M_{kv} = 2 \\times L \\times A_{kv} \\times d_h \\times D_{kv} \\times (s + s_{out})`,
            // MQA
            'MQA': `M_{kv} = 2 \\times L \\times d_h \\times D_{kv} \\times (s + s_{out})`
        },
        // 总显存
        total: `M_{total} = M_{model} + M_{act} + M_{kv} + M_{reserve}`,
        // GPU数量 - 根据并行策略
        gpuCount: {
            // 单卡
            'single': `N_{CACHE-limit} = \\left\\lceil\\frac{QPS_{target} \\times M_{kv_{single}} + M_{model} + M_{act}}{M_{card} \\times U_{memory} - M_{reserve}}\\right\\rceil`,
            // TP
            'TP': `N_{CACHE-limit} = \\left\\lceil\\frac{QPS_{target} \\times M_{kv_{single}} + M_{model} + M_{act}}{M_{card} \\times U_{memory} - M_{reserve}}\\right\\rceil`,
            // PP
            'PP': `N_{CACHE-limit} = n_{pp}`,
            // TP+PP
            'TP_PP': `N_{CACHE-limit} = n_{tp} \\times n_{pp}`,
            // EP (Expert Parallel)
            'EP': `N_{CACHE-limit} = n_{ep}`
        }
    },

    // ========== 带宽维度公式 ==========
    bandwidth: {
        // 高频通信量
        highFreq: {
            // Dense
            'Dense': `V_{high} = \\frac{L}{n_{pp}} \\times 4 \\times S \\times H \\times D_{act} \\times \\frac{n_{tp} - 1}{n_{tp}}`,
            // MoE
            'MoE': `V_{high} = \\frac{L}{n_{pp}} \\times 2 \\times S \\times H \\times D_{act} \\times \\left[\\frac{n_{tp} - 1}{n_{tp}} + \\frac{k(n_{ep} - 1)}{n_{ep}}\\right]`
        },
        // 低频通信量
        lowFreq: `V_{low} = 2 \\times \\frac{S \\times H \\times D_{act}}{n_{tp}}`,
        // 最大QPS
        qpsMax: `QPS_{max} = \\min\\left(\\frac{BW_{nvlink} \\times \\eta_{nvlink}}{V_{high}}, \\frac{BW_{net} \\times \\eta_{net}}{V_{low}}\\right)`,
        // GPU数量
        gpuCount: `N_{BW-limit} = \\left\\lceil\\frac{QPS_{target}}{QPS_{max}}\\right\\rceil \\times \\frac{n_{tp} \\times n_{pp}}{n_{ep}}`
    },

    // ========== 最终公式 ==========
    final: `N_{gpu} = \\max(N_{FLOPS-limit}, N_{CACHE-limit}, N_{BW-limit})`
};

/**
 * 获取公式组
 * @param {Object} params - 参数对象
 * @returns {Object} 公式组
 */
export function getFormulas(params) {
    const { 
        attentionArch = 'MHA', 
        ffnArch = 'Dense', 
        n_tp = 1, 
        n_pp = 1, 
        n_ep = 1 
    } = params;

    const archKey = `${attentionArch}_${ffnArch}`;
    
    // 确定并行策略
    let parallelStrategy = 'single';
    if (n_ep > 1) {
        parallelStrategy = 'EP';
    } else if (n_tp > 1 && n_pp > 1) {
        parallelStrategy = 'TP_PP';
    } else if (n_tp > 1) {
        parallelStrategy = 'TP';
    } else if (n_pp > 1) {
        parallelStrategy = 'PP';
    }

    // 构建基础公式
    const formulas = {
        flops: {
            title: '算力维度公式 (FLOPs-limit)',
            prefill: {
                label: 'Prefill阶段FLOPs',
                formula: FORMULA_TEMPLATES.flops.prefill[archKey] || FORMULA_TEMPLATES.flops.prefill['MHA_Dense'],
                description: '预填充阶段计算输入序列的注意力机制和FFN层'
            },
            decode: {
                label: 'Decode阶段FLOPs',
                formula: FORMULA_TEMPLATES.flops.decode[archKey] || FORMULA_TEMPLATES.flops.decode['MHA_Dense'],
                description: '解码阶段逐个生成token，利用KV Cache减少计算量'
            },
            total: {
                label: '单样本总FLOPs',
                formula: FORMULA_TEMPLATES.flops.total,
                description: 'Prefill和Decode阶段FLOPs之和除以量化系数'
            },
            gpuCount: {
                label: '算力维度GPU数量',
                formula: FORMULA_TEMPLATES.flops.gpuCount,
                description: '基于总算力需求和单卡算力计算所需GPU数量'
            }
        },
        memory: {
            title: '显存维度公式 (CACHE-limit)',
            modelWeight: {
                label: '模型权重显存',
                formula: FORMULA_TEMPLATES.memory.modelWeight,
                description: '模型参数总量乘以精度字节数'
            },
            activation: {
                label: '中间激活显存',
                formula: FORMULA_TEMPLATES.memory.activation[ffnArch] || FORMULA_TEMPLATES.memory.activation['Dense'],
                description: '前向传播过程中各层计算的中间张量'
            },
            kvCache: {
                label: 'KV Cache显存',
                formula: FORMULA_TEMPLATES.memory.kvCache[attentionArch] || FORMULA_TEMPLATES.memory.kvCache['MHA'],
                description: '注意力机制中Key和Value张量的缓存'
            },
            total: {
                label: '总显存占用',
                formula: FORMULA_TEMPLATES.memory.total,
                description: '模型权重、激活、KV Cache和预留显存之和'
            },
            gpuCount: {
                label: '显存维度GPU数量',
                formula: FORMULA_TEMPLATES.memory.gpuCount[parallelStrategy] || FORMULA_TEMPLATES.memory.gpuCount['single'],
                description: '基于总显存需求和单卡显存计算所需GPU数量'
            }
        },
        bandwidth: {
            title: '带宽维度公式 (BW-limit)',
            highFreq: {
                label: '高频通信量 (NVLink/HCCS)',
                formula: FORMULA_TEMPLATES.bandwidth.highFreq[ffnArch] || FORMULA_TEMPLATES.bandwidth.highFreq['Dense'],
                description: '节点内高速互联的All-Reduce和All-to-All通信量'
            },
            lowFreq: {
                label: '低频通信量 (PCIe/RDMA)',
                formula: FORMULA_TEMPLATES.bandwidth.lowFreq,
                description: '跨节点PP阶段的激活值传输通信量'
            },
            qpsMax: {
                label: '单卡最大QPS',
                formula: FORMULA_TEMPLATES.bandwidth.qpsMax,
                description: '基于高频和低频带宽瓶颈计算单卡最大并发数'
            },
            gpuCount: {
                label: '带宽维度GPU数量',
                formula: FORMULA_TEMPLATES.bandwidth.gpuCount,
                description: '基于目标QPS和单卡最大QPS计算所需GPU数量'
            }
        },
        final: {
            title: '最终GPU数量',
            formula: FORMULA_TEMPLATES.final,
            description: '取算力、显存、带宽三个维度GPU数量的最大值'
        }
    };
    
    // 替换为用户自定义的公式 (带架构信息)
    Object.entries(formulas).forEach(([dimension, dimFormulas]) => {
        Object.entries(dimFormulas).forEach(([key, value]) => {
            if (key === 'title') return;
            
            // 对于flops维度，使用架构特定的公式ID
            let formulaId;
            if (dimension === 'flops' && (key === 'prefill' || key === 'decode')) {
                formulaId = `${dimension}-${key}-${archKey}`;
            } else {
                formulaId = `${dimension}-${key}`;
            }
            
            // 将formulaId保存到formulaDef中，供createFormulaItem使用
            if (typeof value === 'object') {
                value.formulaId = formulaId;
            }
            
            const customFormula = window.FormulaManager.getCurrentFormula(formulaId);
            if (customFormula) {
                if (typeof value === 'object') {
                    value.formula = customFormula;
                } else {
                    dimFormulas[key] = customFormula;
                }
            }
        });
    });

    return formulas;
}

/**
 * 渲染LaTeX公式到DOM元素
 * @param {string} latex - LaTeX公式字符串
 * @param {HTMLElement} element - 目标DOM元素
 * @param {Object} options - 渲染选项
 */
export function renderFormula(latex, element, options = {}) {
    if (!element || !window.katex) {
        console.warn('Element or KaTeX not available');
        return;
    }

    const defaultOptions = {
        displayMode: true,
        throwOnError: false,
        errorColor: '#cc0000',
        ...options
    };

    try {
        katex.render(latex, element, defaultOptions);
    } catch (error) {
        console.error('KaTeX render error:', error);
        element.innerHTML = `<span style="color: #cc0000;">公式渲染错误: ${error.message}</span>`;
    }
}

/**
 * 创建公式展示面板
 * @param {Object} formulas - 公式组
 * @param {HTMLElement} container - 容器元素
 */
export function createFormulaPanel(formulas, container) {
    if (!container) return;

    // 使用 textContent 清空，比 innerHTML = '' 更快
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    // 创建维度Tab导航
    const tabNav = document.createElement('div');
    tabNav.className = 'border-b border-[rgba(148,163,184,0.2)] mb-4';
    tabNav.innerHTML = `
        <nav class="-mb-px flex space-x-8" aria-label="Formula Tabs">
            <button data-formula-tab="flops" class="formula-tab-btn border-[#00d4ff] text-[#00d4ff] whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm">
                算力维度
            </button>
            <button data-formula-tab="memory" class="formula-tab-btn border-transparent text-[#94a3b8] hover:text-[#cbd5e1] hover:border-[rgba(148,163,184,0.3)] whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm">
                显存维度
            </button>
            <button data-formula-tab="bandwidth" class="formula-tab-btn border-transparent text-[#94a3b8] hover:text-[#cbd5e1] hover:border-[rgba(148,163,184,0.3)] whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm">
                带宽维度
            </button>
            <button data-formula-tab="final" class="formula-tab-btn border-transparent text-[#94a3b8] hover:text-[#cbd5e1] hover:border-[rgba(148,163,184,0.3)] whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm">
                最终结果
            </button>
        </nav>
    `;
    container.appendChild(tabNav);

    // 创建Tab内容区域
    const tabContent = document.createElement('div');
    tabContent.className = 'formula-tab-content';
    container.appendChild(tabContent);

    // 渲染各个维度的公式
    renderDimensionFormulas(formulas, tabContent);

    // 绑定Tab切换事件
    bindTabEvents(tabNav, tabContent);

    // 默认显示第一个Tab
    switchFormulaTab('flops', tabNav, tabContent);
}

/**
 * 渲染各维度的公式
 * @param {Object} formulas - 公式组
 * @param {HTMLElement} container - 容器元素
 */
function renderDimensionFormulas(formulas, container) {
    // 算力维度
    const flopsSection = createFormulaSection('flops', formulas.flops);
    container.appendChild(flopsSection);

    // 显存维度
    const memorySection = createFormulaSection('memory', formulas.memory);
    container.appendChild(memorySection);

    // 带宽维度
    const bandwidthSection = createFormulaSection('bandwidth', formulas.bandwidth);
    container.appendChild(bandwidthSection);

    // 最终结果
    const finalSection = createFinalFormulaSection(formulas.final);
    container.appendChild(finalSection);
}

/**
 * 创建公式区域
 * @param {string} id - 区域ID
 * @param {Object} formulas - 公式定义
 * @returns {HTMLElement} 公式区域元素
 */
function createFormulaSection(id, formulas) {
    const section = document.createElement('div');
    section.id = `formula-section-${id}`;
    section.className = 'formula-section hidden';

    const title = document.createElement('h3');
    title.className = 'text-md font-semibold text-[#f8fafc] mb-4';
    title.textContent = formulas.title;
    section.appendChild(title);

    const formulaList = document.createElement('div');
    formulaList.className = 'space-y-3';

    // 使用 DocumentFragment 批量插入公式项，减少重排
    const fragment = document.createDocumentFragment();
    Object.entries(formulas).forEach(([key, value]) => {
        if (key === 'title') return;

        const formulaItem = createFormulaItem(id, key, value);
        fragment.appendChild(formulaItem);
    });
    formulaList.appendChild(fragment);

    section.appendChild(formulaList);
    return section;
}

/**
 * 创建单个公式项
 * @param {string} dimension - 公式所属维度 (flops/memory/bandwidth/final)
 * @param {string} key - 公式键名
 * @param {Object|string} formulaDef - 公式定义
 * @returns {HTMLElement} 公式项元素
 */
function createFormulaItem(dimension, key, formulaDef) {
    const item = document.createElement('div');
    item.className = 'formula-item bg-[rgba(30,41,59,0.6)] rounded-lg p-3 border border-[rgba(148,163,184,0.2)] hover:border-[#00d4ff]/50 transition-colors cursor-pointer';
    
    // 使用formulaDef中保存的formulaId（如果有架构特定ID）
    const formulaId = (formulaDef && formulaDef.formulaId) ? formulaDef.formulaId : `${dimension}-${key}`;
    item.dataset.formulaId = formulaId;
    item.dataset.formulaDimension = dimension;
    item.dataset.formulaKey = key;

    let label, formula, description;

    if (typeof formulaDef === 'string') {
        formula = formulaDef;
        label = key;
        description = '';
    } else {
        label = formulaDef.label || key;
        formula = formulaDef.formula || formulaDef;
        description = formulaDef.description || '';
    }

    // 公式标题
    const header = document.createElement('div');
    header.className = 'flex items-center justify-between mb-2';
    header.innerHTML = `
        <span class="text-sm font-medium text-[#cbd5e1]">${label}</span>
        <div class="flex items-center gap-2">
            ${description ? `<span class="text-xs text-[#94a3b8]" title="${description}">ⓘ</span>` : ''}
            <button class="formula-history-btn text-xs bg-[rgba(30,41,59,0.8)] hover:bg-[rgba(30,41,59,1)] text-[#cbd5e1] px-2 py-1 rounded border border-[rgba(148,163,184,0.2)] transition-colors" title="查看版本历史">
                📜 版本历史
            </button>
        </div>
    `;
    item.appendChild(header);

    // 公式渲染区域
    const formulaContainer = document.createElement('div');
    formulaContainer.className = 'formula-latex text-center py-2';
    item.appendChild(formulaContainer);

    // 绑定点击事件
    item.addEventListener('click', (e) => {
        if (e.target.closest('.formula-history-btn')) {
            e.stopPropagation();
            openFormulaHistory(formulaId, label, formula);
            return;
        }
        openFormulaEditor(formulaId, label, formula);
    });

    // 异步渲染公式
    setTimeout(() => {
        renderFormula(formula, formulaContainer);
    }, 0);

    return item;
}

/**
 * 打开公式编辑器弹窗
 * @param {string} formulaId - 公式唯一ID
 * @param {string} label - 公式名称
 * @param {string} currentLatex - 当前LaTeX公式
 */
export function openFormulaEditor(formulaId, label, currentLatex) {
    // 移除已有弹窗
    closeFormulaEditor();

    // 创建弹窗
    const modal = document.createElement('div');
    modal.id = 'formula-editor-modal';
    modal.className = 'fixed inset-0 bg-[rgba(10,14,26,0.85)] flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-[#0f172a] rounded-lg w-3/4 max-w-3xl max-h-[90vh] overflow-y-auto border border-[rgba(148,163,184,0.2)]">
            <div class="p-4 border-b border-[rgba(148,163,184,0.2)] flex justify-between items-center">
                <h3 class="text-lg font-semibold text-[#f8fafc]">编辑公式: ${label}</h3>
                <button id="close-editor-btn" class="text-[#94a3b8] hover:text-[#f8fafc] text-2xl">&times;</button>
            </div>
            <div class="p-4 space-y-4">
                <div>
                    <label class="block text-sm font-medium text-[#cbd5e1] mb-1">LaTeX 代码</label>
                    <textarea id="formula-latex-input" class="w-full border border-[rgba(148,163,184,0.3)] rounded p-2 h-24 font-mono text-sm bg-[rgba(30,41,59,0.6)] text-[#f8fafc]" placeholder="请输入LaTeX代码...">${currentLatex}</textarea>
                </div>
                <div>
                    <label class="block text-sm font-medium text-[#cbd5e1] mb-1">预览</label>
                    <div id="formula-preview" class="border border-[rgba(148,163,184,0.2)] rounded p-4 bg-[rgba(30,41,59,0.6)] min-h-[80px] flex items-center justify-center text-[#f8fafc]"></div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-[#cbd5e1] mb-1">版本描述</label>
                    <input id="formula-version-desc" type="text" class="w-full border border-[rgba(148,163,184,0.3)] rounded p-2 bg-[rgba(30,41,59,0.6)] text-[#f8fafc] placeholder-[#64748b]" placeholder="描述本次修改内容...">
                </div>
            </div>
            <div class="p-4 border-t border-[rgba(148,163,184,0.2)] flex justify-end gap-2">
                <button id="cancel-editor-btn" class="px-4 py-2 border border-[rgba(148,163,184,0.3)] rounded hover:bg-[rgba(30,41,59,0.8)] text-[#cbd5e1] transition-colors">取消</button>
                <button id="save-editor-btn" class="px-4 py-2 bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/50 rounded hover:bg-[#00d4ff]/30 transition-colors">保存</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // 实时预览
    const latexInput = document.getElementById('formula-latex-input');
    const previewContainer = document.getElementById('formula-preview');
    
    const updatePreview = () => {
        renderFormula(latexInput.value, previewContainer);
    };
    
    latexInput.addEventListener('input', updatePreview);
    updatePreview(); // 初始预览

    // 绑定事件
    document.getElementById('close-editor-btn').addEventListener('click', closeFormulaEditor);
    document.getElementById('cancel-editor-btn').addEventListener('click', closeFormulaEditor);
    
    // 点击外部关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeFormulaEditor();
    });

    // 保存
    document.getElementById('save-editor-btn').addEventListener('click', async () => {
        const newLatex = latexInput.value.trim();
        const description = document.getElementById('formula-version-desc').value.trim();
        
        if (!newLatex) {
            alert('公式不能为空');
            return;
        }

        // 验证公式
        const validation = window.FormulaManager.validateFormula(newLatex);
        if (!validation.valid) {
            alert(`公式验证失败: ${validation.error}`);
            return;
        }

        // 保存新版本
        await window.FormulaManager.saveFormulaVersion(formulaId, newLatex, description);
        
        // 更新显示
        updateFormulaDisplay(window.currentParams || {});
        
        closeFormulaEditor();
        alert('公式已保存');
    });
}

/**
 * 关闭公式编辑器
 */
function closeFormulaEditor() {
    const modal = document.getElementById('formula-editor-modal');
    if (modal) {
        modal.remove();
    }
}

/**
 * 打开公式历史版本弹窗
 * @param {string} formulaId - 公式唯一ID
 * @param {string} label - 公式名称
 * @param {string} currentLatex - 当前LaTeX公式
 */
export function openFormulaHistory(formulaId, label, currentLatex) {
    // 移除已有弹窗
    closeFormulaHistory();

    // 获取版本历史
    const versions = window.FormulaManager.getFormulaVersions(formulaId);

    // 创建弹窗
    const modal = document.createElement('div');
    modal.id = 'formula-history-modal';
    modal.className = 'fixed inset-0 bg-[rgba(10,14,26,0.85)] flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-[#0f172a] rounded-lg w-3/4 max-w-3xl max-h-[90vh] overflow-y-auto border border-[rgba(148,163,184,0.2)]">
            <div class="p-4 border-b border-[rgba(148,163,184,0.2)] flex justify-between items-center">
                <h3 class="text-lg font-semibold text-[#f8fafc]">版本历史: ${label}</h3>
                <button id="close-history-btn" class="text-[#94a3b8] hover:text-[#f8fafc] text-2xl">&times;</button>
            </div>
            <div class="p-4">
                ${versions.length === 0 ? '<p class="text-[#94a3b8] text-center py-4">暂无版本历史</p>' : ''}
                <div id="version-list" class="space-y-3">
                    ${versions.map((version, index) => `
                        <div class="border border-[rgba(148,163,184,0.2)] rounded p-3 hover:bg-[rgba(30,41,59,0.6)] transition-colors">
                            <div class="flex justify-between items-start mb-2">
                                <div>
                                    <div class="font-medium text-[#f8fafc]">v${version.version} ${index === 0 ? '(当前版本)' : ''}</div>
                                    <div class="text-xs text-[#94a3b8]">${new Date(version.timestamp).toLocaleString()}</div>
                                    ${version.description ? `<div class="text-sm text-[#cbd5e1] mt-1">${version.description}</div>` : ''}
                                </div>
                                <div class="flex gap-2">
                                    ${index !== 0 ? `<button class="rollback-btn text-xs bg-[#00d4ff]/10 hover:bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/30 px-2 py-1 rounded transition-colors" data-version="${version.version}">回滚到此版本</button>` : ''}
                                </div>
                            </div>
                            <div class="border border-[rgba(148,163,184,0.15)] rounded p-2 bg-[rgba(30,41,59,0.4)]">
                                <div id="version-preview-${version.version}" class="text-center"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="p-4 border-t border-[rgba(148,163,184,0.2)] flex justify-end">
                <button id="close-history-btn-bottom" class="px-4 py-2 border border-[rgba(148,163,184,0.3)] rounded hover:bg-[rgba(30,41,59,0.8)] text-[#cbd5e1] transition-colors">关闭</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // 渲染所有版本的公式预览
    versions.forEach(version => {
        const previewContainer = document.getElementById(`version-preview-${version.version}`);
        renderFormula(version.latex, previewContainer);
    });

    // 绑定回滚事件
    document.querySelectorAll('.rollback-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const versionId = parseInt(e.target.dataset.version);
            if (confirm('确定要回滚到此版本吗？')) {
                await window.FormulaManager.rollbackFormulaVersion(formulaId, versionId);
                updateFormulaDisplay(window.currentParams || {});
                closeFormulaHistory();
                alert('已回滚到指定版本');
            }
        });
    });

    // 关闭事件
    document.getElementById('close-history-btn').addEventListener('click', closeFormulaHistory);
    document.getElementById('close-history-btn-bottom').addEventListener('click', closeFormulaHistory);
    
    // 点击外部关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeFormulaHistory();
    });
}

/**
 * 关闭公式历史弹窗
 */
function closeFormulaHistory() {
    const modal = document.getElementById('formula-history-modal');
    if (modal) {
        modal.remove();
    }
}

/**
 * 创建最终结果公式区域
 * @param {Object} finalFormula - 最终公式定义
 * @returns {HTMLElement} 公式区域元素
 */
function createFinalFormulaSection(finalFormula) {
    const section = document.createElement('div');
    section.id = 'formula-section-final';
    section.className = 'formula-section hidden';

    const title = document.createElement('h3');
    title.className = 'text-md font-semibold text-[#f8fafc] mb-4';
    title.textContent = finalFormula.title;
    section.appendChild(title);

    const item = createFormulaItem('final', 'final', {
        label: '最终GPU数量',
        formula: finalFormula.formula,
        description: finalFormula.description
    });

    // 添加高亮样式
    item.classList.add('bg-[rgba(0,212,255,0.1)]', 'border-[#00d4ff]/50');

    section.appendChild(item);
    return section;
}

/**
 * 绑定Tab切换事件
 * @param {HTMLElement} tabNav - Tab导航元素
 * @param {HTMLElement} tabContent - Tab内容元素
 */
function bindTabEvents(tabNav, tabContent) {
    const tabButtons = tabNav.querySelectorAll('.formula-tab-btn');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tab = button.dataset.formulaTab;
            switchFormulaTab(tab, tabNav, tabContent);
        });
    });
}

/**
 * 切换公式Tab
 * @param {string} tab - Tab名称
 * @param {HTMLElement} tabNav - Tab导航元素
 * @param {HTMLElement} tabContent - Tab内容元素
 */
function switchFormulaTab(tab, tabNav, tabContent) {
    // 定义各维度的颜色
    const dimensionColors = {
        flops: '#00d4ff',    // 算力 - cyan
        memory: '#8b5cf6',   // 显存 - purple
        bandwidth: '#10b981', // 带宽 - green
        final: '#f59e0b'     // 最终 - gold
    };

    // 更新按钮状态
    const tabButtons = tabNav.querySelectorAll('.formula-tab-btn');
    tabButtons.forEach(btn => {
        const btnTab = btn.dataset.formulaTab;
        const activeColor = dimensionColors[btnTab] || '#00d4ff';

        if (btnTab === tab) {
            btn.classList.remove('border-transparent', 'text-[#94a3b8]');
            btn.style.borderColor = activeColor;
            btn.style.color = activeColor;
            btn.classList.add(`border-[${activeColor}]`, `text-[${activeColor}]`);
        } else {
            btn.style.borderColor = 'transparent';
            btn.style.color = '#94a3b8';
            btn.classList.remove(`border-[${activeColor}]`, `text-[${activeColor}]`);
            btn.classList.add('border-transparent', 'text-[#94a3b8]');
        }
    });

    // 显示对应内容
    const sections = tabContent.querySelectorAll('.formula-section');
    sections.forEach(section => {
        if (section.id === `formula-section-${tab}`) {
            section.classList.remove('hidden');
        } else {
            section.classList.add('hidden');
        }
    });
}

export function highlightFormula(dimension, formulaKey) {
    return;
}

/**
 * 更新所有公式显示
 * @param {Object} params - 当前参数
 */
export function updateFormulaDisplay(params) {
    const formulas = getFormulas(params);
    const container = document.getElementById('formula-display');
    
    if (container) {
        createFormulaPanel(formulas, container);
    }
}

    // 导出默认对象
    export default {
        getFormulas,
        renderFormula,
        createFormulaPanel,
        highlightFormula,
        updateFormulaDisplay
        // FORMULA_TEMPLATES
    };
    
    // 导出公式模板常量（兼容性导出）
    // export const FORMULA_TEMPLATES = FORMULA_TEMPLATES;
