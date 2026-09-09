export const formatSectionName = (sec?: string): string => {
  if (!sec) return 'Section A';
  const s = sec.toString().trim().toUpperCase();
  if (s === 'A' || s === 'SEC A' || s === 'SECTION A') return 'Section A';
  if (s === 'B' || s === 'SEC B' || s === 'SECTION B') return 'Section B';
  if (s === 'C' || s === 'SEC C' || s === 'SECTION C') return 'Section C';
  if (/^[A-Z]$/.test(s)) return `Section ${s}`;
  return sec;
};
