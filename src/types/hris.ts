export type UserRole = 'hr_admin' | 'line_manager' | 'employee';

export type EmploymentStatus = 'Active' | 'Probation' | 'Contractual' | 'On Leave' | 'Separated' | 'Terminated';
export type Gender = 'Female' | 'Male' | 'Other';
export type WorkMode = 'Office' | 'Remote' | 'Field Mission';

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
  alternatePhone?: string;
  address: string;
}

export interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branchName: string;
  routingNumber: string;
  mobileBankingType?: 'bKash' | 'Nagad' | 'Rocket' | 'None';
  mobileBankingNumber?: string;
}

export interface ComplianceRecord {
  safeguardingCertified: boolean;
  safeguardingCertDate?: string;
  codeOfConductSigned: boolean;
  policeClearanceVerified: boolean;
  ndaSigned: boolean;
  donorComplianceBriefing: boolean;
}

export const LEEDO_JOB_LOCATIONS = [
  'Head Office',
  'Inclusive School',
  'Kamalapur SUS',
  'Kamalapur Shelter',
  'Kodomtoli Shelter',
  'Kadamtali Vocational Center',
  'Sadarghat SUS',
  'Shambazar SUS',
  'Mirpur SUS',
  'Peace Home',
  'RayerBazar SUS',
  'Tejgoan SUS',
  'Airport SUS',
] as const;

export type LeedoJobLocation = typeof LEEDO_JOB_LOCATIONS[number];

export interface Employee {
  id: string; // e.g., 1001
  fullName: string;
  banglaName?: string | null;
  email: string;
  phone: string;
  gender: Gender;
  dob: string; // YYYY-MM-DD
  bloodGroup: string;
  nidOrPassport: string;
  avatar?: string | null;
  presentAddress: string;
  permanentAddress: string;

  // Job Details
  designation: string;
  department: string;
  gradeLevel: string;
  joiningDate: string;
  confirmationDate?: string | null;
  contractEndDate?: string | null;
  employmentType: 'Permanent' | 'Contractual' | 'Consultant' | 'Volunteer' | 'Intern';
  status: EmploymentStatus;
  reportingManagerId?: string | null;
  reportingManagerName?: string | null;
  workStation: string;
  assignedProject: string;

  // Multi Job Locations (employee can be assigned to 2-3 locations)
  jobLocations?: string[];
  
  // Duty Schedule (customizable per employee: e.g. 3 or 6 days, 3 or 8 hrs, shift timings)
  dutyDays?: string[]; // e.g., ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu']
  shiftStartTime?: string; // e.g. '10:00'
  shiftEndTime?: string; // e.g. '18:00'
  dailyDutyHours?: number; // e.g. 8 or 3
  weeklyDutyDaysCount?: number; // e.g. 6 or 3
  biometricEnrollNo?: number | string; // Fingerprint machine AC No. / ID (e.g. 2, 3, 4, 10, 19, 25, 27)

  // Leave Entitlement Quotas (auto-calculated by duty ratio & mid-year join, editable by HR)
  casualLeaveQuota?: number; // standard 16 days for 6-day 8-hr staff
  sickLeaveQuota?: number; // standard 14 days for 6-day 8-hr staff
  
  // Salary Details (Gross, Mobile Allowance, Travel Allowance, Deductions)
  grossSalary: number;
  mobileAllowance?: number;
  travelAllowance?: number;
  advanceBalance?: number;
  basicSalary: number;
  houseRent: number;
  medicalAllowance: number;
  conveyanceAllowance: number;
  specialProjectAllowance: number;
  pfDeductionPercentage: number;
  taxDeduction: number;

  // Additional details from master record
  personalEmail?: string | null;
  highestEducation?: string | null;
  professionalEducation?: string | null;
  fatherOrSpouseName?: string | null;
  motherName?: string | null;
  religion?: string | null;
  natureOfEmployment?: string | null;
  categoryOfStaff?: string | null;
  donorName?: string | null;
  jobLocationCategory?: string | null;
  jobLocation?: string | null;
  separationDate?: string | null;
  separationReason?: string | null;
  remarks?: string | null;

  // Compliance & Emergency
  emergencyContact: EmergencyContact;
  bankDetails: BankDetails;
  compliance: ComplianceRecord;

  // File Uploads & Dossier Storage (CV, Certificates, Due Diligence, NID) - Retained 5-10+ years
  documents?: EmployeeDocument[];

  // Issued Official HR Letters & Forms History
  issuedLetters?: IssuedLetter[];
}

