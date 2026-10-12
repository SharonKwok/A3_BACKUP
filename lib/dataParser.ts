import Papa from 'papaparse';
import * as XLSX from 'xlsx';

/**
 * Standard Customer Record interface matching restaurant_customer_satisfaction dataset
 */
export interface CustomerRecord {
  CustomerID: number | string;
  Age?: number;
  Gender?: string;
  Income?: number;
  VisitFrequency?: string;
  AverageSpend?: number;
  PreferredCuisine?: string;
  TimeOfVisit?: string;
  GroupSize?: number;
  DiningOccasion?: string;
  MealType?: string;
  OnlineReservation?: number;
  DeliveryOrder?: number;
  LoyaltyProgramMember?: number;
  WaitTime: number;
  ServiceRating: number;
  FoodRating: number;
  AmbianceRating: number;
  HighSatisfaction: number;
  _hasMissing?: boolean;
  _missingFields?: string[];
  [key: string]: any;
}

export interface MissingValueFieldReport {
  field: string;
  label: string;
  missingCount: number;
  missingPercent: number;
  status: 'clean' | 'warning' | 'critical';
}

export interface MissingValueReport {
  totalRows: number;
  totalFieldsChecked: number;
  cleanRowsCount: number;
  rowsWithMissingCount: number;
  totalMissingCells: number;
  overallCompletenessPct: number;
  fields: MissingValueFieldReport[];
  hasMissing: boolean;
}

/**
 * Standard Customer features expected in satisfaction datasets
 */
export const TARGET_DATASET_FIELDS: { key: string; label: string; aliases: string[] }[] = [
  { key: 'CustomerID', label: 'Customer ID', aliases: ['customerid', 'id', 'custid', 'client', 'clientid'] },
  { key: 'Age', label: 'Age', aliases: ['age', 'customerage'] },
  { key: 'Gender', label: 'Gender', aliases: ['gender', 'sex'] },
  { key: 'Income', label: 'Annual Income', aliases: ['income', 'annualincome', 'salary'] },
  { key: 'VisitFrequency', label: 'Visit Frequency', aliases: ['visitfrequency', 'frequency'] },
  { key: 'AverageSpend', label: 'Average Spend', aliases: ['averagespend', 'avgspend', 'spend', 'billamount'] },
  { key: 'PreferredCuisine', label: 'Preferred Cuisine', aliases: ['preferredcuisine', 'cuisine'] },
  { key: 'TimeOfVisit', label: 'Time of Visit', aliases: ['timeofvisit', 'time', 'visittime', 'mealtime'] },
  { key: 'GroupSize', label: 'Group Size', aliases: ['groupsize', 'partysize', 'party', 'guests'] },
  { key: 'DiningOccasion', label: 'Dining Occasion', aliases: ['diningoccasion', 'occasion'] },
  { key: 'MealType', label: 'Meal Type', aliases: ['mealtype', 'type', 'diningtype', 'channel'] },
  { key: 'OnlineReservation', label: 'Online Reservation', aliases: ['onlinereservation', 'reservedonline', 'reservation'] },
  { key: 'DeliveryOrder', label: 'Delivery Order', aliases: ['deliveryorder', 'delivery'] },
  { key: 'LoyaltyProgramMember', label: 'Loyalty Member', aliases: ['loyaltyprogrammember', 'loyalty', 'member', 'ismember'] },
  { key: 'WaitTime', label: 'Wait Time', aliases: ['waittime', 'wait', 'waitminutes', 'latency'] },
  { key: 'ServiceRating', label: 'Service Rating', aliases: ['servicerating', 'service', 'servicescore'] },
  { key: 'FoodRating', label: 'Food Rating', aliases: ['foodrating', 'food', 'culinaryrating'] },
  { key: 'AmbianceRating', label: 'Ambiance Rating', aliases: ['ambiancerating', 'ambience', 'atmosphererating'] },
  { key: 'HighSatisfaction', label: 'High Satisfaction', aliases: ['highsatisfaction', 'satisfied', 'satisfaction'] },
];

