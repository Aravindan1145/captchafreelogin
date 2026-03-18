import type { MedicalReport, ReportImage } from '@/types';

interface PDFGeneratorOptions {
  report: MedicalReport;
  images?: ReportImage[];
}

export const generateMedicalReportPDF = async ({ report, images = [] }: PDFGeneratorOptions): Promise<void> => {
  // Create a new window for the PDF content
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    throw new Error('Please allow popups to download the PDF');
  }

  const symptomsHtml = report.symptoms
    ?.filter(s => s.trim())
    .map(s => `<li>${s}</li>`)
    .join('') || '<li>No symptoms recorded</li>';

  const diagnosisHtml = report.diagnosis
    ?.filter(d => d.trim())
    .map(d => `<li>${d}</li>`)
    .join('') || '<li>No diagnosis recorded</li>';

  const testsHtml = report.testsconducted
    ?.filter(t => t.trim())
    .map(t => `<li>${t}</li>`)
    .join('') || '<li>No tests recorded</li>';

  const treatmentHtml = report.treatmentPlan
    ?.filter(t => t.trim())
    .map(t => `<li>${t}</li>`)
    .join('') || '<li>No treatment plan recorded</li>';

  const imagesHtml = images.length > 0 
    ? images.map(img => `
        <div class="image-container">
          <img src="${img.imageData}" alt="${img.imageName}" />
          <p class="image-caption">${img.imageName}</p>
        </div>
      `).join('')
    : '<p class="no-images">No images attached</p>';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Medical Report - ${report.id}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .header {
          text-align: center;
          border-bottom: 3px solid #3b82f6;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        
        .header h1 {
          color: #1e40af;
          font-size: 28px;
          margin-bottom: 5px;
        }
        
        .header .subtitle {
          color: #6b7280;
          font-size: 14px;
        }
        
        .status-badge {
          display: inline-block;
          background: ${report.status === 'confirmed' ? '#22c55e' : '#f59e0b'};
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          margin-top: 10px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        
        .info-item label {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          display: block;
          margin-bottom: 4px;
        }
        
        .info-item p {
          font-weight: 600;
          color: #1e293b;
        }
        
        .section {
          margin-bottom: 25px;
        }
        
        .section h2 {
          color: #1e40af;
          font-size: 18px;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 8px;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .section h2::before {
          content: '';
          width: 4px;
          height: 20px;
          background: #3b82f6;
          border-radius: 2px;
        }
        
        .section ul {
          list-style: none;
          padding: 0;
        }
        
        .section li {
          background: #f1f5f9;
          padding: 10px 15px;
          margin-bottom: 8px;
          border-radius: 6px;
          border-left: 3px solid #3b82f6;
        }
        
        .notes-box {
          background: #fffbeb;
          border: 1px solid #fcd34d;
          padding: 15px;
          border-radius: 8px;
          white-space: pre-wrap;
        }
        
        .images-section {
          margin-top: 30px;
          page-break-before: auto;
        }
        
        .images-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
        }
        
        .image-container {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .image-container img {
          width: 100%;
          max-height: 250px;
          object-fit: contain;
          background: #f8fafc;
        }
        
        .image-caption {
          padding: 8px;
          background: #f1f5f9;
          font-size: 12px;
          text-align: center;
          color: #6b7280;
        }
        
        .no-images {
          color: #9ca3af;
          font-style: italic;
          text-align: center;
          padding: 20px;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e2e8f0;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
        }
        
        .doctor-signature {
          margin-top: 30px;
          padding: 20px;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          border-radius: 8px;
        }
        
        .doctor-signature h3 {
          color: #166534;
          margin-bottom: 10px;
        }
        
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          .images-section {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🏥 Medical Report</h1>
        <p class="subtitle">Health Record Management System</p>
        <span class="status-badge">${report.status.toUpperCase()}</span>
      </div>
      
      <div class="info-grid">
        <div class="info-item">
          <label>Report ID</label>
          <p>${report.id}</p>
        </div>
        <div class="info-item">
          <label>Report Date</label>
          <p>${new Date(report.date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
        </div>
        <div class="info-item">
          <label>Patient Name</label>
          <p>${report.patientName}</p>
        </div>
        <div class="info-item">
          <label>Patient ID</label>
          <p>${report.patientId}</p>
        </div>
        ${report.doctorName ? `
          <div class="info-item">
            <label>Attending Doctor</label>
            <p>Dr. ${report.doctorName}</p>
          </div>
          <div class="info-item">
            <label>Doctor License</label>
            <p>${report.doctorLicense || 'N/A'}</p>
          </div>
        ` : ''}
      </div>
      
      <div class="section">
        <h2>Symptoms</h2>
        <ul>${symptomsHtml}</ul>
      </div>
      
      <div class="section">
        <h2>Diagnosis</h2>
        <ul>${diagnosisHtml}</ul>
      </div>
      
      <div class="section">
        <h2>Tests Conducted</h2>
        <ul>${testsHtml}</ul>
      </div>
      
      <div class="section">
        <h2>Treatment Plan</h2>
        <ul>${treatmentHtml}</ul>
      </div>
      
      ${report.additionalNotes ? `
        <div class="section">
          <h2>Additional Notes</h2>
          <div class="notes-box">${report.additionalNotes}</div>
        </div>
      ` : ''}
      
      ${images.length > 0 ? `
        <div class="section images-section">
          <h2>Attached Documents</h2>
          <div class="images-grid">
            ${imagesHtml}
          </div>
        </div>
      ` : ''}
      
      ${report.status === 'confirmed' && report.doctorName ? `
        <div class="doctor-signature">
          <h3>✓ Verified & Approved</h3>
          <p><strong>Approved by:</strong> Dr. ${report.doctorName}</p>
          <p><strong>License Number:</strong> ${report.doctorLicense || 'N/A'}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
        </div>
      ` : ''}
      
      <div class="footer">
        <p>This is a computer-generated medical report from the Health Record Management System.</p>
        <p>Generated on: ${new Date().toLocaleString()}</p>
      </div>
      
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
