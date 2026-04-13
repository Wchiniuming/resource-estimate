import { StateManager, DEFAULT_PARAMS } from './modules/state-manager.js';
import './modules/formula-manager.js';
import './modules/latex-renderer.js';
import { getFormulas, createFormulaPanel, highlightFormula, updateFormulaDisplay, renderFormula, FORMULA_TEMPLATES } from './modules/formula-renderer.js';
import { 
    NumberFormatter, 
    ResultRenderer, 
    ChartManager, 
    updateVisualizations 
} from './modules/visualization.js';
import * as FLOPsEngine from './modules/flops-engine.js';
import * as MemoryEngine from './modules/memory-engine.js';
import * as BandwidthEngine from './modules/bandwidth-engine.js';
import { getModel, fillModelParams } from './modules/model-library.js';
import { getServer, fillServerParams } from './modules/hardware-library.js';

let stateManager;
let chartManager;

// 计算结果缓存
let lastCalculation = null;
let lastParams = null;

// 事件监听器引用（用于清理）
const eventListeners = new Map();

document.addEventListener('DOMContentLoaded', () => {
    initializeStateManager();
    initializeEventHandlers();
    initializeCharts();
    initializeFormulaDisplay();

    runInitialCalculation();
});

function initializeStateManager() {
    stateManager = new StateManager();
    
    stateManager.on('paramsChanged', handleParamsChanged);
    stateManager.on('resultsChanged', handleResultsChanged);
    stateManager.on('calculate', handleCalculate);
    stateManager.on('error', handleError);
    
    syncFormWithState();
}

function initializeEventHandlers() {
    const paramInputs = document.querySelectorAll('.param-input, .param-input-mini');
    paramInputs.forEach(input => {
        const paramName = input.dataset.param;
        if (!paramName) return;
        
        input.addEventListener('change', (e) => {
            let value = e.target.value;
            if (e.target.type === 'number' || e.target.type === 'range') {
                value = parseFloat(value);
            } else if (e.target.type === 'checkbox') {
                value = e.target.checked;
            }
            stateManager.setParam(paramName, value);
        });
        
        input.addEventListener('input', (e) => {
            // For all input types, update param with debounced calculation
            let value = e.target.value;
            if (e.target.type === 'number' || e.target.type === 'range') {
                value = parseFloat(value);
            }
            stateManager.setParam(paramName, value);
        });
    });
    
    const tabBtns = document.querySelectorAll('.tab-btn-mini');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });
    
    const resetBtn = document.getElementById('reset-params-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('确定要重置所有参数为默认值吗？')) {
                stateManager.resetToDefaults();
                syncFormWithState();
            }
        });
    }
    
    const recalculateBtn = document.getElementById('recalculate-btn');
    if (recalculateBtn) {
        recalculateBtn.addEventListener('click', () => {
            stateManager.calculate();
        });
    }

    // MoE参数显示/隐藏逻辑
    const ffnArchSelect = document.getElementById('param-ffnArch');
    const moeParamsSection = document.getElementById('moe-params-section');

    function updateMoEParamsVisibility() {
        if (ffnArchSelect && moeParamsSection) {
            const isMoE = ffnArchSelect.value === 'MoE';
            moeParamsSection.classList.toggle('hidden', !isMoE);
        }
    }

    if (ffnArchSelect) {
        ffnArchSelect.addEventListener('change', updateMoEParamsVisibility);
        // 初始化时检查当前值
        updateMoEParamsVisibility();
    }

    // Model selection dropdown handler
    const modelSelect = document.getElementById('model-select');
    if (modelSelect) {
        modelSelect.addEventListener('change', (e) => {
            const modelName = e.target.value;
            if (modelName && modelName !== 'custom') {
                const model = getModel(modelName);
                if (model) {
                    const params = {
                        'N_total': model.N_total * 1e9,
                        'V': model.V,
                        'L': model.L,
                        'H': model.H,
                        'A': model.A,
                        'A_kv': model.A_kv,
                        'I': model.I,
                        'attentionArch': model.attention_arch,
                        'ffnArch': model.is_moe ? 'MoE' : 'Dense',
                        'modelName': model.name
                    };
                    
                    if (model.is_moe) {
                        params['E'] = model.num_experts;
                        params['k'] = model.active_experts;
                        params['d_ff'] = model.d_ff || model.I;
                        params['N_total_act'] = model.active_experts * (model.d_ff || model.I) * 2 * model.L / 1e9;
                    }
                    
                    stateManager.batchUpdate(params);
                    syncFormWithState();
                    stateManager.calculate();
                }
            } else if (modelName === 'custom') {
                stateManager.batchUpdate({
                    'N_total': 7e9,
                    'V': 32000,
                    'L': 32,
                    'H': 4096,
                    'A': 32,
                    'A_kv': 32,
                    'I': 11008,
                    'attentionArch': 'MHA',
                    'ffnArch': 'Dense'
                });
                syncFormWithState();
            }
        });
    }

    // Server selection dropdown handler
    const serverSelect = document.getElementById('server-select');
    if (serverSelect) {
        serverSelect.addEventListener('change', (e) => {
            const serverName = e.target.value;
            if (serverName && serverName !== 'custom') {
                const server = getServer(serverName);
                if (server) {
                    const params = {};
                    
                    if (server.FLOPS_percard) params['FLOPS_percard'] = server.FLOPS_percard;
                    if (server.M_card) params['M_card'] = server.M_card;
                    if (server.BW_nvlink) params['BW_nvlink'] = server.BW_nvlink;
                    if (server.BW_net) params['BW_net'] = server.BW_net;
                    if (server.n_gpu_per_node) params['n_gpu_per_node'] = server.n_gpu_per_node;
                    if (server.U_compute) params['U_compute'] = server.U_compute;
                    if (server.U_memory) params['U_memory'] = server.U_memory;
                    
                    stateManager.batchUpdate(params);
                    syncFormWithState();
                    stateManager.calculate();
                }
            } else if (serverName === 'custom') {
                stateManager.batchUpdate({
                    'FLOPS_percard': 1e15,
                    'M_card': 80e9,
                    'BW_nvlink': 900e9,
                    'BW_net': 50e9,
                    'n_gpu_per_node': 8
                });
                syncFormWithState();
            }
        });
    }

    // Formula version management event handlers
    initializeFormulaEventHandlers();
}

