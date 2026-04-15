/**
 * Visualization Components
 * Intelligent Computing Resource Assessment Platform
 * 
 * Provides visualization for calculation results including:
 * - GPU count cards for FLOPs/CACHE/BW dimensions
 * - Chart.js integration (bar charts, pie charts)
 * - Intermediate results breakdown
 * - Number formatting utilities
 */

// ==================== Number Formatter ====================

/**
 * Utility class for formatting large numbers
 */
export class NumberFormatter {
    /**
     * Format a number with appropriate suffix (K, M, G, T, P)
     * @param {number} num - Number to format
     * @param {number} decimals - Number of decimal places (default: 2)
     * @returns {string} Formatted string
     */
    static formatWithSuffix(num, decimals = 2) {
        if (!isFinite(num) || isNaN(num)) return '0';
        if (num === 0) return '0';
        
        const absNum = Math.abs(num);
        
        if (absNum >= 1e15) {
            return (num / 1e15).toFixed(decimals) + 'P';
        } else if (absNum >= 1e12) {
            return (num / 1e12).toFixed(decimals) + 'T';
        } else if (absNum >= 1e9) {
            return (num / 1e9).toFixed(decimals) + 'G';
        } else if (absNum >= 1e6) {
            return (num / 1e6).toFixed(decimals) + 'M';
        } else if (absNum >= 1e3) {
            return (num / 1e3).toFixed(decimals) + 'K';
        } else {
            return num.toFixed(decimals);
        }
    }
    
    /**
     * Format bytes to human-readable size (GB, TB, etc.)
     * @param {number} bytes - Number of bytes
     * @param {number} decimals - Number of decimal places
     * @returns {string} Formatted string with unit
     */
    static formatBytes(bytes, decimals = 2) {
        if (!isFinite(bytes) || isNaN(bytes)) return '0 B';
        if (bytes === 0) return '0 B';
        
        const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
        const k = 1024;
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        const unitIndex = Math.min(i, units.length - 1);
        
        return parseFloat((bytes / Math.pow(k, unitIndex)).toFixed(decimals)) + ' ' + units[unitIndex];
    }
    
    /**
     * Format FLOPs to human-readable (PFLOPs, TFLOPs, etc.)
     * @param {number} flops - Number of FLOPs
     * @param {number} decimals - Number of decimal places
     * @returns {string} Formatted string
     */
    static formatFLOPs(flops, decimals = 2) {
        if (!isFinite(flops) || isNaN(flops)) return '0 FLOPs';
        if (flops === 0) return '0 FLOPs';
        
        if (flops >= 1e15) {
            return (flops / 1e15).toFixed(decimals) + ' PFLOPs';
        } else if (flops >= 1e12) {
            return (flops / 1e12).toFixed(decimals) + ' TFLOPs';
        } else if (flops >= 1e9) {
            return (flops / 1e9).toFixed(decimals) + ' GFLOPs';
        } else if (flops >= 1e6) {
            return (flops / 1e6).toFixed(decimals) + ' MFLOPs';
        } else {
            return flops.toFixed(decimals) + ' FLOPs';
        }
    }
    
    /**
     * Format a number with thousands separator
     * @param {number} num - Number to format
     * @returns {string} Formatted string
     */
    static formatNumber(num) {
        if (!isFinite(num) || isNaN(num)) return '0';
        return num.toLocaleString('en-US');
    }
    
    /**
     * Format percentage
     * @param {number} value - Value between 0 and 1
     * @param {number} decimals - Number of decimal places
     * @returns {string} Formatted percentage
     */
    static formatPercent(value, decimals = 1) {
        if (!isFinite(value) || isNaN(value)) return '0%';
        return (value * 100).toFixed(decimals) + '%';
    }
}

// ==================== Result Renderer ====================

/**
 * Class for rendering calculation result cards and displays
 */
