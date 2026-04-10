/**
 * Formula Manager Module
 * Handles formula version management, storage, import, and export
 */

class FormulaManager {
  constructor() {
    this.STORAGE_KEY = 'formula_versions_v2';
    this.OLD_STORAGE_KEY = 'formula_versions';
    this.MAX_VERSIONS_PER_FORMULA = 20;
    this._initStorage();
    this._migrateOldData();
  }

  /**
   * Save a formula version for a specific formula
   * @param {string} formulaId - Unique formula ID (e.g. 'flops-prefill')
   * @param {string} latex - The LaTeX formula text
   * @param {string} description - Version description
   * @returns {Object} Newly created version
   */
  saveFormulaVersion(formulaId, latex, description = '') {
    const allVersions = this._getAllFormulaVersions();
    const formulaVersions = allVersions[formulaId] || [];
    
    const newVersion = {
      version: formulaVersions.length > 0 ? formulaVersions[0].version + 1 : 1,
      timestamp: Date.now(),
      latex: latex,
      description: description
    };
    
    formulaVersions.unshift(newVersion);
    
    // Trim to max versions
    if (formulaVersions.length > this.MAX_VERSIONS_PER_FORMULA) {
      formulaVersions.splice(this.MAX_VERSIONS_PER_FORMULA);
    }
    
    allVersions[formulaId] = formulaVersions;
    this._saveAllFormulaVersions(allVersions);
    
    return newVersion;
  }

  /**
   * Get all versions for a specific formula
   * @param {string} formulaId - Unique formula ID
   * @returns {Array} Array of versions for the formula
   */
  getFormulaVersions(formulaId) {
    const allVersions = this._getAllFormulaVersions();
    return allVersions[formulaId] || [];
  }

  /**
   * Rollback a specific formula to a specific version
   * @param {string} formulaId - Unique formula ID
   * @param {number} versionId - Version number to rollback to
   * @returns {Object|null} Newly created version or null
   */
  rollbackFormulaVersion(formulaId, versionId) {
    const allVersions = this._getAllFormulaVersions();
    const formulaVersions = allVersions[formulaId] || [];
    
    const targetVersion = formulaVersions.find(v => v.version === versionId);
    if (!targetVersion) {
      console.error('Version not found for rollback:', formulaId, versionId);
      return null;
    }
    
    return this.saveFormulaVersion(
      formulaId,
      targetVersion.latex,
      `Rollback to v${versionId}: ${targetVersion.description || ''}`
    );
  }
  
  /**
   * Get current/latest formula for a specific ID
   * @param {string} formulaId - Unique formula ID
   * @returns {string|null} Latest LaTeX formula or null
   */
  getCurrentFormula(formulaId) {
    const versions = this.getFormulaVersions(formulaId);
    return versions.length > 0 ? versions[0].latex : null;
  }

