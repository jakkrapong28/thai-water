const number = value => value === null || value === undefined || value === '' ? null : Number.isFinite(Number(value)) ? Number(value) : null;

// ThaiWater: situation 4 = high water, 5 = overflowing. Do not call normal level 3 a warning.
export function riverRisk(item) {
  if (String(item.diff_wl_bank_text || '').includes('ล้นตลิ่ง') || number(item.situation_level) === 5) return 3;
  for (const [reading, limit] of [[item.waterlevel_msl,item.station?.critical_level_msl],[item.waterlevel_m,item.station?.critical_level_m]]) {
    const value = number(reading), threshold = number(limit);
    if (value !== null && threshold !== null && value >= threshold) return 3;
  }
  return number(item.situation_level) === 4 ? 2 : 0;
}
