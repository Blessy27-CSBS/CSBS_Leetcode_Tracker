export const formatSectionName = (sec?: string): string => {
  if (!sec) return '';
  const s = sec.toString().trim().toUpperCase();
  if (s === 'A' || s === 'SECTION A' || s === 'SEC A') return 'II Year';
  if (s === 'B' || s === 'SECTION B' || s === 'SEC B') return 'III Year';
  if (s === 'C' || s === 'SECTION C' || s === 'SEC C') return 'IV Year';
  if (s.includes('A')) return 'II Year';
  if (s.includes('B')) return 'III Year';
  if (s.includes('C')) return 'IV Year';
  return sec;
};