/**
 * Robust check if a single cell is empty / missing / blank / whitespace / NaN / null
 */
export function isCellEmpty(val: any): boolean {
  if (val === undefined || val === null) return true;
  if (typeof val === 'number') return isNaN(val);
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed === '') return true;
    const lower = trimmed.toLowerCase();
    if (
      lower === 'null' ||
      lower === 'undefined' ||
      lower === 'nan' ||
      lower === 'n/a' ||
      lower === 'na' ||
      lower === 'none' ||
      lower === 'nil' ||
      lower === '-' ||
      lower === '--' ||
      lower === '?' ||
      lower === '#n/a' ||
      lower === '#null!' ||
      lower === '#value!' ||
      lower === '#div/0!' ||
      lower === 'void'
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Inspects a dataset for missing/null/undefined/blank/NaN values
 */
export function analyzeMissingValues(rows: any[]): MissingValueReport {
  if (!rows || rows.length === 0) {
    return {
      totalRows: 0,
      totalFieldsChecked: TARGET_DATASET_FIELDS.length,
      cleanRowsCount: 0,
      rowsWithMissingCount: 0,
      totalMissingCells: 0,
      overallCompletenessPct: 100,
      fields: [],
      hasMissing: false,
    };
  }

  const fieldStats: Record<string, number> = {};
  TARGET_DATASET_FIELDS.forEach(f => { fieldStats[f.key] = 0; });

  let rowsWithMissingCount = 0;
  let totalMissingCells = 0;

  rows.forEach((row) => {
    // If the row already has computed _missingFields, use it
    if (row._hasMissing !== undefined && Array.isArray(row._missingFields)) {
      if (row._hasMissing) {
        rowsWithMissingCount += 1;
        totalMissingCells += row._missingFields.length;
        row._missingFields.forEach((fieldKey: string) => {
          if (fieldStats[fieldKey] !== undefined) {
            fieldStats[fieldKey] += 1;
          }
        });
      }
      return;
    }

    // Otherwise compute row-by-row dynamically
    let rowHasMissing = false;
    TARGET_DATASET_FIELDS.forEach((tf) => {
      let val = row[tf.key];
      if (val === undefined) {
        const cleanAliases = tf.aliases.map(a => a.toLowerCase().replace(/[\s_-]+/g, ''));
        for (const [k, v] of Object.entries(row)) {
          if (cleanAliases.includes(k.toLowerCase().replace(/[\s_-]+/g, ''))) {
            val = v;
            break;
          }
        }
      }

      if (isCellEmpty(val)) {
        fieldStats[tf.key] += 1;
        totalMissingCells += 1;
        rowHasMissing = true;
      }
    });

    if (rowHasMissing) {
      rowsWithMissingCount += 1;
    }
  });

  const totalRows = rows.length;
  const totalCells = totalRows * TARGET_DATASET_FIELDS.length;
  const overallCompletenessPct = totalCells > 0
    ? Math.max(0, Math.min(100, Number((((totalCells - totalMissingCells) / totalCells) * 100).toFixed(1))))
    : 100;

  const fieldReports: MissingValueFieldReport[] = TARGET_DATASET_FIELDS.map((tf) => {
    const missing = fieldStats[tf.key] || 0;
    const missingPercent = totalRows > 0 ? Number(((missing / totalRows) * 100).toFixed(1)) : 0;
    let status: 'clean' | 'warning' | 'critical' = 'clean';
    if (missingPercent > 10) status = 'critical';
    else if (missing > 0) status = 'warning';

    return {
      field: tf.key,
      label: tf.label,
      missingCount: missing,
      missingPercent,
      status,
    };
  });

  return {
    totalRows,
    totalFieldsChecked: TARGET_DATASET_FIELDS.length,
    cleanRowsCount: Math.max(0, totalRows - rowsWithMissingCount),
    rowsWithMissingCount,
    totalMissingCells,
    overallCompletenessPct,
    fields: fieldReports,
    hasMissing: rowsWithMissingCount > 0,
  };
}

/**
 * Filter out any row containing one or more missing/blank cells
 */
export function dropMissingValueRows<T extends { _hasMissing?: boolean }>(rows: T[]): T[] {
  return rows.filter((r) => !r._hasMissing);
}

/**
 * Normalizes raw parsed rows from CSV or XLSX so column names match regardless of casing or extra spaces
 * Accurately detects and records if ANY cell in the row is blank/missing
 */
export function normalizeCustomerRow(raw: Record<string, any>, index: number): CustomerRecord {
  const normalized: Record<string, any> = {};
  const missingFields: string[] = [];

  // 1. Inspect all raw keys in the row for missing/blank cells
  for (const [key, value] of Object.entries(raw)) {
    if (!key || key.startsWith('_') || key.startsWith('__')) continue;
    const cleanKey = key.trim().toLowerCase().replace(/[\s_-]+/g, '');
    normalized[cleanKey] = value;

    if (isCellEmpty(value)) {
      missingFields.push(key);
    }
  }

  // 2. Also inspect the 19 standard customer satisfaction features
  for (const field of TARGET_DATASET_FIELDS) {
    const cleanAliases = field.aliases.map(a => a.toLowerCase().replace(/[\s_-]+/g, ''));
    let foundValue: any = undefined;
    let wasFoundInRecord = false;

    for (const [k, v] of Object.entries(raw)) {
      if (cleanAliases.includes(k.toLowerCase().replace(/[\s_-]+/g, ''))) {
        foundValue = v;
        wasFoundInRecord = true;
        break;
      }
    }

    if (!wasFoundInRecord || isCellEmpty(foundValue)) {
      if (!missingFields.includes(field.key)) {
        missingFields.push(field.key);
      }
    }
  }

  const hasMissing = missingFields.length > 0;

  const getVal = (possibleKeys: string[], defaultVal: any = undefined) => {
    for (const pk of possibleKeys) {
      const cleanPk = pk.toLowerCase().replace(/[\s_-]+/g, '');
      if (normalized[cleanPk] !== undefined && normalized[cleanPk] !== null && normalized[cleanPk] !== '') {
        return normalized[cleanPk];
      }
    }
    return defaultVal;
  };

  const toNum = (val: any, fallback = 0) => {
    if (val === undefined || val === null || val === '') return fallback;
    const parsed = Number(val);
    return isNaN(parsed) ? fallback : parsed;
  };

  const customerId = getVal(['CustomerID', 'ID', 'CustID', 'Client', 'Id'], index + 1);

  // Normalize wait time, ratings, satisfaction
  const waitTime = toNum(getVal(['WaitTime', 'Wait_Time', 'Wait', 'WaitMinutes', 'WaitTimeMinutes', 'Latency']), 15);
  const serviceRating = toNum(getVal(['ServiceRating', 'Service_Rating', 'Service', 'ServiceScore', 'StaffRating']), 4);
  const foodRating = toNum(getVal(['FoodRating', 'Food_Rating', 'Food', 'CulinaryRating', 'FoodScore']), 4);
  const ambianceRating = toNum(getVal(['AmbianceRating', 'AmbienceRating', 'Ambiance', 'Ambience', 'AtmosphereRating']), 4);

  // HighSatisfaction calculation fallback: if not provided or 0/1, compute if (ServiceRating >= 4 and FoodRating >= 4)
  let highSat = getVal(['HighSatisfaction', 'High_Satisfaction', 'Satisfied', 'IsSatisfied', 'Satisfaction']);
  if (highSat === undefined || highSat === null || highSat === '') {
    highSat = serviceRating >= 4 && foodRating >= 4 ? 1 : 0;
  } else {
    highSat = toNum(highSat, 0) >= 1 ? 1 : 0;
  }

  // Dining occasion normalization
  let diningOccasion = String(getVal(['DiningOccasion', 'Occasion', 'Dining_Occasion'], 'Casual')).trim();
  const occLower = diningOccasion.toLowerCase();
  if (occLower.includes('bus')) diningOccasion = 'Business';
  else if (occLower.includes('cel') || occLower.includes('bir') || occLower.includes('anniv')) diningOccasion = 'Celebration';
  else diningOccasion = 'Casual';

  // Meal type normalization (Dine-in vs Takeaway)
  let mealType = String(getVal(['MealType', 'Meal_Type', 'Type', 'DiningType', 'Channel'], 'Dine-in')).trim();
  const mealLower = mealType.toLowerCase();
  if (mealLower.includes('take') || mealLower.includes('out') || mealLower.includes('pick')) {
    mealType = 'Takeaway';
  } else {
    mealType = 'Dine-in';
  }

  // Loyalty Program Member (1 or 0)
  let loyalty = getVal(['LoyaltyProgramMember', 'Loyalty', 'Member', 'IsMember', 'LoyaltyMember'], 0);
  if (typeof loyalty === 'string') {
    const lLower = loyalty.toLowerCase().trim();
    loyalty = lLower === 'yes' || lLower === 'true' || lLower === 'member' || lLower === '1' ? 1 : 0;
  } else {
    loyalty = toNum(loyalty, 0) >= 1 ? 1 : 0;
  }

  return {
    CustomerID: customerId,
    Age: toNum(getVal(['Age', 'CustomerAge']), 35),
    Gender: String(getVal(['Gender', 'Sex'], 'Other')).trim(),
    Income: toNum(getVal(['Income', 'AnnualIncome', 'Salary']), 75000),
    VisitFrequency: String(getVal(['VisitFrequency', 'Frequency'], 'Monthly')).trim(),
    AverageSpend: toNum(getVal(['AverageSpend', 'AvgSpend', 'Spend', 'BillAmount']), 85),
    PreferredCuisine: String(getVal(['PreferredCuisine', 'Cuisine'], 'American')).trim(),
    TimeOfVisit: String(getVal(['TimeOfVisit', 'Time', 'VisitTime', 'MealTime'], 'Dinner')).trim(),
    GroupSize: toNum(getVal(['GroupSize', 'PartySize', 'Party', 'Guests']), 2),
    DiningOccasion: diningOccasion,
    MealType: mealType,
    OnlineReservation: toNum(getVal(['OnlineReservation', 'ReservedOnline', 'Reservation']), 0),
    DeliveryOrder: toNum(getVal(['DeliveryOrder', 'Delivery']), 0),
    LoyaltyProgramMember: loyalty,
    WaitTime: waitTime,
    ServiceRating: serviceRating,
    FoodRating: foodRating,
    AmbianceRating: ambianceRating,
    HighSatisfaction: highSat,
    _hasMissing: hasMissing,
    _missingFields: missingFields,
    _rawValues: raw,
  };
}

/**
 * Parses an uploaded File (.csv, .xlsx, .xls) into normalized CustomerRecord array
 */
export async function parseUploadedFile(file: File): Promise<{ data: CustomerRecord[]; filename: string }> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'xlsx' || extension === 'xls') {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new Error('Excel workbook contains no sheets.');
    }
    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

    if (!rawRows || rawRows.length === 0) {
      throw new Error('Uploaded Excel sheet contains no data rows.');
    }

    const data = rawRows.map((row, idx) => normalizeCustomerRow(row, idx));
    return { data, filename: file.name };
  }

  if (extension === 'csv' || file.type.includes('csv') || file.type.includes('text')) {
    const text = await file.text();
    return new Promise((resolve, reject) => {
      Papa.parse<Record<string, any>>(text, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (!results.data || results.data.length === 0) {
            reject(new Error('Uploaded CSV file contains no data rows.'));
            return;
          }
          const data = results.data.map((row, idx) => normalizeCustomerRow(row, idx));
          resolve({ data, filename: file.name });
        },
        error: (err: Error) => {
          reject(new Error(`CSV parse error: ${err.message}`));
        },
      });
    });
  }

  throw new Error(`Unsupported file format (.${extension}). Please upload a .csv or .xlsx file.`);
}
