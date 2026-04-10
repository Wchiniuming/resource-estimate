/**
 * LaTeX Renderer Module
 * Handles rendering LaTeX formulas to DOM using KaTeX
 */

class LatexRenderer {
  constructor() {
    // Check if KaTeX is available
    this.katexAvailable = typeof katex !== 'undefined';
    if (!this.katexAvailable) {
      console.error('KaTeX library not found - LaTeX rendering will not work');
    }
  }

  /**
   * Render LaTeX string to HTML
   * @param {string} latex - LaTeX string to render
   * @param {Object} options - KaTeX options
   * @returns {string} Rendered HTML string
   */
  renderToString(latex, options = {}) {
    if (!this.katexAvailable) {
      return `<span class="latex-error">KaTeX not available</span>`;
    }

    try {
      const defaultOptions = {
        throwOnError: false,
        displayMode: false,
        errorColor: '#e74c3c'
      };

      return katex.renderToString(latex, { ...defaultOptions, ...options });
    } catch (error) {
      console.error('Error rendering LaTeX:', error);
      return `<span class="latex-error" title="${this._escapeHtml(error.message)}">${this._escapeHtml(latex)}</span>`;
    }
  }

  /**
   * Render LaTeX string to DOM element
   * @param {string} latex - LaTeX string to render
   * @param {HTMLElement} element - Target DOM element
   * @param {Object} options - KaTeX options
   */
  renderToElement(latex, element, options = {}) {
    if (!element) {
      console.error('Target element is required for renderToElement');
      return;
    }

    if (!this.katexAvailable) {
      element.innerHTML = `<span class="latex-error">KaTeX not available</span>`;
      return;
    }

    try {
      const defaultOptions = {
        throwOnError: false,
        displayMode: false,
        errorColor: '#e74c3c'
      };

      katex.render(latex, element, { ...defaultOptions, ...options });
    } catch (error) {
      console.error('Error rendering LaTeX to element:', error);
      element.innerHTML = `<span class="latex-error" title="${this._escapeHtml(error.message)}">${this._escapeHtml(latex)}</span>`;
    }
  }

  /**
   * Escape HTML for safe display
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   * @private
   */
  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Export as singleton
window.LatexRenderer = new LatexRenderer();