export class ResultRenderer {
    /**
     * Create a result card element
     * @param {Object} options - Card options
     * @param {string} options.title - Card title
     * @param {string|number} options.value - Main value to display
     * @param {string} options.unit - Unit suffix
     * @param {string} options.color - Color theme ('blue', 'red', 'green', 'purple', 'orange')
     * @param {string} options.subtitle - Optional subtitle
     * @param {Array} options.details - Array of detail objects {label, value}
     * @returns {HTMLElement} Card element
     */
    static createResultCard(options) {
        const {
            title,
            value,
            unit = '',
            color = 'blue',
            subtitle = '',
            details = [],
            customStyles = {},
            titleColor = '',
            valueColor = ''
        } = options;

        const colorClasses = {
            blue: 'bg-[rgba(0,212,255,0.1)] border-[rgba(0,212,255,0.3)] text-[var(--text-primary)]',
            red: 'bg-[rgba(255,99,132,0.1)] border-[rgba(255,99,132,0.3)] text-[var(--text-primary)]',
            green: 'bg-[rgba(75,192,192,0.1)] border-[rgba(75,192,192,0.3)] text-[var(--text-primary)]',
            purple: 'bg-[rgba(139,92,246,0.1)] border-[rgba(139,92,246,0.3)] text-[var(--text-primary)]',
            orange: 'bg-[rgba(255,159,64,0.1)] border-[rgba(255,159,64,0.3)] text-[var(--text-primary)]',
            gray: 'bg-[rgba(148,163,184,0.1)] border-[rgba(148,163,184,0.3)] text-[var(--text-secondary)]',
            cyan: 'bg-[rgba(0,212,255,0.1)] border-[rgba(0,212,255,0.3)] text-[var(--text-primary)]',
            violet: 'bg-[rgba(139,92,246,0.1)] border-[rgba(139,92,246,0.3)] text-[var(--text-primary)]',
            emerald: 'bg-[rgba(16,185,129,0.1)] border-[rgba(16,185,129,0.3)] text-[var(--text-primary)]',
            amber: 'bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.3)] text-[var(--text-primary)]'
        };

        const card = document.createElement('div');
        card.className = `rounded-lg border p-4 ${colorClasses[color] || colorClasses.blue}`;

        // Apply custom styles if provided
        if (customStyles && Object.keys(customStyles).length > 0) {
            Object.assign(card.style, customStyles);
        }

        const titleStyle = titleColor ? `color: ${titleColor};` : 'color: var(--text-secondary);';
        const valueStyle = valueColor ? `color: ${valueColor};` : 'color: var(--text-primary);';

        let html = `
            <div class="flex items-center justify-between mb-2">
                <h3 class="text-sm font-medium" style="${titleStyle}">${title}</h3>
                ${subtitle ? `<span class="text-xs" style="color: var(--text-tertiary);">${subtitle}</span>` : ''}
            </div>
            <div class="flex items-baseline gap-1">
                <span class="text-3xl font-bold" style="${valueStyle}">${value}</span>
                ${unit ? `<span class="text-lg" style="color: var(--text-secondary);">${unit}</span>` : ''}
            </div>
        `;

        if (details && details.length > 0) {
            html += `<div class="mt-3 pt-3 space-y-1" style="border-top: 1px solid rgba(148, 163, 184, 0.2);">`;
            details.forEach(detail => {
                html += `
                    <div class="flex justify-between text-xs">
                        <span style="color: var(--text-tertiary);">${detail.label}</span>
                        <span class="font-medium" style="color: var(--text-secondary);">${detail.value}</span>
                    </div>
                `;
            });
            html += '</div>';
        }

        card.innerHTML = html;
        return card;
    }
    
