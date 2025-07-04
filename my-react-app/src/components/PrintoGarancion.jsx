import jsPDF from 'jspdf';
import autoTable from "jspdf-autotable";
import { formatCurrency } from "../components/AuthContext";


export const PrintoGarancion = (data,parametratGarancionit,shifra) => {

 
  console.log('data',data)

  console.log('data lloji',data.lloji)

  const fileName = `Garancioni ${shifra}.pdf`
  const dataGarancionit = getCurrentDateInAlbanian()
  const currentYear = new Date().getFullYear();

 
  const handlePrint = async (currentData,currentParametrat) => {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'letter',
      putOnlyUsedFonts: true,
      floatPrecision: 16, // or "smart", default is 16
    });

    console.log('parametrat',currentParametrat)
    const folderPath = currentParametrat.filePath

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(`Fletë Garancioni ${shifra}`, 65, 20);

  // Client Details
    const clientDetails = `Klienti: ${data.emertimiSubjektit} | Kontakti: ${data.kontaktiSubjektit}`;

    const pageWidth = doc.internal.pageSize.width;

    const clientDetailsWidth = doc.getTextWidth(clientDetails);


    const adjustedWidth = clientDetailsWidth * 0.6; 
    const startX = (pageWidth - adjustedWidth) / 2;

    // Add text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(clientDetails, startX, 28);

    // Header
    doc.setFontSize(14);
    doc.text(`Garancioni për produktin e blerë është `, 15, 43);
    doc.setFont("helvetica", "bold");
    doc.text(`${data.kohaGarancionit} Muaj`, 101, 43);
    doc.setFont("helvetica", "normal");
    doc.text(` nga data e blerjes: ${dataGarancionit}`, 117, 43);

     // Divider Line
     doc.line(10, 35, pageWidth - 10, 35);

   // Warranty Details
   doc.setFont("helvetica", "bold");
   doc.setFontSize(16);
   doc.text("Në garancion përfshihet mbulesa e plotë përpos nëse produkti është:", 11, 54);
   
   doc.setFont("helvetica", "normal");
   doc.setFontSize(10);

   const kushtetArray = JSON.parse(currentParametrat.kushtet);
   
  const initialY = 65; // Initial starting Y position for the conditions
  const spacingAfterKushtet = 5; // Space between kushtet and the table
  const leftMargin  = 15;
  const rightMargin = 15;
  const maxWidth    = pageWidth - leftMargin - rightMargin;
  const lineHeight  = 7;      // adjust to your font size (in mm)
  let y            = initialY;

// Render the kushtet
kushtetArray.forEach(kusht => {
  // 1. prepend bullet
  const text    = `• ${kusht}`;
  // 2. split into an array of lines no wider than maxWidth
  const lines   = doc.splitTextToSize(text, maxWidth);
  // 3. print all those lines at (leftMargin, y)
  doc.text(lines, leftMargin, y);
  // 4. bump y by (# of lines × lineHeight)
  y += lines.length * lineHeight;

  // 5. if we’re past the bottom margin, add a page and reset y
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y > pageHeight - 20) {         // leave 20 mm at the bottom
    doc.addPage();
    y = initialY;                    // or whatever your top margin is
  }
});
// Calculate the dynamic Y position for the table
const tableStartY = initialY + kushtetArray.length * lineHeight + spacingAfterKushtet;

// Table Columns
const columns = [
  { header: "Nr", dataKey: "nr" },
  { header: "Shifra", dataKey: "shifraProduktit" },
  { header: "Emertimi", dataKey: "emertimiProduktit" },
  { header: "Pershkrimi", dataKey: "pershkrimiProduktit" },
  { header: "Cmimi per Cope", dataKey: "cmimiPerCope" },
  { header: "Sasia", dataKey: "sasiaShitjes" },
  { header: "Vlera Totale", dataKey: "vleraTotaleProduktit" },
  { header: "Komenti per Produkt", dataKey: "komentiProduktit" },
];

// Example Data
const rows = data.produktet;

autoTable(doc, {
  columns,
  body: rows,
  startY: tableStartY, // Dynamically set Y position
  theme: 'grid',
  styles: { fontSize: 10, textColor: [1, 1, 1], cellPadding: 2 },
  headStyles: { fillColor: [209, 209, 209], textColor: [1, 1, 1] },
  columnStyles: {
    pershkrimi: { cellWidth: 60 },
    emertimi: { cellWidth: 'wrap' },
  },
      bodyStyles: {
        minCellHeight: 10,
      },
      didDrawPage: (data) => {
        const footerY = doc.internal.pageSize.height - 15;

        // Footer
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`${dataGarancionit}`, 100, footerY);

        const line1XStart = pageWidth - 60;
        const line1XEnd = pageWidth - 10;

        const line2XStart = pageWidth - 200;
        const line2XEnd = pageWidth - 150;

        doc.setFontSize(7);

        if(currentData.lloji.trim() === 'dyqan'){
          doc.line(line2XStart, footerY, line2XEnd, footerY);

          doc.text(`Nënshkrimi i Klientit`, 30, footerY + 4);
        }
        doc.line(line1XStart, footerY, line1XEnd, footerY);

          doc.text(`Nënshkrimi i Shitësit`, pageWidth - 45, footerY+4);
    
        

        // Footer Branding
        const YForBranding = doc.internal.pageSize.height - 6;
        doc.setFontSize(8);
        const brandingText = `${currentParametrat.emriBiznesit} © 2016 - ${currentYear} | Tel: ${currentParametrat.telefoni} | Adresa: ${currentParametrat.adresa}`;
        const textWidth = doc.getTextWidth(brandingText);
        const startX = (pageWidth - textWidth) / 2;
        doc.setFontSize(8);
        doc.text(brandingText, startX, YForBranding);
      },
    });
    
      const startY = doc.lastAutoTable.finalY + 12; // Position text 10 units below the table
      const textX = pageWidth - 15; // Align the text to the right

      // Calculate the maximum width of the texts to ensure alignment
      doc.line(10, startY-6, doc.internal.pageSize.width - 10, startY-6);

      const rows2 = [
        `Totali per Pagese : ${formatCurrency(data.totaliPerPagese)}`,
        `Totali i Pageses : ${currentData.lloji == 'online' ? formatCurrency(data.totaliPerPagese) : formatCurrency(data.totaliPageses)}`,
        `Mbetja per Pagese : ${currentData.lloji == 'online' ? formatCurrency(0) : formatCurrency(data.mbetjaPerPagese)}`
      ];

      let currentY = startY;

      // Add text to the doc, and calculate the Y position dynamically to ensure it stays in line
      rows2.forEach((row2, index) => {
        const textWidth = doc.getTextWidth(row2);
        
        // Adjust X position if needed (right-aligned text)
        doc.text(row2, textX - textWidth, currentY);
        currentY += 6; // Add space between rows
      });

    // Save the PDF
    const pdfBase64 = doc.output('datauristring').split(',')[1];
    await window.api.savePDF({ pdfBase64, folderPath, fileName });
    const filePath = folderPath + '\\' + fileName
    await window.api.openFile(filePath );

  };
  handlePrint(data,parametratGarancionit[0])


};



function getCurrentDateInAlbanian() {
  const albanianMonths = [
    'Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor',
    'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'
  ];

  const albaniaTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Tirane" }));

  const day = String(albaniaTime.getDate()).padStart(2, '0'); // Add leading zero for single-digit days
  const month = albanianMonths[albaniaTime.getMonth()]; // Get Albanian month name
  const year = albaniaTime.getFullYear(); // Get year

  return `${day}-${month}-${year}`;
}
