// src/lib/data/employees.ts
import { Employee } from '@/types/employee';

export const DEMO_COMPANY = {
  id: 'comp-001',
  name: 'Payroll AI',
  address: 'Plot No. 45, Tech Park Phase 2, Industrial Zone',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400001',
};

export const employees: Employee[] = [
  {
    id: 1, empCode: 'NUC0744', category: 'Casual', name: 'Divan Mayudinsha',
    unit: 'UNIT-2', floor: 'R&D', department: 'Metalize', contractor: 'Payroll AI',
    doj: '2023-11-18', bankName: 'SBI', accountNo: '34528243238', ifsc: 'SBIN0002683',
    uan: '101540999300', esicNo: '3812942876', aadhar: '', salaryType: 'PER DAY',
    perDayRate: 489.5, fixedPay: 7342.5, paymentMode: 'BANK',
  },
  {
    id: 2, empCode: 'NUC0854', category: 'UP', name: 'Satyam Babulal',
    unit: 'UNIT-2', floor: 'Bushing', department: 'Winding', contractor: 'Payroll AI',
    doj: '2024-03-29', bankName: 'HDFC', accountNo: '50100709166502', ifsc: 'HDFC0000033',
    uan: '102064158236', esicNo: '3813094348', aadhar: '', salaryType: 'PER DAY',
    perDayRate: 489.5, fixedPay: 7342.5, paymentMode: 'BANK',
  },
  {
    id: 3, empCode: 'NUC0820', category: 'UP', name: 'Ravindra Kumar Ram Sajivan',
    unit: 'UNIT-2', floor: 'Bushing', department: 'Assembly - 04', contractor: 'Payroll AI',
    doj: '2024-01-25', bankName: 'HDFC', accountNo: '50100688450082', ifsc: 'HDFC0000033',
    uan: '102036835170', esicNo: '3813010889', aadhar: '', salaryType: 'PER DAY',
    perDayRate: 489.5, fixedPay: 7342.5, paymentMode: 'BANK',
  },
  {
    id: 4, empCode: 'NUC0959', category: 'UP', name: 'Dhanraj Mohan Lal',
    unit: 'UNIT-2', floor: 'GIS', department: 'Assembly - 02', contractor: 'Payroll AI',
    doj: '2024-10-26', bankName: 'HDFC', accountNo: '50100763329860', ifsc: 'HDFC0000033',
    uan: '102143567604', esicNo: '3813309935', aadhar: '', salaryType: 'PER DAY',
    perDayRate: 489.5, fixedPay: 7342.5, paymentMode: 'BANK',
  },
  {
    id: 5, empCode: 'NUC0117', category: 'UP', name: 'Govindlal Ramkishor',
    unit: 'UNIT-2', floor: 'MV', department: 'Assembly - 01', contractor: 'Payroll AI',
    doj: '2024-10-26', bankName: 'HDFC', accountNo: '50100643277691', ifsc: 'HDFC0000033',
    uan: '100994350157', esicNo: '3811581874', aadhar: '', salaryType: 'PER DAY',
    perDayRate: 489.5, fixedPay: 7342.5, paymentMode: 'BANK',
  },
  {
    id: 6, empCode: 'SHE203', category: 'Casual', name: 'Parmar Ajaykumar Arvindbhai',
    unit: 'UNIT-2', floor: 'Store', department: 'Store', contractor: 'Payroll AI',
    doj: '2022-08-08', bankName: 'SBI', accountNo: '41058435258', ifsc: 'SBIN0061512',
    uan: '101517065269', esicNo: '3813476721', aadhar: '', salaryType: 'PER DAY',
    perDayRate: 489.5, fixedPay: 7342.5, paymentMode: 'BANK',
  },
  {
    id: 7, empCode: 'SHE235', category: 'Casual', name: 'Maheshbhai Mafatbhai Raval',
    unit: 'UNIT-2', floor: 'MV', department: 'Packing', contractor: 'Payroll AI',
    doj: '2022-12-01', bankName: 'SBI', accountNo: '41542677435', ifsc: 'SBIN0061512',
    uan: '102296871573', esicNo: '3813508255', aadhar: '', salaryType: 'PER DAY',
    perDayRate: 489.5, fixedPay: 7342.5, paymentMode: 'BANK',
  },
  {
    id: 8, empCode: 'NPH09', category: 'Casual', name: 'Parmar Sanjaysinh Arjunsinh',
    unit: 'UNIT-2', floor: 'Bushing', department: 'Finishing & Labelling', contractor: 'Payroll AI',
    doj: '2020-06-16', bankName: 'SBI', accountNo: '41648855310', ifsc: 'SBIN0008342',
    uan: '101298514779', esicNo: '3811818593', aadhar: '', salaryType: 'PER DAY',
    perDayRate: 489.5, fixedPay: 7342.5, paymentMode: 'BANK',
  },
  {
    id: 9, empCode: 'SHE309', category: 'Casual', name: 'Parmar Chatrasnih Raysingbhai',
    unit: 'UNIT-2', floor: 'FG', department: 'Mistry', contractor: 'Payroll AI',
    doj: '2024-01-06', bankName: 'SBI', accountNo: '33292493280', ifsc: 'SBIN0000442',
    uan: '101361777035', esicNo: '3813018230', aadhar: '', salaryType: 'PER DAY',
    perDayRate: 489.5, fixedPay: 7342.5, paymentMode: 'BANK',
  },
  {
    id: 10, empCode: 'SHE344', category: 'Casual', name: 'Jayesh Ranjitsinh Padhiyar',
    unit: 'UNIT-2', floor: 'Bushing', department: 'Casting', contractor: 'Payroll AI',
    doj: '2025-09-08', bankName: 'SBI', accountNo: '65292100202', ifsc: 'SBIN0032681',
    uan: '102243230891', esicNo: '3813582132', aadhar: '', salaryType: 'PER DAY',
    perDayRate: 489.5, fixedPay: 7342.5, paymentMode: 'BANK',
  },
  {
    id: 11, empCode: 'SHE349', category: 'UP', name: 'Vinay Kumar Gaya Ram',
    unit: 'UNIT-2', floor: 'Bushing', department: 'Casting', contractor: 'Payroll AI',
    doj: '2025-09-30', bankName: 'HDFC', accountNo: '50100839060570', ifsc: 'HDFC0000033',
    uan: '102253432423', esicNo: '3813590545', aadhar: '', salaryType: 'PER DAY',
    perDayRate: 489.5, fixedPay: 7342.5, paymentMode: 'BANK',
  },
  {
    id: 12, empCode: 'SHE350', category: 'Casual', name: 'Sahilbhai Dilipbhai Waghela',
    unit: 'UNIT-2', floor: 'Bushing', department: 'Casting', contractor: 'Payroll AI',
    doj: '2025-10-01', bankName: 'BOB', accountNo: '55830100004151', ifsc: 'BARB0AMBADA',
    uan: '102252104824', esicNo: '3813603927', aadhar: '', salaryType: 'PER DAY',
    perDayRate: 489.5, fixedPay: 7342.5, paymentMode: 'BANK',
  },
  {
    id: 13, empCode: 'SHE351', category: 'UP', name: 'Sudarshan Anil',
    unit: 'UNIT-2', floor: 'Bushing', department: 'Casting', contractor: 'Payroll AI',
    doj: '2025-10-06', bankName: 'SBI', accountNo: '44604252151', ifsc: 'SBIN0061512',
    uan: '102253290539', esicNo: '3813606273', aadhar: '', salaryType: 'PER DAY',
    perDayRate: 489.5, fixedPay: 7342.5, paymentMode: 'BANK',
  },
  {
    id: 14, empCode: 'SHE354', category: 'UP', name: 'Nikhil Kumar',
    unit: 'UNIT-2', floor: 'MV', department: 'HV Winding', contractor: 'Payroll AI',
    doj: '2025-10-11', bankName: 'BOB', accountNo: '50670100037790', ifsc: 'BARB0BUPGBX',
    uan: '102255062608', esicNo: '3813606292', aadhar: '', salaryType: 'PER DAY',
    perDayRate: 489.5, fixedPay: 7342.5, paymentMode: 'BANK',
  },
  {
    id: 15, empCode: 'SHE360', category: 'UP', name: 'Deepak Ramnaresh',
    unit: 'UNIT-2', floor: 'MV', department: 'Assembly', contractor: 'Payroll AI',
    doj: '2025-11-01', bankName: 'UNION', accountNo: '464802050001363', ifsc: 'UBIN0546488',
    uan: '101541562872', esicNo: '3813633622', aadhar: '', salaryType: 'PER DAY',
    perDayRate: 489.5, fixedPay: 7342.5, paymentMode: 'BANK',
  },
  {
    id: 16, empCode: 'SHE362', category: 'Casual', name: 'Prakashbhai Jasvantbhai Padhiyar',
    unit: 'UNIT-2', floor: 'Bushing', department: 'Casting', contractor: 'Payroll AI',
    doj: '2025-11-03', bankName: 'SBI', accountNo: '65292108892', ifsc: 'SBIN0032681',
    uan: '102030731069', esicNo: '3813633717', aadhar: '', salaryType: 'PER DAY',
    perDayRate: 489.5, fixedPay: 7342.5, paymentMode: 'BANK',
  },
  {
    id: 17, empCode: 'SHE369', category: 'Casual', name: 'Padhiyar Saileshbhai Sureshbhai',
    unit: 'UNIT-2', floor: 'Bushing', department: 'Finishing & Labelling', contractor: 'Payroll AI',
    doj: '2025-11-05', bankName: 'SBI', accountNo: '42926929494', ifsc: 'SBIN0001035',
    uan: '101482079880', esicNo: '3812220669', aadhar: '', salaryType: 'PER DAY',
    perDayRate: 489.5, fixedPay: 7342.5, paymentMode: 'BANK',
  },
  {
    id: 18, empCode: 'SHE371', category: 'Casual', name: 'Shaikh Arbajbhai Mahamadbhai',
    unit: 'UNIT-2', floor: 'MV', department: 'Packing', contractor: 'Payroll AI',
    doj: '2025-11-07', bankName: 'UCO', accountNo: '30270110063927', ifsc: 'UCBA0003027',
    uan: '101814224691', esicNo: '3813632623', aadhar: '', salaryType: 'PER DAY',
    perDayRate: 489.5, fixedPay: 7342.5, paymentMode: 'BANK',
  },
  {
    id: 19, empCode: 'SHE373', category: 'Casual', name: 'Sindha Karansinh Rameshbhai',
    unit: 'UNIT-2', floor: 'Store', department: 'Store', contractor: 'Payroll AI',
    doj: '2025-11-10', bankName: 'BOB', accountNo: '03040100012544', ifsc: 'BARB0DHUVAR',
    uan: '101699712397', esicNo: '3813632628', aadhar: '', salaryType: 'PER DAY',
    perDayRate: 489.5, fixedPay: 7342.5, paymentMode: 'BANK',
  },
  {
    id: 20, empCode: 'MK0045', category: 'Borsad', name: 'Chetan Sureshbhai Gohel',
    unit: 'UNIT-2', floor: 'MV', department: 'Assembly', contractor: 'Payroll AI',
    doj: '2025-05-03', bankName: 'SBI', accountNo: '44160747698', ifsc: 'SBIN0018086',
    uan: '102209214448', esicNo: '3813573772', aadhar: '', salaryType: 'PER DAY',
    perDayRate: 489.5, fixedPay: 7342.5, paymentMode: 'BANK',
  },
];

export const departments = [...new Set(employees.map((e) => e.department))].sort();
export const floors = [...new Set(employees.map((e) => e.floor))].sort();
export const categories = [...new Set(employees.map((e) => e.category))].sort();

export function getEmployee(empCode: string): Employee | undefined {
  return employees.find((e) => e.empCode === empCode);
}

export function searchEmployees(query: string): Employee[] {
  const q = query.toLowerCase();
  return employees.filter(
    (e) =>
      e.name.toLowerCase().includes(q) ||
      e.empCode.toLowerCase().includes(q) ||
      e.department.toLowerCase().includes(q) ||
      e.floor.toLowerCase().includes(q)
  );
}