    /**
     * Create GPU count summary cards with calculation formulas
     * @param {Object} results - Calculation results from all three dimensions
     * @returns {HTMLElement} Container with GPU count cards
     */
    static createGPUCountSummary(results) {
        const fragment = document.createDocumentFragment();
        const { flops, memory, bandwidth, config } = results;
        
        const flopsCount = flops?.limit?.gpuCount || 0;
        const memoryCount = memory?.cacheLimit?.gpuCount || 0;
        const bandwidthCount = bandwidth?.bwLimit?.gpuCount || 0;
        const finalGPUCount = Math.max(flopsCount, memoryCount, bandwidthCount);
        
        const bottleneck = memoryCount >= flopsCount && memoryCount >= bandwidthCount ? 'memory' :
                          bandwidthCount >= flopsCount && bandwidthCount >= memoryCount ? 'bandwidth' : 'flops';
        
        const totalFLOPs = flops?.limit?.totalFLOPsRequired || 0;
        const singleCardFLOPs = flops?.limit?.FLOPS_percard || config?.FLOPS_percard || 0;
        const totalMemory = (memory?.cacheLimit?.modelWeight || 0) + (memory?.cacheLimit?.totalKVWithQPS || 0);
        const singleCardMemory = memory?.cacheLimit?.singleGpuMemory || config?.M_card || 0;
        const totalBW = (bandwidth?.bwLimit?.V_high || 0) + (bandwidth?.bwLimit?.V_low || 0);
        const singleCardBW = bandwidth?.bwLimit?.singleGpuBW || config?.BW_nvlink || config?.BW_net || 0;
        
        const container = document.createElement('div');
        container.innerHTML = `
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- 算力维度 -->
                ${this.createCardWithFormula('算力维度', flopsCount, 'cyan', bottleneck === 'flops', [
                    { label: '总需求', value: NumberFormatter.formatFLOPs(totalFLOPs) },
                    { label: '单卡峰值', value: NumberFormatter.formatFLOPs(singleCardFLOPs) },
                    { label: '计算式', value: `ceil(${NumberFormatter.formatWithSuffix(totalFLOPs, 0)}/${NumberFormatter.formatWithSuffix(singleCardFLOPs, 0)})=${flopsCount}` }
                ])}
                
                <!-- 显存维度 -->
                ${this.createCardWithFormula('显存维度', memoryCount, 'violet', bottleneck === 'memory', [
                    { label: '总需求', value: NumberFormatter.formatBytes(totalMemory) },
                    { label: '单卡显存', value: NumberFormatter.formatBytes(singleCardMemory) },
                    { label: '计算式', value: `ceil(${NumberFormatter.formatWithSuffix(totalMemory, 0)}/${NumberFormatter.formatWithSuffix(singleCardMemory, 0)})=${memoryCount}` }
                ])}
                
                <!-- 带宽维度 -->
                ${this.createCardWithFormula('带宽维度', bandwidthCount, 'emerald', bottleneck === 'bandwidth', [
                    { label: '总需求', value: NumberFormatter.formatBytes(totalBW) },
                    { label: '单卡带宽', value: NumberFormatter.formatBytes(singleCardBW) + '/s' },
                    { label: '计算式', value: `ceil(${NumberFormatter.formatWithSuffix(totalBW, 0)}/${NumberFormatter.formatWithSuffix(singleCardBW, 0)})=${bandwidthCount}` }
                ])}
                
                <!-- 最终推荐 -->
                ${this.createFinalCard(finalGPUCount, flopsCount, memoryCount, bandwidthCount, bottleneck)}
            </div>
        `;
        
        fragment.appendChild(container);
        return fragment;
    }
    
