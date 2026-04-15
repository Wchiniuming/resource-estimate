export const DEFAULT_PARAMS = {
    modelName: '',
    N_total: 7e9,
    attentionArch: 'MHA',
    ffnArch: 'Dense',
    N_total_act: 7e9,
    B: 1,
    S: 1024,
    s_out: 256,
    H: 4096,
    L: 32,
    A: 32,
    A_kv: 32,
    I: 11008,
    V: 32000,
    D: 2,
    D_kv: 2,
    D_act: 2,
    E: 8,
    k: 2,
    d_ff: 1408,
    Q: 1.0,
    d_h: 128,
    C_catch: 1,
    theta: 0.1,
    T: 1280,
    e: 0.3,
    n_tp: 1,
    n_pp: 1,
    n_ep: 1,
    serverType: '',
    FLOPS_percard: 1e15,
    U_compute: 0.65,
    epsilon: 0.9,
    is_cross_node: false,
    M_card: 80e9,
    U_memory: 0.8,
    M_reserve: 1e9,
    BW_nvlink: 900e9,
    BW_net: 50e9,
    eta_nvlink: 0.8,
    eta_net: 0.6,
    QPS_target: 1,
    QPS_redundancy: 0.3
};

export const VALIDATION_RANGES = {
    N_total: { min: 1e6, max: 1e15, required: true },
    attentionArch: { values: ['MHA', 'GQA', 'MQA'], required: true },
    ffnArch: { values: ['Dense', 'MoE'], required: true },
    B: { min: 1, max: 65536, required: true },
    S: { min: 1, max: 1000000, required: true },
    s_out: { min: 1, max: 1000000, required: true },
    H: { min: 1, max: 65536, required: true },
    L: { min: 1, max: 1000, required: true },
    A: { min: 1, max: 256, required: true },
    A_kv: { min: 1, max: 256, required: true },
    n_tp: { min: 1, max: 16, required: true },
    n_pp: { min: 1, max: 16, required: true },
    n_ep: { min: 1, max: 16, required: true },
    E: { min: 1, max: 256, required: true },
    k: { min: 1, max: 64, required: true },
    d_ff: { min: 1, max: 65536, required: true },
    D: { min: 0.5, max: 8, required: true },
    D_kv: { min: 1, max: 8, required: true },
    D_act: { min: 1, max: 8, required: true },
    FLOPS_percard: { min: 1e9, max: 1e16, required: true },
    U_compute: { min: 0.1, max: 1.0, required: true },
    epsilon: { min: 0.7, max: 0.95, required: true },
    M_card: { min: 1e9, max: 1e12, required: true },
    U_memory: { min: 0.1, max: 1.0, required: true },
    M_reserve: { min: 0, max: 1e11, required: true },
    BW_nvlink: { min: 1e9, max: 1e12, required: true },
    BW_net: { min: 1e9, max: 1e12, required: true },
    eta_nvlink: { min: 0.7, max: 0.9, required: true },
    eta_net: { min: 0.5, max: 0.7, required: true },
    QPS_target: { min: 0.001, max: 1000000, required: true },
    QPS_redundancy: { min: 0, max: 10, required: true },
    Q: { min: 0.5, max: 4.0, required: true },
    d_h: { min: 1, max: 8192, required: true },
    C_catch: { min: 0.5, max: 2.0, required: true },
    theta: { min: 0.05, max: 0.3, required: true },
    T: { min: 2, max: 2000000, required: true },
    e: { min: 0, max: 10, required: true }
};

