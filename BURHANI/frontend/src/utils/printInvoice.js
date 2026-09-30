/**
 * Universal, rock-solid Invoice & Bill Print Utility for Burhani Hardware.
 * Clones the printable invoice container into a dedicated isolated iframe,
 * applies crisp print styling, ensures proper A4 page formatting, and triggers
 * the native print dialog without any blank pages, scroll clips, or white space.
 */
export function printInvoice(elementOrId, docTitle = 'Burhani Hardware - Tax Invoice') {
  const sourceEl = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
  if (!sourceEl) {
    console.warn(`[printInvoice] Target element "${elementOrId}" not found. Falling back to window.print()`);
    window.print();
    return;
  }

  // Remove any previous temporary print iframes
  const oldIframes = document.querySelectorAll('iframe.burhani-print-iframe');
  oldIframes.forEach((ifr) => ifr.remove());

  // Create isolated invisible iframe
  const iframe = document.createElement('iframe');
  iframe.className = 'burhani-print-iframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow.document;
  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${docTitle}</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }
          *, *::before, *::after {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #ffffff !important;
            color: #111827 !important;
            margin: 0 !important;
            padding: 12px 0 !important;
            font-size: 13px;
            line-height: 1.45;
          }
          .no-print {
            display: none !important;
          }
          h1, h2, h3, h4, h5, h6 {
            font-family: 'Playfair Display', Georgia, serif;
            color: #0f172a;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 12px;
            margin-bottom: 1rem;
          }
          th, td {
            padding: 7px 10px !important;
            border: 1px solid #cbd5e1 !important;
          }
          thead th {
            background-color: #f1f5f9 !important;
            color: #1e293b !important;
            font-weight: 700;
          }
          tfoot td {
            font-weight: 600;
          }
          .badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
            border: 1px solid #e2e8f0;
          }
          .bg-warning {
            background-color: #ffc107 !important;
            color: #0a110f !important;
          }
          .bg-success-subtle {
            background-color: #d1fae5 !important;
            color: #065f46 !important;
          }
          .text-muted {
            color: #64748b !important;
          }
          .text-success {
            color: #059669 !important;
          }
          .text-danger {
            color: #dc2626 !important;
          }
          .border-bottom {
            border-bottom: 1px solid #e2e8f0 !important;
          }
          .border-top {
            border-top: 1px solid #e2e8f0 !important;
          }
          .print-header-brand {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .print-logo-box {
            background: #ffc107;
            width: 38px;
            height: 38px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #0a110f;
            font-size: 18px;
          }
        </style>
      </head>
      <body>
        <div class="print-wrapper">
          ${sourceEl.innerHTML}
        </div>
      </body>
    </html>
  `);
  iframeDoc.close();

  // Give external fonts and CSS a moment to render then trigger print
  setTimeout(() => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (err) {
      console.error('[printInvoice] Failed to trigger iframe print:', err);
      window.print();
    } finally {
      // Clean up after print dialog finishes
      setTimeout(() => {
        iframe.remove();
      }, 2000);
    }
  }, 350);
}
export default printInvoice;
