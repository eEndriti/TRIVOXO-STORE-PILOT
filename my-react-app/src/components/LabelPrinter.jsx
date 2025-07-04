// components/LabelPrinter.jsx
import React, { useRef, useState, useCallback } from 'react';
import { useReactToPrint } from 'react-to-print';

const LabelPrinter = () => {
  const labelRef = useRef(null);
  const [labelContent, setLabelContent] = useState('Sample Label');
  const [copies, setCopies] = useState(1);
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState(null);

  // Validate the ref exists before printing
  const validateRef = useCallback(() => {
    if (!labelRef.current) {
      setError('Print content not found');
      return false;
    }
    return true;
  }, []);

  const handlePrint = useReactToPrint({
    content: () => {
      if (!validateRef()) return null;
      return labelRef.current;
    },
    pageStyle: `
      @page {
        size: 2in 1in;
        margin: 0;
      }
      body {
        margin: 0;
        padding: 0;
      }
    `,
    onBeforeGetContent: () => {
      setIsPrinting(true);
      setError(null);
      return Promise.resolve();
    },
    onAfterPrint: () => {
      setIsPrinting(false);
    },
    onPrintError: (errorLocation, error) => {
      setIsPrinting(false);
      setError(`Printing failed: ${errorLocation} - ${error}`);
    },
    removeAfterPrint: true
  });

  const printMultipleCopies = async () => {
    if (isPrinting) return;
    
    try {
      for (let i = 0; i < copies; i++) {
        await new Promise(resolve => {
          setTimeout(() => {
            handlePrint();
            resolve();
          }, 500);
        });
      }
    } catch (err) {
      setError(`Printing error: ${err.message}`);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Label Printer</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '10px' }}>
          Label Content:
          <input
            type="text"
            value={labelContent}
            onChange={(e) => setLabelContent(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px' }}
          />
        </label>
        
        <label style={{ display: 'block', marginBottom: '10px' }}>
          Copies:
          <input
            type="number"
            min="1"
            max="100"
            value={copies}
            onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
            style={{ marginLeft: '10px', padding: '5px', width: '60px' }}
          />
        </label>
        
        <button 
          onClick={printMultipleCopies} 
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
        <div style={{ color: 'red', margin: '10px 0', padding: '10px', border: '1px solid red' }}>
          {error}
        </div>
      )}

      {/* Printable content - hidden in normal view */}
      <div style={{ display: 'none' }}>
        <div ref={labelRef}>
          <div style={{
            width: '2in',
            height: '1in',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '12px',
            border: '1px solid #000',
            boxSizing: 'border-box'
          }}>
            {labelContent}
          </div>
        </div>
      </div>

      {/* Preview */}
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
          margin: '0 auto'
        }}>
          {labelContent}
        </div>
      </div>
    </div>
  );
};

export default LabelPrinter;