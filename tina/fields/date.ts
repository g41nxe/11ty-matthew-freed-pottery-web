// Dates stay "MM-DD-YYYY", the format every date filter in .eleventy.js
// reads. The fields use Tina's date picker on a string field: a "datetime"
// field would make Tina's server rewrite every date to an ISO timestamp.
const US_DATE = /^(\d{2})-(\d{2})-(\d{4})$/;

const usDate = (value: string) =>
  value && !US_DATE.test(value) ? "Use MM-DD-YYYY, for example 10-04-2026" : undefined;

// "10-04-2026" -> "2026-10-04T00:00:00", which every browser reads as local
// midnight (Safari rejects "10-04-2026" itself).
const fromUsDate = (value: string): string => {
  const m = value?.match(US_DATE);
  return m ? `${m[3]}-${m[1]}-${m[2]}T00:00:00` : value;
};

// The picker hands over an ISO timestamp: local midnight when a date is
// changed, the current clock time when the field was empty. Either way the
// editor's browser shows the day they picked, so only that day is kept.
const pad = (n: number) => String(n).padStart(2, "0");
const toUsDate = (value: string): string => {
  if (!value || US_DATE.test(value)) return value;
  const day = new Date(value);
  return isNaN(day.getTime())
    ? value
    : `${pad(day.getMonth() + 1)}-${pad(day.getDate())}-${day.getFullYear()}`;
};

export const datePicker = {
  component: "date",
  dateFormat: "MM-DD-YYYY",
  parse: toUsDate,
  format: fromUsDate,
  validate: usDate,
};

// For a list of dates. Tina builds every entry from `ui.field`, so each
// entry gets the same picker; required: false keeps a new, empty entry
// from showing today's date. `component: "list"` is Tina's default for a
// string list, spelled out because UIField does not declare `field`.
export const dateList = { component: "list", field: { ...datePicker, required: false } };

// Item labels in lists, shown in the editor's own calendar.
export const dayLabel = (value?: string): string => {
  if (!value) return "";
  const day = new Date(fromUsDate(value));
  return isNaN(day.getTime())
    ? value
    : day.toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
};