    /**
     * Create a card with formula display
     */
    static createCardWithFormula(title, value, color, isBottleneck, details) {
        const colors = {
            cyan: { primary: '#00d4ff', bg: 'rgba(0, 212, 255, 0.08)', border: 'rgba(0, 212, 255, 0.3)' },
            violet: { primary: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.08)', border: 'rgba(139, 92, 246, 0.3)' },
            emerald: { primary: '#10b981', bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.3)' }
        };
        const c = colors[color] || colors.cyan;
        
        const isBottleStyle = isBottleneck ? 'border-2 border-orange-400 bg-orange-500/10' : '';
        
        return `
            <div class="rounded-lg p-4 border-l-3 ${isBottleStyle}" style="border-left-color: ${c.primary}; background: linear-gradient(135deg, ${c.bg} 0%, transparent 60%);">
                <div class="flex items-center gap-2 mb-2">
                    <svg class="w-4 h-4" style="color: ${c.primary};" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                    <span class="text-sm font-medium" style="color: ${c.primary};">${title}</span>
                    ${isBottleneck ? '<span class="ml-auto text-xs text-orange-400 font-medium">瓶颈</span>' : ''}
                </div>
                <div class="flex items-baseline gap-1 mb-3">
                    <span class="text-3xl font-bold" style="color: ${isBottleneck ? '#fb923c' : c.primary};">${value}</span>
                    <span class="text-lg" style="color: var(--text-secondary);">GPU</span>
                </div>
                <div class="space-y-1 pt-2 text-xs" style="border-top: 1px solid var(--border-color);">
                    ${details.map(d => `
                        <div class="flex justify-between">
                            <span style="color: var(--text-tertiary);">${d.label}</span>
                            <span style="color: var(--text-secondary);">${d.value}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Create final recommendation card
     */
    static createFinalCard(value, flopsCount, memoryCount, bandwidthCount, bottleneck) {
        const formula = `N_gpu = max(${flopsCount}, ${memoryCount}, ${bandwidthCount}) = ${value}`;
        
        return `
            <div class="rounded-lg p-4 border-l-3" style="border-left-color: #f59e0b; background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, transparent 60%);">
                <div class="flex items-center gap-2 mb-2">
                    <svg class="w-4 h-4" style="color: #f59e0b;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span class="text-sm font-medium" style="color: #f59e0b;">最终推荐</span>
                </div>
                <div class="flex items-baseline gap-1 mb-3">
                    <span class="text-3xl font-bold" style="color: #f59e0b;">${value}</span>
                    <span class="text-lg" style="color: var(--text-secondary);">GPU</span>
                </div>
                <div class="pt-2 text-xs" style="border-top: 1px solid var(--border-color);">
                    <div class="flex justify-between mb-1">
                        <span style="color: var(--text-tertiary);">算力</span>
                        <span style="color: var(--text-secondary);">${flopsCount}</span>
                    </div>
                    <div class="flex justify-between mb-1">
                        <span style="color: var(--text-tertiary);">显存</span>
                        <span style="color: var(--text-secondary);">${memoryCount}</span>
                    </div>
                    <div class="flex justify-between mb-2">
                        <span style="color: var(--text-tertiary);">带宽</span>
                        <span style="color: var(--text-secondary);">${bandwidthCount}</span>
                    </div>
                    <div class="pt-2" style="border-top: 1px solid var(--border-color);">
                        <span style="color: #f59e0b;">${formula}</span>
                    </div>
                    <div class="mt-1 text-xs" style="color: var(--text-tertiary);">
                        取三个维度的最大需求值
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Create intermediate results display
     * @param {Object} results - Full calculation results
     * @returns {HTMLElement} Intermediate results container
     */
    static createIntermediateResults(results) {
        const container = document.createElement('div');
        container.className = 'space-y-4';
        
        const { flops, memory, bandwidth, config } = results;
        
        // FLOPs breakdown section
        if (flops) {
            const flopsSection = document.createElement('div');
            flopsSection.className = 'result-card';
            flopsSection.style.cssText = 'padding: var(--space-md); margin-bottom: var(--space-md); border-left: 4px solid #00d4ff;';
            flopsSection.innerHTML = `
                <h3 class="text-lg font-bold mb-4 flex items-center" style="color: #00d4ff;">
                    <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"/></svg>
                    算力限制 (FLOPs)
                </h3>
                <div class="grid grid-cols-2 gap-3 text-sm">
                    <div class="flex justify-between">
                        <span style="color: var(--text-tertiary);">Prefill FLOPs:</span>
                        <span class="font-medium" style="color: var(--text-primary);">${NumberFormatter.formatFLOPs(flops?.perSample?.prefill || 0)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span style="color: var(--text-tertiary);">Decode FLOPs:</span>
                        <span class="font-medium" style="color: var(--text-primary);">${NumberFormatter.formatFLOPs(flops?.perSample?.decode || 0)}</span>
                    </div>
                    <div class="flex justify-between col-span-2 pt-3 mt-1" style="border-top: 1px solid var(--border-color);">
                        <span class="font-semibold" style="color: var(--text-primary);">单样本总FLOPs:</span>
                        <span class="font-bold text-lg" style="color: #00d4ff;">${NumberFormatter.formatFLOPs(flops?.perSample?.total || 0)}</span>
                    </div>
                </div>
            `;
            container.appendChild(flopsSection);
        }
        
        // Memory breakdown section
        if (memory) {
            const memorySection = document.createElement('div');
            memorySection.className = 'result-card';
            memorySection.style.cssText = 'padding: var(--space-md); margin-bottom: var(--space-md); border-left: 4px solid #8b5cf6;';
            memorySection.innerHTML = `
                <h3 class="text-lg font-bold mb-4 flex items-center" style="color: #8b5cf6;">
                    <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3 1h10v2H5V6zm0 3h10v2H5V9zm0 3h5v2H5v-2z"/></svg>
                    显存限制 (Memory)
                </h3>
                <div class="space-y-3">
                    <div class="grid grid-cols-3 gap-2 text-sm">
                        <div class="rounded p-2 text-center" style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3);">
                            <div style="color: var(--text-tertiary); font-size: 0.75rem; margin-bottom: 0.25rem;">模型权重</div>
                            <div class="font-medium" style="color: #8b5cf6;">${NumberFormatter.formatBytes(memory.modelWeight || 0)}</div>
                        </div>
                        <div class="rounded p-2 text-center" style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3);">
                            <div style="color: var(--text-tertiary); font-size: 0.75rem; margin-bottom: 0.25rem;">激活值</div>
                            <div class="font-medium" style="color: #8b5cf6;">${NumberFormatter.formatBytes(memory.activation || 0)}</div>
                        </div>
                        <div class="rounded p-2 text-center" style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3);">
                            <div style="color: var(--text-tertiary); font-size: 0.75rem; margin-bottom: 0.25rem;">KV缓存(单请求)</div>
                            <div class="font-medium" style="color: #8b5cf6;">${NumberFormatter.formatBytes(memory.kv?.perRequest || 0)}</div>
                        </div>
                    </div>
                    <div class="flex justify-between items-center pt-3 text-sm mt-1" style="border-top: 1px solid var(--border-color);">
                        <span class="font-semibold" style="color: var(--text-primary);">KV缓存(含QPS冗余):</span>
                        <span class="font-bold text-lg" style="color: #8b5cf6;">${NumberFormatter.formatBytes(memory.kv?.totalWithQPS || 0)}</span>
                    </div>
                </div>
            `;
            container.appendChild(memorySection);
        }
        
        // Bandwidth breakdown section
        if (bandwidth) {
            const bandwidthSection = document.createElement('div');
            bandwidthSection.className = 'result-card';
            bandwidthSection.style.cssText = 'padding: var(--space-md); margin-bottom: var(--space-md); border-left: 4px solid #10b981;';
            bandwidthSection.innerHTML = `
                <h3 class="text-lg font-bold mb-4 flex items-center" style="color: #10b981;">
                    <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/></svg>
                    带宽限制 (Bandwidth)
                </h3>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div class="rounded p-3" style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3);">
                        <div style="color: #10b981; font-size: 0.875rem; font-weight: 600; margin-bottom: 0.75rem;">高频通信 (NVLink/HCCS)</div>
                        <div class="space-y-2">
                            <div class="flex justify-between">
                                <span style="color: var(--text-tertiary);">通信量 V_high:</span>
                                <span class="font-medium" style="color: var(--text-primary);">${NumberFormatter.formatBytes(bandwidth.highFreq || 0)}</span>
                            </div>
                            <div class="flex justify-between pt-1" style="border-top: 1px solid rgba(16, 185, 129, 0.2);">
                                <span style="color: var(--text-tertiary);">最大QPS:</span>
                                <span class="font-bold" style="color: #10b981;">${NumberFormatter.formatNumber(Math.floor(bandwidth.qpsMax?.highFreq || 0))} req/s</span>
                            </div>
                        </div>
                    </div>
                    <div class="rounded p-3" style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3);">
                        <div style="color: #10b981; font-size: 0.875rem; font-weight: 600; margin-bottom: 0.75rem;">低频通信 (PCIe/RDMA)</div>
                        <div class="space-y-2">
                            <div class="flex justify-between">
                                <span style="color: var(--text-tertiary);">通信量 V_low:</span>
                                <span class="font-medium" style="color: var(--text-primary);">${NumberFormatter.formatBytes(bandwidth.lowFreq || 0)}</span>
                            </div>
                            <div class="flex justify-between pt-1" style="border-top: 1px solid rgba(16, 185, 129, 0.2);">
                                <span style="color: var(--text-tertiary);">最大QPS:</span>
                                <span class="font-bold" style="color: #10b981;">${NumberFormatter.formatNumber(Math.floor(bandwidth.qpsMax?.lowFreq || 0))} req/s</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="mt-3 pt-3 flex justify-between items-center" style="border-top: 1px solid var(--border-color);">
                    <span class="text-sm" style="color: var(--text-tertiary);">理论最大QPS (单副本):</span>
                    <span class="font-semibold" style="color: var(--accent-primary);">${NumberFormatter.formatNumber(Math.floor(bandwidth.qpsMax || 0))} req/s</span>
                </div>
            `;
            container.appendChild(bandwidthSection);
        }
        
        // Formula trace section
        if (config) {
            const formulaSection = document.createElement('div');
            formulaSection.className = 'result-card';
            formulaSection.style.cssText = 'padding: var(--space-md); margin-bottom: var(--space-md);';
            formulaSection.innerHTML = `
                <h4 class="text-sm font-semibold mb-3" style="color: var(--text-primary);">公式配置信息</h4>
                <div class="grid grid-cols-3 gap-3 text-sm">
                    <div class="flex items-center gap-2">
                        <span class="w-2 h-2 bg-blue-400 rounded-full"></span>
                        <span style="color: var(--text-tertiary);">注意力架构:</span>
                        <span class="font-medium" style="color: var(--text-primary);">${config.attentionArch || 'MHA'}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="w-2 h-2 bg-green-400 rounded-full"></span>
                        <span style="color: var(--text-tertiary);">FFN架构:</span>
                        <span class="font-medium" style="color: var(--text-primary);">${config.ffnArch || 'Dense'}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="w-2 h-2 bg-purple-400 rounded-full"></span>
                        <span style="color: var(--text-tertiary);">并行策略:</span>
                        <span class="font-medium" style="color: var(--text-primary);">TP${config.n_tp || 1}×PP${config.n_pp || 1}${config.n_ep > 1 ? '×EP' + config.n_ep : ''}</span>
                    </div>
                </div>
            `;
            container.appendChild(formulaSection);
        }
        
        return container;
    }
}

// ==================== Chart Manager ====================

/**
 * Class for managing Chart.js charts
 */
export class ChartManager {
    /**
     * Create a new ChartManager instance
     * @param {string} containerId - Container element ID
     */
    constructor() {
        this.charts = {};
        this.pendingUpdates = new Map();
        this.rafId = null;
    }
    
    queueChartUpdate(canvasId, chartType, data) {
        this.pendingUpdates.set(canvasId, { type: chartType, data });
        
        if (!this.rafId) {
            this.rafId = requestAnimationFrame(() => this.processPendingUpdates());
        }
    }
    
    processPendingUpdates() {
        this.rafId = null;
        
        this.pendingUpdates.forEach((update, canvasId) => {
            if (update.type === 'bar') {
                this.createGPUCountBarChart(canvasId, update.data);
            } else if (update.type === 'doughnut') {
                this.createMemoryPieChart(canvasId, update.data);
            }
        });
        
        this.pendingUpdates.clear();
    }
    
    createGPUCountBarChart(canvasId, data) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || typeof Chart === 'undefined') {
            return;
        }
        
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
            delete this.charts[canvasId];
        }
        
        const flops = parseFloat(data?.flops) || 0;
        const memory = parseFloat(data?.memory) || 0;
        const bandwidth = parseFloat(data?.bandwidth) || 0;
        const maxValue = Math.max(flops, memory, bandwidth, 1);
        
        const ctx = canvas.getContext('2d');
        
        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['算力维度', '显存维度', '带宽维度'],
                datasets: [{
                    label: '所需GPU数量',
                    data: [flops, memory, bandwidth],
                    backgroundColor: [
                        'rgba(0, 212, 255, 0.8)',
                        'rgba(139, 92, 246, 0.8)',
                        'rgba(16, 185, 129, 0.8)'
                    ],
                    borderColor: [
                        'rgba(0, 212, 255, 1)',
                        'rgba(139, 92, 246, 1)',
                        'rgba(16, 185, 129, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#f8fafc',
                        bodyColor: '#f8fafc',
                        borderColor: 'rgba(0, 212, 255, 0.3)',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                return context.parsed.y + ' GPU';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        suggestedMax: maxValue * 1.2,
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)'
                        },
                        ticks: {
                            color: '#94a3b8',
                            stepSize: Math.max(1, Math.ceil(maxValue / 5))
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#cbd5e1'
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Create a pie/doughnut chart for memory breakdown
     * @param {string} canvasId - Canvas element ID
     * @param {Object} data - Memory data {modelWeight, activation, kvCache}
     */
    createMemoryPieChart(canvasId, data) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || typeof Chart === 'undefined') return;
        
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }
        
        const { modelWeight = 0, activation = 0, kvCache = 0 } = data;
        const total = modelWeight + activation + kvCache;
        
        this.charts[canvasId] = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: ['模型权重', '激活值', 'KV缓存'],
                datasets: [{
                    data: [modelWeight, activation, kvCache],
                    backgroundColor: [
                        'rgba(139, 92, 246, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(16, 185, 129, 0.7)'
                    ],
                    borderColor: [
                        'rgba(139, 92, 246, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(16, 185, 129, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed;
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${context.label}: ${NumberFormatter.formatBytes(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    

    
    destroyChart(canvasId) {
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
            delete this.charts[canvasId];
        }
    }
    
    /**
     * Destroy all charts
     */
    destroyAll() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        
        Object.keys(this.charts).forEach(key => {
            if (this.charts[key]) {
                this.charts[key].destroy();
                delete this.charts[key];
            }
        });
        
        this.pendingUpdates.clear();
    }
}

// ==================== Visualization Update Function ====================

/**
 * Update all visualizations with new calculation results
 * @param {Object} results - Complete calculation results
 * @param {Object} chartManager - ChartManager instance
 * @param {string} containerId - Container element ID for results
 */
export function updateVisualizations(results, chartManager, containerId) {
    const container = document.getElementById(containerId);
    if (!container || !results) return;
    
    // Clear existing content
    container.innerHTML = '';
    
    // Create GPU count summary section
    const gpuSummary = ResultRenderer.createGPUCountSummary(results);
    container.appendChild(gpuSummary);
    
    // Create intermediate results section
    const intermediateResults = ResultRenderer.createIntermediateResults(results);
    container.appendChild(intermediateResults);
    
    // Update charts if chartManager is provided
    if (chartManager) {
        // Update GPU count bar chart
        if (results.flops && results.memory && results.bandwidth) {
            chartManager.createGPUCountBarChart('gpu-count-chart', {
                flops: results.flops.gpuCount,
                memory: results.memory.gpuCount,
                bandwidth: results.bandwidth.gpuCount
            });
        }
        
        // Update memory pie chart
        if (results.memory) {
            chartManager.createMemoryPieChart('memory-breakdown-chart', {
                modelWeight: results.memory.modelWeight || 0,
                activation: results.memory.activation || 0,
                kvCache: results.memory.kv?.totalWithQPS || 0
            });
        }
        
    }
}

// Export all components
export default {
    NumberFormatter,
    ResultRenderer,
    ChartManager,
    updateVisualizations
};
