/**
 * High-Fidelity PDF & Print Export Manager
 */

export const PDFExport = {
  /**
   * Opens the browser's native print preview with high-precision print styles
   */
  print() {
    window.print();
  },

  /**
   * Downloads the rendered document as a PDF using html2pdf if available,
   * or seamlessly triggers the native print dialog.
   * 
   * @param {HTMLElement} element 
   * @param {string} filename 
   */
  async downloadPDF(element, filename = 'document.pdf') {
    if (!element) {
      console.error('No element provided for PDF generation');
      return;
    }

    // If html2pdf is loaded in global window
    if (window.html2pdf) {
      const opt = {
        margin: [6, 6, 6, 6], // mm margins
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          scrollY: 0,
          windowWidth: 800
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      try {
        // Temporarily apply single-page compact class
        element.classList.add('is-generating-pdf');
        
        await window.html2pdf().set(opt).from(element).save();
        
        element.classList.remove('is-generating-pdf');
        return true;
      } catch (err) {
        console.warn('html2pdf failed, falling back to window.print():', err);
        element.classList.remove('is-generating-pdf');
        window.print();
        return false;
      }
    } else {
      // Clean fallback
      window.print();
      return true;
    }
  }
};
