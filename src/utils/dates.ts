export const isDateBetween = (date: Date | undefined, minDate: Date, maxDate: Date = new Date) => (
  date ? (minDate <= date && date < maxDate) : false
)

export const getTrimesterDates = (trimester: number, year = new Date().getFullYear()) => [
  new Date(year, trimester * 3 - 3, 1),
  new Date(year, trimester * 3, 1),
] as const;

export const isDateInTrimester = (date: Date | undefined, trimester: number, year?: number) => (
  isDateBetween(date, ...getTrimesterDates(trimester, year))
);

const monthNames = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

export const getMonthName = (month: number) => monthNames[month];

export const getMonthNameShort = (month: number) => monthNames[month].substring(0, 4);

export const formatDateIso = (date: Date | undefined) => {
  if (!date) return '';

  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  const dayIso = day < 10 ? `0${day}` : day;
  const monthIso = month < 10 ? `0${month}` : month;

  return `${year}-${monthIso}-${dayIso}`;
}

export const formatDateFr = (date: Date | undefined) => {
  if (!date) return '';

  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();

  const dayFr = day < 10 ? `0${day}` : day;

  return `${dayFr} ${getMonthName(month)} ${year}`;
}