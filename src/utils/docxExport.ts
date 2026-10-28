import { PayrollRecord, CompanyProfile, Employee, IssuedLetter, LetterType } from '../types/hris';
import { formatCurrency, numberToWords } from './calculations';

/**
 * Generates and downloads a clean, beautifully formatted Microsoft Word (.docx) file
 * for an employee's monthly payslip.
 */
export function exportPayslipToDocx(
  payslip: PayrollRecord,
  company: CompanyProfile,
  employee?: Employee
) {
  const fileName = `LEEDO_Payslip_${payslip.employeeName.replace(/[^a-zA-Z0-9]/g, '_')}_${payslip.monthKey}.doc`;

  const basic = payslip.basicSalary || 0;
  const house = payslip.houseRent || 0;
  const med = payslip.medicalAllowance || 0;
  const conv = payslip.conveyanceAllowance || 0;
  const mob = payslip.mobileAllowance || 0;
  const trv = payslip.travelAllowance || 0;
  const gross = payslip.totalEarnings || payslip.grossSalary || 0;

  const pf = payslip.providentFund || 0;
  const tax = payslip.tax || 0;
  const adv = payslip.advanceDeduction || 0;
  const abs = payslip.absentDeduction || 0;
  const totalDed = payslip.totalDeductions || (pf + tax + adv + abs);
  const net = payslip.netSalary || (gross - totalDed);

  const totalDays = payslip.totalDaysInMonth || 30;
  const workingDays = payslip.totalWorkingDays || 22;
  const govtHol = payslip.govtHolidays ?? 4;
  const weekends = payslip.weekends || 8;

  const wordContent = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>Official Payslip - ${payslip.employeeName} (${payslip.month})</title>
  <style>
    body {
      font-family: 'Calibri', 'Arial', sans-serif;
      font-size: 11pt;
      color: #1e293b;
      margin: 20px;
      line-height: 1.4;
    }
    .header-box {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 18px;
    }
    .org-title {
      font-size: 20pt;
      font-weight: bold;
      color: #0f172a;
      margin: 0;
    }
    .org-sub {
      font-size: 10pt;
      color: #475569;
      margin: 2px 0;
    }
    .doc-badge {
      font-size: 12pt;
      font-weight: bold;
      color: #1e1b4b;
      background-color: #f1f5f9;
      padding: 4px 10px;
      border: 1px solid #cbd5e1;
      display: inline-block;
      margin-top: 5px;
    }
    .table-dossier {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      background-color: #f8fafc;
      border: 1px solid #cbd5e1;
    }
    .table-dossier td {
      padding: 8px 12px;
      border: 1px solid #cbd5e1;
      font-size: 10pt;
    }
    .salary-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .salary-table th {
      background-color: #f1f5f9;
      color: #0f172a;
      font-size: 11pt;
      font-weight: bold;
      padding: 8px 12px;
      border: 1px solid #cbd5e1;
      text-align: left;
    }
    .salary-table td {
      padding: 7px 12px;
      border: 1px solid #cbd5e1;
      font-size: 10.5pt;
    }
    .net-box {
      background-color: #ecfdf5;
      border: 2px solid #10b981;
      padding: 12px 18px;
      margin-bottom: 25px;
    }
    .net-title {
      font-size: 11pt;
      color: #065f46;
      font-weight: bold;
      margin: 0;
    }
    .net-amount {
      font-size: 18pt;
      font-weight: bold;
      color: #047857;
      margin: 4px 0;
    }
    .net-words {
      font-size: 10pt;
      color: #047857;
      font-style: italic;
      margin: 0;
    }
    .signatures-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 40px;
      border: none;
    }
    .signatures-table td {
      width: 33.33%;
      text-align: center;
      border: none;
      padding: 10px;
      vertical-align: bottom;
    }
    .sig-line {
      border-top: 1px dashed #64748b;
      margin-bottom: 5px;
      height: 1px;
    }
  </style>