export interface EmployeeDocument {
  id: string;
  name: string;
  category: 
    | 'CV / Resume' 
    | 'Academic Certificate' 
    | 'Professional Certificate' 
    | 'LEEDO Signed Due Diligence' 
    | 'NID / Passport Copy' 
    | 'Police Clearance' 
    | 'Appointment Letter'
    | 'Other Document';
  uploadedAt: string;
  fileSize?: string;
  fileData: string; // Base64 data URI
  contentType?: string;
}

export interface IssuedLetter {
  id: string;
  referenceNo: string;
  letterType: LetterType;
  letterTitle: string;
  employeeId: string;
  employeeName: string;
  employeeDesignation?: string;
  employeeDepartment?: string;
  issueDate: string;
  issuedBy: string;
  addressedTo?: string;
  purpose?: string;
  appointmentCategory?: 'Permanent' | 'Contractual' | 'Permanent Volunteer' | 'Part-Time / Hourly';
  contentSnapshot?: string;
}

export interface UserCredential {
  employeeId: string;
  password: string;
  mustChangePassword: boolean;
  role: UserRole;
  lastLogin?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  clockInTime: string;
  clockOutTime?: string;
  workMode: WorkMode;
  status: 'Present' | 'Late' | 'On Leave' | 'Half Day' | 'Field Mission' | 'Absent';
  ipAddress?: string;
  locationNote?: string;
  lateReason?: string;
  hoursWorked?: number;
  // Geolocation & Google Maps capture
  latitude?: number;
  longitude?: number;
  locationAccuracy?: number;
  mapsUrl?: string;
  punchLocationName?: string;
  gpsSource?: 'Live Device GPS' | 'Assigned Center Coordinates' | 'Manual Punch';
  locationAddress?: string;
}

export type HolidayType = 
  | 'National Holiday (জাতীয় দিবস)'
  | 'Public / Religious (সাধারণ ও ধর্মীয় ছুটি)'
  | 'Executive Order (নির্বাহী আদেশে সরকারি ছুটি)'
  | 'Optional / Restricted (ঐচ্ছিক ছুটি)';

export interface GovernmentHoliday {
  id: string;
  title: string;
  titleBangla?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  daysCount: number;
  type: HolidayType;
  description?: string;
  isGazetted: boolean;
  year: number;
  applicableLocations?: string[]; // 'All' or specific centers
  createdBy?: string;
  createdAt?: string;
}

export interface TimesheetCorrectionRequest {
  id: string;
  timesheetId: string;
  employeeId: string;
  employeeName: string;
  dayKey: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
  currentHours: number;
  requestedHours: number;
  reason: string;
  status: 'Pending HR Approval' | 'Approved' | 'Rejected';
  requestDate: string;
  hrRemarks?: string;
  approvedBy?: string;
}

export interface TimesheetEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  weekStarting: string;
  projectCode: string;
  projectName: string;
  activityDescription: string;
  hours: {
    mon: number;
    tue: number;
    wed: number;
    thu: number;
    fri: number;
    sat: number;
    sun: number;
  };
  totalHours: number;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected';
  supervisorComment?: string;
  correctionRequests?: TimesheetCorrectionRequest[];
}

export type LeaveType = 'Annual/Casual' | 'Medical/Sick' | 'Maternity' | 'Paternity' | 'Compensatory/Field Rest' | 'Without Pay';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  
  // Handover Person Workflow
  handoverPersonId?: string;
  handoverPersonName?: string;
  handoverStatus?: 'Pending' | 'Accepted' | 'Declined';
  handoverComment?: string;
  
  // Multi-tier workflow: Supervisor Recommendation -> Final HR/Director Approval
  supervisorRecommendation?: 'Recommended' | 'Not Recommended' | 'Pending';
  supervisorRemarks?: string;
  supervisorName?: string;

  status: 'Pending Handover Acceptance' | 'Pending HR Approval' | 'Approved' | 'Rejected' | 'Pending';
  appliedDate: string;
  approverRemarks?: string;
  approvedBy?: string;
}

export interface VisitAuthorization {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  destination: string;
  purpose: string;
  startDate: string;
  endDate: string;
  assignedProject: string;
  modeOfTransport: string;
  estimatedExpense: number;
  supervisorRecommendation: 'Recommended' | 'Not Recommended' | 'Pending';
  supervisorRemarks?: string;
  supervisorName?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedDate: string;
  approvedBy?: string;
}

