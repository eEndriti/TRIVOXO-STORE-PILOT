import React, { useRef } from 'react';

const PrintoLabel = () => {
  const labelRef = useRef(null);

  const handlePrint = () => {
    const html = `
      <html>
        <head>
          <style>
            @page { size: 2in 1in; margin: 0; }
            html, body { width: 2in; height: 1in; margin: 0; padding: 0; }
            .label {
              box-sizing: border-box;
              width: 100%; height: 100%;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }
          </style>
        </head>
        <body>
          <div class="label">
            ${labelRef.current.innerHTML}
          </div>
        </body>
      </html>
    `;
    window.api.printLabel(html);
  };

  return (
    <div>
      <div ref={labelRef} style={{
        width: '2in', height: '1in',
        border: '1px solid #000',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        margin: '1em auto'
      }}>
        <p style={{ margin: 0, fontSize: '10px' }}>Dummy: Product Name</p>
        <p style={{ margin: 0, fontSize: '8px' }}>Price: $9.99</p>
      </div>
      <button onClick={handlePrint}>Print Label</button>
    </div>
  );
};

export default PrintoLabel;
