export interface Product {
  id: number;
  jan: string;
  name: string;
  category: string;
  price: number;
  costRate: number;
  baseOrder: number;
  color?: string;
  iconName?: string;
  isKeyItem: boolean;
}

export interface WasteLog {
  id: number;
  date: string;
  productId: number;
  qty: number;
  reason: string;
  dayId: string;
  weatherId: string;
  lossYen: number;
}

export interface ContextualFactor {
  weatherFactor: number;
  dayFactor: number;
  baseFactor: number;
  contextFactor: number;
  finalFactor: number;
  recommended: number;
  confidence: string;
  contextCount: number;
  baseWasteRate: number;
  lossYen: number;
  saving: number;
  dayBreakdown: { day: string; 廃棄率: number }[];
}

import { DAY_TYPES, WEATHER_TYPES } from './WeatherService';

const DOW_LABELS = ['日', '月', '火', '水', '木', '金', '土'];
const DAY_IDS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export const calculateContextualFactors = (
  products: Product[],
  wasteLogs: WasteLog[],
  weatherContext: { dayId: string; weatherId: string }
): Record<number, ContextualFactor> => {
  const result: Record<number, ContextualFactor> = {};

  const todayWeather = WEATHER_TYPES.find(w => w.id === weatherContext.weatherId);
  const todayDayType = DAY_TYPES.find(d => d.id === weatherContext.dayId);
  
  const weatherFactor = todayWeather?.factor ?? 1.0;
  const dayFactor = todayDayType?.factor ?? 1.0;

  products.forEach(p => {
    const allLogs = wasteLogs.filter(l => l.productId === p.id);
    const recent14 = allLogs.slice(-14);
    const totalWasted = recent14.reduce((a, l) => a + l.qty, 0);
    const baseWasteRate = totalWasted / Math.max(recent14.length * p.baseOrder, 1);
    const baseFactor = Math.max(0.65, Math.min(1.25, 1.0 - baseWasteRate * 1.4));

    const todayDayId = weatherContext.dayId;
    const todayWeatherId = weatherContext.weatherId;

    const exactMatch = allLogs.filter(l => l.dayId === todayDayId && l.weatherId === todayWeatherId);
    const dayMatch = allLogs.filter(l => l.dayId === todayDayId);
    const weatherMatch = allLogs.filter(l => l.weatherId === todayWeatherId);

    let contextLogs: WasteLog[], confidence: string;
    if (exactMatch.length >= 3) {
      contextLogs = exactMatch;
      confidence = "高";
    } else if (dayMatch.length >= 3) {
      contextLogs = dayMatch;
      confidence = "中（曜日一致）";
    } else if (weatherMatch.length >= 3) {
      contextLogs = weatherMatch;
      confidence = "中（天候一致）";
    } else if (allLogs.length >= 3) {
      contextLogs = allLogs;
      confidence = "低（全期間）";
    } else {
      contextLogs = [];
      confidence = "データ不足";
    }

    let contextFactor = 1.0;
    if (contextLogs.length > 0) {
      const cw = contextLogs.reduce((a, l) => a + l.qty, 0) / Math.max(contextLogs.length * p.baseOrder, 1);
      contextFactor = Math.max(0.65, Math.min(1.25, 1.0 - cw * 1.4));
    }

    const cw = Math.min(contextLogs.length / 10, 0.7);
    
    // Cold-start fallback: Use weather and day factors if no logs are available
    // As logs accumulate, shift from general factors to real behavior
    const basePredictionFactor = (baseFactor * (1 - cw) + contextFactor * cw);
    const environmentalFactor = (weatherFactor * 0.6 + dayFactor * 0.4);
    
    // Weight environmental factors more heavily when data is scarce
    const weight = Math.min(contextLogs.length / 5, 0.8); // Max 80% focus on logs once 5 entries exist
    const finalFactor = Math.max(0.6, Math.min(1.4, basePredictionFactor * weight + environmentalFactor * (1 - weight)));
    
    const recommended = Math.max(1, Math.round(p.baseOrder * finalFactor));
    const lossYen = recent14.reduce((a, l) => a + l.lossYen, 0);
    const saving = Math.round(lossYen / Math.max(recent14.length, 1) * 30 * Math.max(0, 1 - finalFactor) * 0.6);

    const dayBreakdown = DOW_LABELS.map((label, i) => {
      const dayId = DAY_IDS[i];
      const matchLogs = allLogs.filter(l => l.dayId === dayId);
      return {
        day: label,
        廃棄率: matchLogs.length > 0
          ? Math.round(matchLogs.reduce((a, l) => a + l.qty, 0) / (matchLogs.length * p.baseOrder) * 100)
          : 0,
      };
    });

    result[p.id] = {
      weatherFactor,
      dayFactor,
      baseFactor,
      contextFactor,
      finalFactor,
      recommended,
      confidence: contextLogs.length < 1 ? "天気・曜日予測" : confidence,
      contextCount: contextLogs.length,
      baseWasteRate,
      lossYen,
      saving,
      dayBreakdown
    };
  });

  return result;
};

export const SAMPLE_PRODUCTS: Product[] = [
  { id: 1, jan: "4901777123456", name: "ツナマヨおにぎり", category: "おにぎり", price: 148, costRate: 0.55, baseOrder: 24, iconName: "Package", isKeyItem: true },
  { id: 4, jan: "4901777456789", name: "からあげ弁当", category: "弁当", price: 448, costRate: 0.60, baseOrder: 18, iconName: "Box", isKeyItem: true },
  { id: 9, jan: "4901777890123", name: "コーヒー(M)", category: "ドリンク", price: 150, costRate: 0.40, baseOrder: 30, iconName: "CupSoda", isKeyItem: true },
];

export const SAMPLE_LOGS: WasteLog[] = [
  { id: 1, date: "2026-03-29", productId: 1, qty: 5, reason: "weather", dayId: "mon", weatherId: "rainy", lossYen: 407 },
  { id: 2, date: "2026-03-28", productId: 1, qty: 6, reason: "weather", dayId: "sun", weatherId: "heavy", lossYen: 488 },
];