export interface LeaveBalance {
  employeeId: string;
  annualTotal: number;
  annualUsed: number;
  sickTotal: number;
  sickUsed: number;
  maternityTotal: number;
  maternityUsed: number;
  compensatoryTotal: number;
  compensatoryUsed: number;
}

export interface PayrollRecord {
  id: string;
  month: string;
  monthKey: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  department: string;
  bankAccount: string;
  bankName: string;
  
  // Monthly Attendance & Holiday Breakdown (Bangladesh Labor Law & HR Policy)
  totalDaysInMonth?: number;
  totalWorkingDays?: number;
  workedDays?: number;
  weekends?: number;
  govtHolidays?: number;
  approvedLeaves?: number;

  // Specific NGO Salary Components: Gross, Mobile, Travel
  grossSalary: number;
  mobileAllowance?: number;
  travelAllowance?: number;
  basicSalary: number;
  houseRent: number;
  medicalAllowance: number;
  conveyanceAllowance: number;
  specialAllowance: number;
  bonus: number;
  totalEarnings: number;

  // Deductions: Absent penalty, Advance taken deduction, Provident Fund, Tax
  absentDays?: number;
  absentDeduction?: number;
  advanceDeduction?: number;
  providentFund: number;
  tax: number;
  loanDeduction: number;
  unpaidLeaveDeduction: number;
  totalDeductions: number;

  netSalary: number;
  paymentStatus: 'Paid' | 'Processing' | 'Pending';
  disbursementDate?: string;
}

export interface SeparationRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  department: string;
  joiningDate: string;
  separationType: 'Resignation' | 'Retirement' | 'Contract Expiry' | 'Termination' | 'Mutual Separation';
  noticeDate: string;
  lastWorkingDate: string;
  reason: string;
  handoverTo: string;
  
  // Departmental Clearance checklist
  departmentClearance: boolean;
  financeClearance: boolean;
  adminAssetClearance: boolean;
  itEquipmentClearance: boolean;
  
  // Final Settlement Breakdown
  lastMonthSalary: number;
  providentFundSettlement: number;
  gratuitySettlement: number;
  leaveEncashmentDays: number;
  leaveEncashmentAmount: number;
  deductionsOrAdvances: number;
  netSettlementAmount: number;

  clearanceStatus: 'Clearance In Progress' | 'Clearance Approved' | 'Settlement Finalized';
  experienceLetterIssued: boolean;
  settlementDate?: string;
}

export interface PerformanceAppraisal {
  id: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  department: string;
  cycle: string;
  reviewerId: string;
  reviewerName: string;
  reviewDate: string;
  
  jobKnowledge: number;
  workQuality: number;
  safeguardingAndEthics: number;
  teamCollaboration: number;
  punctualityAndCompliance: number;
  leadershipAndInitiative: number;
  overallScore: number;
  
  kpiAchievementRate: number;
  strengths: string;
  areasForImprovement: string;
  supervisorRecommendations: 'Promotion Recommended' | 'Salary Increment' | 'Contract Renewal' | 'Training Required' | 'Performance Improvement Plan';
  status: 'Draft' | 'Submitted' | 'Finalized';

  // KPI Targets set & updated by employee / supervisor
  kpiTargets?: {
    id: string;
    title: string;
    target: string;
    currentProgress: number; // 0 to 100
    status: 'In Progress' | 'Achieved' | 'Exceeded';
    selfNotes?: string;
  }[];
  employeeComments?: string;
  employeeUpdatedDate?: string;
}

export interface ExpenseClaim {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  projectName: string;
  title: string;
  claimDate: string;
  category: 'Travel / Field Fare' | 'Daily Allowance (DA)' | 'Accommodation' | 'Project Logistics' | 'Refreshment / Meeting';
  amount: number;
  description: string;
  status: 'Pending' | 'Approved' | 'Disbursed' | 'Rejected';
  receiptAttachment?: string;
}

export type LetterType = 
  | 'experience'
  | 'salary_certificate'
  | 'bank_account_opening'
  | 'leave_application'
  | 'travel_authorization'
  | 'emergency_contact_form'
  | 'appointment_letter'
  | 'warning_letter'
  | 'separation_clearance'
  | 'final_settlement';

export interface CompanyProfile {
  name: string;
  organizationType: 'Non-Governmental Organization (NGO)' | 'Private Limited' | 'Development Trust';
  registrationNo: string;
  taxId: string;
  headOfficeAddress: string;
  contactEmail: string;
  phone: string;
  signatoryName: string;
  signatoryDesignation: string;
  currency: 'BDT (৳)' | 'USD ($)';
  currencySymbol: string;
  logoUrl?: string;
}
