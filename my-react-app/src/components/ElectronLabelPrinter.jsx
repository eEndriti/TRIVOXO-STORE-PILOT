// components/ElectronLabelPrinter.jsx
import React, { useState } from 'react';

const ElectronLabelPrinter = () => {
  const [labelContent, setLabelContent] = useState('Sample Label');
  const [copies, setCopies] = useState(1);
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState(null);

  const printLabel = async () => {
    if (isPrinting || !window.electronAPI) return;
    
    setIsPrinting(true);
    setError(null);

    try {
      // Generate print-ready HTML
      const printHTML = `
        <html>
          <head>
            <style>
              @page {
                size: 2in 1in;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
                background-color: white;
              }
              .label {
                width: 2in;
                height: 1in;
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 12px;
                border: 1px solid #000;
                box-sizing: border-box;
              }
            </style>
          </head>
          <body>
            <div class="label">${labelContent}</div>
          </body>
        </html>
      `;

      const result = await window.electronAPI.printLabel({
        content: printHTML,
        copies,
        labelSize: { width: 2, height: 1 } // in inches
      });

      if (!result.success) {
        throw new Error(result.error || 'Printing failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Label Printer</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
          <label>
            Label Content:
            <input
              type="text"
              value={labelContent}
              onChange={(e) => setLabelContent(e.target.value)}
              style={{ marginLeft: '10px', padding: '5px' }}
            />
          </label>
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label>
            Copies:
            <input
              type="number"
              min="1"
              max="100"
              value={copies}
              onChange={(e) => setCopies(Math.max(1, e.target.valueAsNumber || 1))}
              style={{ marginLeft: '10px', padding: '5px', width: '60px' }}
            />
          </label>
        </div>
        
        <button 
          onClick={printLabel}
          disabled={isPrinting}
          style={{
            padding: '8px 16px',
            backgroundColor: isPrinting ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isPrinting ? 'not-allowed' : 'pointer'
          }}
        >
          {isPrinting ? 'Printing...' : 'Print Labels'}
        </button>
      </div>

      {error && (
        <div style={{ 
          color: 'red',
          margin: '10px 0',
          padding: '10px',
          border: '1px solid red',
          backgroundColor: '#ffe6e6'
        }}>
          Error: {error}
        </div>
      )}

      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <h3>Preview</h3>
        <div style={{
          width: '2in',
          height: '1in',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '12px',
          border: '1px dashed #ccc',
          margin: '0 auto',
          backgroundColor: 'white'
        }}>
          {labelContent}
        </div>
      </div>
    </div>
  );
};

export default ElectronLabelPrinter;