  /**
   * Export all formulas to JSON file
   */
  exportFormulas() {
    const versions = this.getAllVersions();
    if (versions.length === 0) {
      alert('No formula versions available to export');
      return;
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      versions: versions,
      totalVersions: versions.length
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `formula-versions-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Import formulas from JSON file
   * @param {File} file - JSON file to import
   * @returns {Promise<Object>} Result with success status
   */
  importFormulas(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          
          if (importedData.versions && Array.isArray(importedData.versions)) {
            const existingVersions = this.getAllVersions();
            const mergedVersions = [...importedData.versions, ...existingVersions];
            
            const uniqueVersions = [];
            const seen = new Set();
            mergedVersions.forEach(v => {
              if (!seen.has(v.version)) {
                seen.add(v.version);
                uniqueVersions.push(v);
              }
            });
            
            if (uniqueVersions.length > this.MAX_VERSIONS) {
              uniqueVersions.splice(this.MAX_VERSIONS);
            }
            
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(uniqueVersions));
            resolve({ success: true, count: importedData.versions.length, message: 'Imported successfully' });
          } else if (importedData.formulas) {
            const newVersion = this.createVersion(
              `Imported: ${importedData.name || 'Unknown'}`,
              importedData.description || 'Imported from JSON file',
              importedData.formulas
            );
            resolve({ success: true, version: newVersion, message: 'Imported successfully' });
          } else {
            reject(new Error('Invalid formula file format'));
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Get formula by category
   * @param {string} category - Category key (e.g., 'flops-prefill')
   * @returns {string|null} Formula text or null
   */
  getFormulaByCategory(category) {
    const latest = this.getLatestVersion();
    if (!latest) return null;
    
    return this._getFormulaValue(latest.formulas, category);
  }

  /**
   * Validate LaTeX formula syntax
   * @param {string} latex - LaTeX formula string
   * @returns {Object} Validation result
   */
  validateFormula(latex) {
    if (!latex || typeof latex !== 'string') {
      return { valid: false, error: 'Formula is empty or invalid' };
    }

    try {
      if (typeof katex !== 'undefined') {
        katex.renderToString(latex, { throwOnError: true });
        return { valid: true };
      }
      return { valid: true, warning: 'KaTeX not available for validation' };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  _updateFormulaByCategory(formulas, category, value) {
    const [dimension, type] = category.split('-');
    
    if (dimension === 'final') {
      formulas.final = value;
      return formulas;
    }
    
    if (formulas[dimension] && formulas[dimension][type] !== undefined) {
      if (typeof formulas[dimension][type] === 'object' && formulas[dimension][type].formula !== undefined) {
        formulas[dimension][type].formula = value;
      } else {
        formulas[dimension][type] = value;
      }
    }
    
    return formulas;
  }

  _getFormulaValue(formulas, category) {
    const [dimension, type] = category.split('-');
    
    if (dimension === 'final') {
      return typeof formulas.final === 'object' ? formulas.final.formula : formulas.final;
    }
    
    if (formulas[dimension] && formulas[dimension][type] !== undefined) {
      const value = formulas[dimension][type];
      return typeof value === 'object' ? value.formula : value;
    }
    
    return null;
  }

  /**
   * Create default formulas based on xuqiuV6.md specifications
   * @returns {Object} Default formulas object
   * @private
   */
  _createDefaultFormulas() {
    return {
      flops: {
        prefill: `FLOPs_{prefill} = L \\times (8BSH^2 + 4BS^2H + 4BSHI) + 2BSHV`,
        decode: `FLOPs_{decode} = L \\times (8BH^2 + 4BHT + 4BHI) + 2BHV`,
        total: `FLOPs_{persample} = \\frac{FLOPs_{prefill} + FLOPs_{decode}}{Q}`,
        gpuCount: `N_{FLOPS-limit} = \\left\\lceil\\frac{FLOPs_{total}}{FLOPS_{percard} \\times U_{compute} \\times \\varepsilon \\times (1 - \\theta \\times 0.1)}\\right\\rceil`
      },
      memory: {
        weight: `M_{model} = N_{total} \\times D`,
        activation: `M_{act} = B \\times (s + s_{out}) \\times H \\times L \\times D_{act}`,
        kv: `M_{kv} = 2 \\times L \\times H \\times D_{kv} \\times (s + s_{out})`,
        total: `M_{total} = M_{model} + M_{act} + M_{kv} + M_{reserve}`,
        gpuCount: `N_{CACHE-limit} = \\left\\lceil\\frac{QPS_{target} \\times M_{kv_{single}} + M_{model} + M_{act}}{M_{card} \\times U_{memory} - M_{reserve}}\\right\\rceil`
      },
      bandwidth: {
        high: `V_{high} = \\frac{L}{n_{pp}} \\times 4 \\times S \\times H \\times D_{act} \\times \\frac{n_{tp} - 1}{n_{tp}}`,
        low: `V_{low} = 2 \\times \\frac{S \\times H \\times D_{act}}{n_{tp}}`,
        qps: `QPS_{max} = \\min\\left(\\frac{BW_{nvlink} \\times \\eta_{nvlink}}{V_{high}}, \\frac{BW_{net} \\times \\eta_{net}}{V_{low}}\\right)`,
        gpuCount: `N_{BW-limit} = \\left\\lceil\\frac{QPS_{target}}{QPS_{max}}\\right\\rceil \\times \\frac{n_{tp} \\times n_{pp}}{n_{ep}}`
      },
      final: `N_{gpu} = \\max(N_{FLOPS-limit}, N_{CACHE-limit}, N_{BW-limit})`
    };
  }

  /**
   * Migrate old global version data to new per-formula structure
   * @private
   */
  _migrateOldData() {
    const oldData = localStorage.getItem(this.OLD_STORAGE_KEY);
    if (!oldData) return;
    
    try {
      const oldVersions = JSON.parse(oldData);
      if (!Array.isArray(oldVersions) || oldVersions.length === 0) return;
      
      const latestOldVersion = oldVersions[0];
      const allFormulas = this._flattenFormulas(latestOldVersion.formulas);
      
      const newAllVersions = {};
      
      // Create initial version for each formula
      Object.entries(allFormulas).forEach(([formulaId, latex]) => {
        newAllVersions[formulaId] = [{
          version: 1,
          timestamp: latestOldVersion.timestamp,
          latex: latex,
          description: 'Migrated from old global version'
        }];
      });
      
      this._saveAllFormulaVersions(newAllVersions);
      localStorage.removeItem(this.OLD_STORAGE_KEY);
      console.log('Formula data migrated to v2 format successfully');
    } catch (e) {
      console.error('Failed to migrate old formula data:', e);
    }
  }
  
  /**
   * Flatten nested formulas object to flat key-value pairs with formulaId keys
   * @param {Object} formulas - Nested formulas object
   * @returns {Object} Flat object with formulaId as keys
   * @private
   */
  _flattenFormulas(formulas) {
    const flat = {};
    
    // Flops dimension
    if (formulas.flops) {
      Object.entries(formulas.flops).forEach(([key, value]) => {
        if (key !== 'title') {
          flat[`flops-${key}`] = typeof value === 'object' ? value.formula : value;
        }
      });
    }
    
    // Memory dimension
    if (formulas.memory) {
      Object.entries(formulas.memory).forEach(([key, value]) => {
        if (key !== 'title') {
          flat[`memory-${key}`] = typeof value === 'object' ? value.formula : value;
        }
      });
    }
    
    // Bandwidth dimension
    if (formulas.bandwidth) {
      Object.entries(formulas.bandwidth).forEach(([key, value]) => {
        if (key !== 'title') {
          flat[`bandwidth-${key}`] = typeof value === 'object' ? value.formula : value;
        }
      });
    }
    
    // Final formula
    if (formulas.final) {
      flat['final-final'] = typeof formulas.final === 'object' ? formulas.final.formula : formulas.final;
    }
    
    return flat;
  }
  
  /**
   * Get all formula versions for all formulas
   * @returns {Object} All formula versions
   * @private
   */
  _getAllFormulaVersions() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
    } catch (e) {
      console.error('Error reading formula versions:', e);
      return {};
    }
  }
  
  /**
   * Save all formula versions to storage
   * @param {Object} allVersions - All formula versions object
   * @private
   */
  _saveAllFormulaVersions(allVersions) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allVersions));
  }

  /**
   * Initialize storage with default formulas if empty
   * @private
   */
  _initStorage() {
    if (!localStorage.getItem(this.STORAGE_KEY)) {
      const defaultFormulas = this._createDefaultFormulas();
      const flatFormulas = this._flattenFormulas(defaultFormulas);
      
      const initialVersions = {};
      Object.entries(flatFormulas).forEach(([formulaId, latex]) => {
        initialVersions[formulaId] = [{
          version: 1,
          timestamp: Date.now(),
          latex: latex,
          description: 'Initial default formula'
        }];
      });
      
      this._saveAllFormulaVersions(initialVersions);
    }
  }
}

// Export as singleton
window.FormulaManager = new FormulaManager();