</head>
<body>
  <!-- Header Letterhead -->
  <div class="header-box">
    <table style="width: 100%; border: none;">
      <tr>
        <td style="border: none; vertical-align: top;">
          <h1 class="org-title">${company.name}</h1>
          <p class="org-sub">${company.headOfficeAddress}</p>
          <p class="org-sub">NGO Affairs Bureau Reg: NGO-BUR/DH-2849/2000 • Email: ${company.contactEmail}</p>
        </td>
        <td style="border: none; vertical-align: top; text-align: right;">
          <div class="doc-badge">OFFICIAL PAYSLIP</div>
          <p style="font-size: 10pt; margin: 4px 0; font-weight: bold;">Period: ${payslip.month}</p>
          <p style="font-size: 9pt; color: #64748b; margin: 0;">Disbursement: Electronic Bank Transfer</p>
        </td>
      </tr>
    </table>
  </div>

  <!-- Employee Dossier Information -->
  <table class="table-dossier">
    <tr>
      <td><strong>Staff Member:</strong></td>
      <td><strong>${payslip.employeeName}</strong></td>
      <td><strong>Staff ID:</strong></td>
      <td><strong>${payslip.employeeId}</strong></td>
    </tr>
    <tr>
      <td><strong>Designation:</strong></td>
      <td>${payslip.designation}</td>
      <td><strong>Department:</strong></td>
      <td>${payslip.department}</td>
    </tr>
    <tr>
      <td><strong>Station / Location:</strong></td>
      <td>${employee?.workStation || 'Head Office'}</td>
      <td><strong>Payment Status:</strong></td>
      <td><span style="color: #047857; font-weight: bold;">${payslip.paymentStatus}</span></td>
    </tr>
    <tr>
      <td><strong>Bank Name:</strong></td>
      <td>${payslip.bankName || 'Brac Bank PLC'}</td>
      <td><strong>Account Number:</strong></td>
      <td>${payslip.bankAccount}</td>
    </tr>
  </table>

  <!-- Attendance & Statutory Holiday Compliance -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; background-color: #f0fdf4; border: 1px solid #86efac;">
    <tr>
      <td style="padding: 8px 12px; font-size: 9.5pt; color: #166534;">
        <strong>Statutory Attendance & Holiday Reconciliation (উপস্থিতি ও সরকারি ছুটি সমন্বয়):</strong><br>
        Month Calendar: <strong>${totalDays} Days</strong> &nbsp;|&nbsp; 
        Standard Working: <strong>${workingDays} Days</strong> &nbsp;|&nbsp; 
        <strong style="color: #0f766e;">Gazetted Govt Holidays (100% Paid): ${govtHol} Days</strong> &nbsp;|&nbsp; 
        Weekly Rest Days: <strong>${weekends} Days</strong>
        <div style="font-size: 8.5pt; color: #4b5563; margin-top: 3px; font-style: italic;">
          * Compliance with Bangladesh Labor Act 2006: All official gazetted holidays are fully paid rest days with zero wage deduction.
        </div>
      </td>
    </tr>
  </table>

  <!-- Breakdown Table -->
  <table class="salary-table">
    <thead>
      <tr>
        <th style="width: 50%;">Earnings (আয়)</th>
        <th style="width: 50%;">Deductions (কর্তন)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <table style="width: 100%; border: none;">
            <tr><td style="border: none;">Basic Salary:</td><td style="border: none; text-align: right; font-weight: bold;">${formatCurrency(basic, company.currencySymbol)}</td></tr>
            <tr><td style="border: none;">House Rent Allowance:</td><td style="border: none; text-align: right;">${formatCurrency(house, company.currencySymbol)}</td></tr>
            <tr><td style="border: none;">Medical Allowance:</td><td style="border: none; text-align: right;">${formatCurrency(med, company.currencySymbol)}</td></tr>
            <tr><td style="border: none;">Conveyance Allowance:</td><td style="border: none; text-align: right;">${formatCurrency(conv, company.currencySymbol)}</td></tr>
            <tr><td style="border: none;">Mobile & Data Allowance:</td><td style="border: none; text-align: right;">${formatCurrency(mob, company.currencySymbol)}</td></tr>
            <tr><td style="border: none;">Travel & Field Allowance:</td><td style="border: none; text-align: right;">${formatCurrency(trv, company.currencySymbol)}</td></tr>
          </table>
        </td>
        <td style="vertical-align: top;">
          <table style="width: 100%; border: none;">
            <tr><td style="border: none;">Provident Fund (Employee 8%):</td><td style="border: none; text-align: right; color: #b91c1c;">${formatCurrency(pf, company.currencySymbol)}</td></tr>
            <tr><td style="border: none;">Tax Deduction (TDS):</td><td style="border: none; text-align: right; color: #b91c1c;">${formatCurrency(tax, company.currencySymbol)}</td></tr>
            <tr><td style="border: none;">Advance Salary / Loan Recovery:</td><td style="border: none; text-align: right; color: #b91c1c;">${adv > 0 ? formatCurrency(adv, company.currencySymbol) : '--'}</td></tr>
            <tr><td style="border: none;">Absence Deduction (${payslip.absentDays || 0} days):</td><td style="border: none; text-align: right; color: #b91c1c;">${abs > 0 ? formatCurrency(abs, company.currencySymbol) : '--'}</td></tr>
          </table>
        </td>
      </tr>
      <tr style="background-color: #f8fafc; font-weight: bold;">
        <td style="border: 1px solid #cbd5e1;">
          <table style="width: 100%; border: none;">
            <tr><td style="border: none;">Total Gross Earnings:</td><td style="border: none; text-align: right; font-size: 11pt; color: #0f172a;">${formatCurrency(gross, company.currencySymbol)}</td></tr>
          </table>
        </td>
        <td style="border: 1px solid #cbd5e1;">
          <table style="width: 100%; border: none;">
            <tr><td style="border: none;">Total Deductions:</td><td style="border: none; text-align: right; font-size: 11pt; color: #b91c1c;">- ${formatCurrency(totalDed, company.currencySymbol)}</td></tr>
          </table>
        </td>
      </tr>
    </tbody>
  </table>

  <!-- Net Payable Highlight -->
  <div class="net-box">
    <p class="net-title">NET SALARY PAYABLE (সর্বমোট প্রদেয় বেতন):</p>
    <p class="net-amount">${formatCurrency(net, company.currencySymbol)}</p>
    <p class="net-words">In Words: ${numberToWords(net)}</p>
  </div>

  <!-- Signatures Block -->
  <table class="signatures-table">
    <tr>
      <td>
        <div class="sig-line"></div>
        <p style="margin: 0; font-weight: bold;">${company.hrSignatoryName || 'Md. Omar Faruque'}</p>
        <p style="margin: 2px 0 0 0; font-size: 9pt; color: #64748b;">${company.hrSignatoryDesignation || 'Manager HR & Admin'}</p>
      </td>
      <td>
        <div class="sig-line"></div>
        <p style="margin: 0; font-weight: bold;">Murshida Akhter Kanta</p>
        <p style="margin: 2px 0 0 0; font-size: 9pt; color: #64748b;">Director (Admin & Finance)</p>
      </td>
      <td>
        <div class="sig-line"></div>
        <p style="margin: 0; font-weight: bold;">${company.signatoryName || 'Forhad Hossain'}</p>
        <p style="margin: 2px 0 0 0; font-size: 9pt; color: #64748b;">${company.signatoryDesignation || 'Executive Director'}</p>
      </td>
    </tr>
  </table>

  <p style="text-align: center; font-size: 9pt; color: #94a3b8; margin-top: 35px; font-style: italic;">
    This is an officially certified computer-generated salary docket issued under the HR & Payroll policies of ${company.name} and compliant with Bangladesh Labor Act.
  </p>
</body>
</html>`;

  // Create Blob and trigger direct browser download as Word document
  const blob = new Blob(['\ufeff', wordContent], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports any official HR letter (Salary Certificate, Appointment Letter, Experience Certificate)
 * as a clean editable Word (.doc / .docx) file.
 */
export function exportOfficialLetterToDocx(
  htmlContent: string,
  title: string,
  employeeName: string
) {
  const fileName = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${employeeName.replace(/[^a-zA-Z0-9]/g, '_')}.doc`;

  const wordDoc = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${title}</title>
  <style>
    body {
      font-family: 'Calibri', 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #0f172a;
      margin: 40px;
    }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 10px; font-size: 11pt; }
    h1, h2, h3 { color: #0f172a; }
    .no-print { display: none; }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;

  const blob = new Blob(['\ufeff', wordDoc], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