function initializeCharts() {
    // ChartManager doesn't need a container ID - it uses canvas IDs directly
    chartManager = new ChartManager();
}

function initializeFormulaDisplay() {
    // Initialize formula display using the new formula-renderer module
    const params = stateManager ? stateManager.getAllParams() : DEFAULT_PARAMS;
    updateFormulaDisplay(params);
    updateArchBadge(params);
}

/**
 * 更新架构徽章显示
 * @param {Object} params - 当前参数
 */
function updateArchBadge(params) {
    const badge = document.getElementById('current-arch-badge');
    if (badge && params) {
        const attentionArch = params.attentionArch || 'MHA';
        const ffnArch = params.ffnArch || 'Dense';
        badge.textContent = `${attentionArch} + ${ffnArch}`;
    }
}

function syncFormWithState() {
    const params = stateManager.getAllParams();
    
    Object.entries(params).forEach(([key, value]) => {
        const input = document.querySelector(`[data-param="${key}"]`);
        if (input) {
            if (input.type === 'checkbox') {
                input.checked = !!value;
            } else {
                input.value = value;
            }
        }
    });
}

function switchTab(tab) {
    stateManager.setActiveTab(tab);

    document.querySelectorAll('.tab-btn-mini').forEach(btn => {
        if (btn.dataset.tab === tab) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    document.querySelectorAll('.tab-content-mini').forEach(content => {
        content.classList.remove('active');
    });
    const activeContent = document.getElementById(`tab-${tab}`);
    if (activeContent) {
        activeContent.classList.add('active');
    }
}

function handleParamsChanged(data) {
    const { key, value, keys, changedParams } = data;
    const input = document.querySelector(`[data-param="${key}"]`);
    if (input && input.value !== String(value)) {
        if (input.type === 'checkbox') {
            input.checked = !!value;
        } else {
            input.value = value;
        }
    }
    
    const archOrParallelKeys = ['attentionArch', 'ffnArch', 'n_tp', 'n_pp', 'n_ep'];
    const hasArchOrParallelChange = keys ? keys.some(k => archOrParallelKeys.includes(k)) : archOrParallelKeys.includes(key);
    const paramsInChangedParams = changedParams ? Object.keys(changedParams).filter(k => archOrParallelKeys.includes(k)) : [];
    const shouldUpdate = hasArchOrParallelChange || paramsInChangedParams.length > 0;
    
    if (shouldUpdate) {
        const params = stateManager.getAllParams();
        updateFormulaDisplay(params);
        updateArchBadge(params);
    }
}

function handleResultsChanged(results) {
    // Render GPU count cards
    const gpuCountContainer = document.getElementById('gpu-count-cards');
    if (gpuCountContainer && results.isValid) {
        gpuCountContainer.innerHTML = '';
        const gpuSummary = ResultRenderer.createGPUCountSummary(results);
        gpuCountContainer.appendChild(gpuSummary);
    }

    // Render intermediate results
    const intermediateContainer = document.getElementById('intermediate-results');
    if (intermediateContainer && results.isValid) {
        intermediateContainer.innerHTML = '';
        const intermediateResults = ResultRenderer.createIntermediateResults(results);
        intermediateContainer.appendChild(intermediateResults);
    }
    
    // Update charts (formula highlighting removed)
    if (chartManager && results.isValid) {
        // Update GPU count bar chart
        if (results.flops && results.memory && results.bandwidth) {
            chartManager.createGPUCountBarChart('gpu-count-chart', {
                flops: results.flops.limit?.gpuCount || 0,
                memory: results.memory.cacheLimit?.gpuCount || 0,
                bandwidth: results.bandwidth.bwLimit?.gpuCount || 0
            });
        }
        
        // Update memory pie chart
        if (results.memory) {
            chartManager.createMemoryPieChart('memory-breakdown-chart', {
                modelWeight: results.memory.modelWeight || 0,
                activation: results.memory.activation || 0,
                kvCache: results.memory.totalKVWithQPS || 0
            });
        }
        
    }
}

function handleCalculate(data) {
    performCalculation();
}

function handleError(error) {
    console.error('State Manager Error:', error);
    const errorKey = error.key;
    const errorMessage = error.message;
    
    const input = document.querySelector(`[data-param="${errorKey}"]`);
    if (input) {
        input.classList.add('border-red-500');
        
        let errorTooltip = input.parentElement.querySelector('.error-tooltip');
        if (!errorTooltip) {
            errorTooltip = document.createElement('p');
            errorTooltip.className = 'error-tooltip mt-1 text-xs text-red-600';
            input.parentElement.appendChild(errorTooltip);
        }
        errorTooltip.textContent = errorMessage;
    }
}

function performCalculation() {
    try {
        const params = stateManager.getAllParams();

        // 计算结果缓存 - 检查参数是否变化
        const currentParams = JSON.stringify(params);
        if (currentParams === lastParams && lastCalculation) {
            // 参数未变，使用缓存结果
            stateManager.setResults(lastCalculation);
            return;
        }

        const flopsResult = FLOPsEngine.calculate(params, params.attentionArch, params.ffnArch);
        const memoryResult = MemoryEngine.calculate(params, params.attentionArch, params.ffnArch);
        const bandwidthResult = BandwidthEngine.calculate(params, params.ffnArch);

        const finalGPUCount = Math.max(
            flopsResult.limit.gpuCount,
            memoryResult.cacheLimit.gpuCount,
            bandwidthResult.bwLimit.gpuCount
        );
        
        const results = {
            flops: flopsResult,
            memory: memoryResult,
            bandwidth: bandwidthResult,
            finalGPUCount,
            isValid: true,
            config: {
                attentionArch: params.attentionArch,
                ffnArch: params.ffnArch
            }
        };

        lastCalculation = results;
        lastParams = currentParams;

        stateManager.setResults(results);
    } catch (err) {
        console.error('Calculation error:', err);
        stateManager.emit('error', {
            key: 'calculation',
            message: err.message
        });
        stateManager.setCalculating(false);
        stateManager.isCalculating = false;
        stateManager.processCalculateQueue();
    }
}

function runInitialCalculation() {
    setTimeout(() => {
        stateManager.calculate();
    }, 100);
}

function highlightCurrentFormulas(config) {
    return;
}

/**
 * Initialize formula version management event handlers
 */
function initializeFormulaEventHandlers() {
    const formulaManager = window.FormulaManager;
    if (!formulaManager) {
        console.error('FormulaManager not found');
        return;
    }

    const importBtn = document.getElementById('import-formula-btn');
    const exportBtn = document.getElementById('export-formula-btn');
    const importInput = document.getElementById('formula-import-input');

    const modal = document.getElementById('formula-editor-modal');
    const modalOverlay = document.getElementById('formula-modal-overlay');
    const closeModalBtn = document.getElementById('close-formula-modal');
    const cancelModalBtn = document.getElementById('cancel-formula-btn');
    const saveConfirmBtn = document.getElementById('save-formula-confirm-btn');

    const categorySelect = document.getElementById('formula-category-select');
    const versionSelect = document.getElementById('formula-version-select');
    const rollbackBtn = document.getElementById('rollback-formula-btn');
    const formulaTextarea = document.getElementById('formula-textarea');
    const versionDescInput = document.getElementById('formula-version-desc');
    const formulaPreview = document.getElementById('formula-preview');

    function openModal() {
        if (modal) modal.classList.remove('hidden');
        updateFormulaPreview();
        updateVersionSelect();
    }

    function closeModal() {
        if (modal) modal.classList.add('hidden');
        if (formulaTextarea) formulaTextarea.value = '';
        if (versionDescInput) versionDescInput.value = '';
    }

    function updateFormulaPreview() {
        if (!formulaTextarea || !formulaPreview) return;
        const latex = formulaTextarea.value.trim();
        if (latex) {
            const validation = formulaManager.validateFormula(latex);
            if (validation.valid) {
                renderFormula(latex, formulaPreview, { displayMode: true });
            } else {
                formulaPreview.innerHTML = `<span class="text-red-600 text-sm">${validation.error}</span>`;
            }
        } else {
            formulaPreview.innerHTML = '<span class="text-gray-400">预览区域</span>';
        }
    }

    function updateVersionSelect() {
        if (!versionSelect) return;
        const versions = formulaManager.getFormulaVersions();
        versionSelect.innerHTML = '<option value="">选择版本...</option>';
        versions.forEach(v => {
            const date = new Date(v.timestamp).toLocaleString('zh-CN');
            const option = document.createElement('option');
            option.value = v.version;
            option.textContent = `v${v.version} - ${v.name} (${date})`;
            versionSelect.appendChild(option);
        });
    }

    function getCurrentFormulaText() {
        if (!categorySelect) return '';
        const category = categorySelect.value;
        const params = stateManager.getAllParams();
        const formulas = getFormulas(params);
        
        const [dimension, type] = category.split('-');
        
        if (dimension === 'final') {
            return formulas.final.formula;
        }
        
        if (formulas[dimension] && formulas[dimension][type]) {
            const formula = formulas[dimension][type];
            return typeof formula === 'object' ? formula.formula : formula;
        }
        
        return '';
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }

    if (cancelModalBtn) {
        cancelModalBtn.addEventListener('click', closeModal);
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeModal);
    }

    if (categorySelect) {
        categorySelect.addEventListener('change', () => {
            if (formulaTextarea) {
                formulaTextarea.value = getCurrentFormulaText();
                updateFormulaPreview();
            }
        });
        
        // Initialize with current formula
        setTimeout(() => {
            formulaTextarea.value = getCurrentFormulaText();
            updateFormulaPreview();
        }, 100);
    }

    if (formulaTextarea) {
        formulaTextarea.addEventListener('input', updateFormulaPreview);
    }

    if (saveConfirmBtn) {
        saveConfirmBtn.addEventListener('click', () => {
            const latex = formulaTextarea.value.trim();
            const description = versionDescInput.value.trim();
            const category = categorySelect.value;
            
            if (!latex) {
                alert('请输入公式');
                return;
            }
            
            const validation = formulaManager.validateFormula(latex);
            if (!validation.valid) {
                alert(`公式格式错误: ${validation.error}`);
                return;
            }
            
            try {
                formulaManager.saveFormulaVersion(latex, description, category);
                closeModal();
                updateVersionSelect();
                stateManager.calculate();
                alert('公式版本保存成功');
            } catch (err) {
                alert('保存失败: ' + err.message);
            }
        });
    }

    if (rollbackBtn) {
        rollbackBtn.addEventListener('click', () => {
            const versionId = parseInt(versionSelect.value);
            if (!versionId) {
                alert('请选择要回滚的版本');
                return;
            }
            
            if (confirm(`确定要回滚到版本 ${versionId} 吗？`)) {
                try {
                    formulaManager.rollbackFormulaVersion(versionId);
                    updateVersionSelect();
                    stateManager.calculate();
                    alert('回滚成功');
                } catch (err) {
                    alert('回滚失败: ' + err.message);
                }
            }
        });
    }

    if (importBtn && importInput) {
        importBtn.addEventListener('click', () => {
            importInput.click();
        });
        
        importInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            formulaManager.importFormulas(file)
                .then(result => {
                    updateVersionSelect();
                    stateManager.calculate();
                    alert(`导入成功: ${result.message}`);
                })
                .catch(err => {
                    alert('导入失败: ' + err.message);
                });
            
            importInput.value = '';
        });
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            formulaManager.exportFormulas();
        });
    }

    // Initial update
    updateVersionSelect();
}

window.ResourceEstimateApp = {
    stateManager,
    chartManager,
    performCalculation,
    updateFormulaDisplay,
    highlightCurrentFormulas,
    get lastCalculation() { return lastCalculation; },
    get lastParams() { return lastParams; }
};