export class StateManager {
    constructor() {
        this.state = {
            params: { ...DEFAULT_PARAMS },
            results: {
                flops: null,
                memory: null,
                bandwidth: null,
                finalGPUCount: 0,
                isValid: false
            },
            ui: {
                activeTab: 'model',
                selectedFormulaVersion: 'v1.0',
                isCalculating: false,
                lastCalculationTime: null,
                errors: {}
            }
        };
        
        this.listeners = new Map();
        this.debounceTimer = null;
        this.debounceDelay = 100;
        this.calculateQueue = [];
        this.isCalculating = false;
        
        this.loadFromStorage();
    }
    
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
        return () => this.off(event, callback);
    }
    
    off(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }
    }
    
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data, this.state);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }
    
    getParam(key) {
        return this.state.params[key];
    }
    
    getAllParams() {
        return { ...this.state.params };
    }
    
    setParam(key, value, triggerCalculation = true) {
        const oldValue = this.state.params[key];
        if (oldValue === value) return;
        
        const validation = this.validateParam(key, value);
        if (!validation.valid) {
            console.error(`Validation failed for key "${key}":`, validation.message, 'value:', value);
            this.setError(key, validation.message);
            return;
        }
        
        this.clearError(key);
        this.state.params[key] = value;
        
        if (key === 'H' || key === 'A') {
            const H = this.state.params.H;
            const A = this.state.params.A;
            this.state.params.d_h = H / A;
        }
        if (key === 'S' || key === 's_out') {
            const S = this.state.params.S;
            const s_out = this.state.params.s_out;
            const newT = S + s_out;
            if (this.state.params.T !== newT) {
                this.state.params.T = newT;
                this.emit('paramsChanged', { 
                    key: 'T', 
                    value: newT, 
                    oldValue: this.state.params.T,
                    params: this.state.params,
                    keys: ['T'],
                    derived: true
                });
            }
        }
        if (key === 'QPS_target' || key === 'QPS_redundancy') {
            const QPS_target = this.state.params.QPS_target;
            const QPS_redundancy = this.state.params.QPS_redundancy;
            const newE = QPS_target * QPS_redundancy;
            if (this.state.params.e !== newE) {
                this.state.params.e = newE;
                this.emit('paramsChanged', { 
                    key: 'e', 
                    value: newE, 
                    oldValue: this.state.params.e,
                    params: this.state.params,
                    keys: ['e'],
                    derived: true
                });
            }
        }
        
        this.emit('paramsChanged', { 
            key, 
            value, 
            oldValue, 
            params: this.state.params,
            keys: [key]
        });
        this.emit('stateChanged', this.state);
        this.saveToStorage();
        
        if (triggerCalculation) {
            this.debouncedCalculate();
        }
    }
    
    setParams(params, triggerCalculation = true) {
        let hasChanges = false;
        const changedKeys = [];
        
        Object.entries(params).forEach(([key, value]) => {
            if (this.state.params[key] !== value) {
                this.state.params[key] = value;
                hasChanges = true;
                changedKeys.push(key);
            }
        });
        
        if (hasChanges) {
            this.emit('paramsChanged', { 
                params: this.state.params, 
                keys: changedKeys,
                changedParams: params
            });
            this.emit('stateChanged', this.state);
            this.saveToStorage();
            
            if (triggerCalculation) {
                this.debouncedCalculate();
            }
        }
    }
    
    validateParam(key, value) {
        const range = VALIDATION_RANGES[key];
        if (!range) return { valid: true, message: '' };
        
        if (range.required && (value === null || value === undefined || value === '')) {
            return { valid: false, message: `${key} is required` };
        }
        
        if (range.values && !range.values.includes(value)) {
            return { valid: false, message: `${key} must be one of: ${range.values.join(', ')}` };
        }
        
        if (typeof value === 'number') {
            if (range.min !== undefined && value < range.min) {
                return { valid: false, message: `${key} must be >= ${range.min}` };
            }
            if (range.max !== undefined && value > range.max) {
                return { valid: false, message: `${key} must be <= ${range.max}` };
            }
        }
        
        return { valid: true, message: '' };
    }
    
    validateAllParams() {
        const errors = {};
        Object.keys(this.state.params).forEach(key => {
            const validation = this.validateParam(key, this.state.params[key]);
            if (!validation.valid) {
                errors[key] = validation.message;
            }
        });
        return { valid: Object.keys(errors).length === 0, errors };
    }
    
    setError(key, message) {
        this.state.ui.errors[key] = message;
        this.emit('error', { key, message });
    }
    
    clearError(key) {
        delete this.state.ui.errors[key];
    }
    
    clearAllErrors() {
        this.state.ui.errors = {};
    }
    
    getErrors() {
        return { ...this.state.ui.errors };
    }
    
    hasErrors() {
        return Object.keys(this.state.ui.errors).length > 0;
    }
    
    getResults() {
        return { ...this.state.results };
    }
    
    setResults(results) {
        this.state.results = { ...this.state.results, ...results };
        this.state.ui.lastCalculationTime = new Date().toISOString();
        this.state.ui.isCalculating = false;
        this.isCalculating = false;
        
        if (this.calculateQueue.length > 0) {
            this.calculateQueue = [];
            this.debouncedCalculate();
        }
        
        this.emit('resultsChanged', this.state.results);
        this.emit('stateChanged', this.state);
    }
    
    getUIState() {
        return { ...this.state.ui };
    }
    
    setUIState(uiState) {
        this.state.ui = { ...this.state.ui, ...uiState };
        this.emit('uiChanged', this.state.ui);
        this.emit('stateChanged', this.state);
    }
    
    setActiveTab(tab) {
        this.state.ui.activeTab = tab;
        this.emit('uiChanged', this.state.ui);
    }
    
    setCalculating(isCalculating) {
        this.state.ui.isCalculating = isCalculating;
        this.emit('uiChanged', this.state.ui);
    }
    
    debouncedCalculate() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.debounceTimer = setTimeout(() => {
            this.processCalculateQueue();
        }, this.debounceDelay);
    }
    
    processCalculateQueue() {
        if (this.isCalculating) {
            this.calculateQueue.push(Date.now());
            if (this.calculateQueue.length > 3) {
                this.calculateQueue = this.calculateQueue.slice(-3);
            }
            return;
        }
        this.isCalculating = true;
        this.calculate();
    }
    
    batchUpdate(params) {
        let hasChanges = false;
        const changedKeys = [];
        Object.entries(params).forEach(([key, value]) => {
            if (this.state.params[key] !== value) {
                this.state.params[key] = value;
                hasChanges = true;
                changedKeys.push(key);
            }
        });
        
        if (hasChanges) {
            const S = this.state.params.S;
            const s_out = this.state.params.s_out;
            this.state.params.T = S + s_out;
            
            const QPS_target = this.state.params.QPS_target;
            const QPS_redundancy = this.state.params.QPS_redundancy;
            this.state.params.e = QPS_target * QPS_redundancy;
            
            this.emit('paramsChanged', { 
                params: this.state.params,
                keys: changedKeys,
                changedParams: params
            });
            this.emit('stateChanged', this.state);
            this.saveToStorage();
            this.debouncedCalculate();
        }
    }
    
    calculate() {
        this.setCalculating(true);
        this.emit('calculate', {
            params: this.state.params,
            timestamp: new Date().toISOString()
        });
    }
    
    resetToDefaults() {
        this.state.params = { ...DEFAULT_PARAMS };
        this.clearAllErrors();
        this.emit('paramsChanged', { params: this.state.params, reset: true, keys: Object.keys(DEFAULT_PARAMS) });
        this.emit('stateChanged', this.state);
        this.saveToStorage();
        this.debouncedCalculate();
    }
    
    saveToStorage() {
        try {
            const stateToSave = {
                params: this.state.params,
                ui: {
                    activeTab: this.state.ui.activeTab,
                    selectedFormulaVersion: this.state.ui.selectedFormulaVersion
                },
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('resourceEstimateState', JSON.stringify(stateToSave));
        } catch (error) {
            console.warn('Failed to save state to localStorage:', error);
        }
    }
    
    loadFromStorage() {
        try {
            const savedState = localStorage.getItem('resourceEstimateState');
            if (savedState) {
                const parsed = JSON.parse(savedState);
                if (parsed.params) {
                    this.state.params = { ...DEFAULT_PARAMS, ...parsed.params };
                }
                if (parsed.ui) {
                    this.state.ui = { ...this.state.ui, ...parsed.ui };
                }
            }
        } catch (error) {
            console.warn('Failed to load state from localStorage:', error);
        }
    }
}

export default StateManager;
