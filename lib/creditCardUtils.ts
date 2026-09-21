import { CardTemplate, CreditCard, HolidayRule } from '@/types';

export const CARD_TEMPLATES: CardTemplate[] = [
  {
    name: '楽天カード',
    company: '楽天カード',
    closing_day: 0,
    payment_month_offset: 1,
    payment_day: 27,
    holiday_rule: 'next_business_day',
    color: '#dc2626',
    description: '月末締め / 翌月27日引き落とし (土日祝は翌営業日)',
  },
  {
    name: '三井住友カード (10日払)',
    company: '三井住友カード',
    closing_day: 15,
    payment_month_offset: 1,
    payment_day: 10,
    holiday_rule: 'next_business_day',
    color: '#16a34a',
    description: '毎月15日締め / 翌月10日引き落とし (土日祝は翌営業日)',
  },
  {
    name: '三井住友カード (26日払)',
    company: '三井住友カード',
    closing_day: 0,
    payment_month_offset: 1,
    payment_day: 26,
    holiday_rule: 'next_business_day',
    color: '#16a34a',
    description: '毎月末日締め / 翌月26日引き落とし (土日祝は翌営業日)',
  },
  {
    name: 'JCBカード',
    company: 'JCB',
    closing_day: 15,
    payment_month_offset: 1,
    payment_day: 10,
    holiday_rule: 'next_business_day',
    color: '#2563eb',
    description: '毎月15日締め / 翌月10日引き落とし (土日祝は翌営業日)',
  },
  {
    name: 'エポスカード (27日払)',
    company: '丸井グループ',
    closing_day: 27,
    payment_month_offset: 1,
    payment_day: 27,
    holiday_rule: 'next_business_day',
    color: '#b91c1c',
    description: '毎月27日締め / 翌月27日引き落とし (土日祝は翌営業日)',
  },
  {
    name: 'エポスカード (4日払)',
    company: '丸井グループ',
    closing_day: 4,
    payment_month_offset: 1,
    payment_day: 4,
    holiday_rule: 'next_business_day',
    color: '#b91c1c',
    description: '毎月4日締め / 翌月4日引き落とし (土日祝は翌営業日)',
  },
  {
    name: 'PayPayカード',
    company: 'PayPayカード',
    closing_day: 0,
    payment_month_offset: 1,
    payment_day: 27,
    holiday_rule: 'next_business_day',
    color: '#ea580c',
    description: '毎月末日締め / 翌月27日引き落とし (土日祝は翌営業日)',
  },
  {
    name: 'セゾンカード',
    company: 'クレディセゾン',
    closing_day: 10,
    payment_month_offset: 1,
    payment_day: 4,
    holiday_rule: 'next_business_day',
    color: '#0284c7',
    description: '毎月10日締め / 翌月4日引き落とし (土日祝は翌営業日)',
  },
  {
    name: 'ビューカード (Viewカード)',
    company: 'JR東日本',
    closing_day: 0,
    payment_month_offset: 2,
    payment_day: 4,
    holiday_rule: 'next_business_day',
    color: '#059669',
    description: '毎月末日締め / 翌々月4日引き落とし (土日祝は翌営業日)',
  },
  {
    name: 'イオンカード',
    company: 'イオンフィナンシャル',
    closing_day: 10,
    payment_month_offset: 1,
    payment_day: 2,
    holiday_rule: 'next_business_day',
    color: '#9333ea',
    description: '毎月10日締め / 翌月2日引き落とし (土日祝は翌営業日)',
  },
];

export function isJapaneseBankHoliday(date: Date): boolean {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = date.getDay();

  if ((month === 12 && day === 31) || (month === 1 && (day === 2 || day === 3))) {
    return true;
  }

  if (
    (month === 1 && day === 1) ||
    (month === 2 && day === 11) ||
    (month === 2 && day === 23) ||
    (month === 4 && day === 29) ||
    (month === 5 && day === 3) ||
    (month === 5 && day === 4) ||
    (month === 5 && day === 5) ||
    (month === 8 && day === 11) ||
    (month === 11 && day === 3) ||
    (month === 11 && day === 23)
  ) {
    return true;
  }

  const vernalEquinoxDay = Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
  const autumnalEquinoxDay = Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));

  if (month === 3 && day === vernalEquinoxDay) return true;
  if (month === 9 && day === autumnalEquinoxDay) return true;

  const nthMonday = Math.ceil(day / 7);
  if (dayOfWeek === 1) {
    if (month === 1 && nthMonday === 2) return true;
    if (month === 7 && nthMonday === 3) return true;
    if (month === 9 && nthMonday === 3) return true;
    if (month === 10 && nthMonday === 2) return true;
  }

  if (dayOfWeek === 1) {
    const yesterday = new Date(year, month - 1, day - 1);
    if (isJapaneseBankHoliday(yesterday)) {
      return true;
    }
  }

  if (month === 5 && day === 6 && (dayOfWeek === 2 || dayOfWeek === 3)) {
    return true;
  }

  return false;
}

export function isBankBusinessDay(date: Date): boolean {
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) return false;
  if (isJapaneseBankHoliday(date)) return false;
  return true;
}

export function adjustPaymentDateForHolidays(targetDate: Date, rule: HolidayRule): Date {
  const result = new Date(targetDate.getTime());
  if (rule === 'none') return result;

  if (rule === 'next_business_day') {
    while (!isBankBusinessDay(result)) {
      result.setDate(result.getDate() + 1);
    }
    return result;
  }

  if (rule === 'prev_business_day') {
    while (!isBankBusinessDay(result)) {
      result.setDate(result.getDate() - 1);
    }
    return result;
  }

  return result;
}

export function calculateBillingDate(usageDateStr: string, card: CreditCard): string {
  const [yearStr, monthStr, dayStr] = usageDateStr.split('-');
  const uYear = parseInt(yearStr, 10);
  const uMonth = parseInt(monthStr, 10) - 1;
  const uDay = parseInt(dayStr, 10);

  let cycleMonth = uMonth;
  let cycleYear = uYear;

  if (card.closing_day > 0) {
    if (uDay > card.closing_day) {
      cycleMonth += 1;
      if (cycleMonth > 11) {
        cycleMonth = 0;
        cycleYear += 1;
      }
    }
  }

  let payMonth = cycleMonth + card.payment_month_offset;
  let payYear = cycleYear;
  while (payMonth > 11) {
    payMonth -= 12;
    payYear += 1;
  }

  const lastDayOfPayMonth = new Date(payYear, payMonth + 1, 0).getDate();
  let targetDay = card.payment_day === 0 ? lastDayOfPayMonth : Math.min(card.payment_day, lastDayOfPayMonth);

  const basePaymentDate = new Date(payYear, payMonth, targetDay);
  const finalPaymentDate = adjustPaymentDateForHolidays(basePaymentDate, card.holiday_rule);

  const fYear = finalPaymentDate.getFullYear();
  const fMonth = String(finalPaymentDate.getMonth() + 1).padStart(2, '0');
  const fDay = String(finalPaymentDate.getDate()).padStart(2, '0');

  return `${fYear}-${fMonth}-${fDay}`;
}
