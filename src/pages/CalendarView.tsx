import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronRight, ChevronLeft, CalendarDays, Users } from 'lucide-react';
import type { Apartment, Location, Booking } from '@/types';
import { useI18n } from '@/context/I18nContext';
import { formatDate } from '@/lib/utils';

interface CalendarProps {
  apartments: Apartment[];
  locations: Location[];
  bookings: Booking[];
}

const DAY_WIDTH = 56;
const CHECK_IN_RATIO = 16 / 24;
const CHECK_OUT_RATIO = 12 / 24;

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function dateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function sourceColors(source: string): { bg: string; border: string } {
  switch (source) {
    case 'airbnb':   return { bg: 'bg-airbnb',    border: 'border-airbnb' };
    case 'gathern':  return { bg: 'bg-purple-600', border: 'border-purple-700' };
    case 'direct':   return { bg: 'bg-sky-600',    border: 'border-sky-700' };
    default:         return { bg: 'bg-whatsapp',   border: 'border-whatsapp' };
  }
}

export function CalendarView({ apartments, bookings }: CalendarProps) {
  const { t } = useI18n();
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 3);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const days = useMemo(() => {
    const arr: Date[] = [];
    for (let i = 0; i < 30; i++) arr.push(addDays(startDate, i));
    return arr;
  }, [startDate]);

  const todayIndex = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return days.findIndex((d) => d.getTime() === today.getTime());
  }, [days]);

  useEffect(() => {
    if (scrollRef.current && todayIndex >= 0) {
      scrollRef.current.scrollLeft = todayIndex * DAY_WIDTH;
    }
  }, [todayIndex]);

  const activeBookings = useMemo(() => bookings.filter((b) => !b.archived), [bookings]);

  const bookingsByApartment = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of activeBookings) {
      if (!map.has(b.apartment_id)) map.set(b.apartment_id, []);
      map.get(b.apartment_id)!.push(b);
    }
    return map;
  }, [activeBookings]);

  const monthLabel = useMemo(() => {
    const first = days[0];
    const last = days[days.length - 1];
    const sameMonth = first.getMonth() === last.getMonth() && first.getFullYear() === last.getFullYear();
    const fmt = (d: Date) => {
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${month}/${year}`;
    };
    return sameMonth ? fmt(first) : `${fmt(first)} - ${fmt(last)}`;
  }, [days]);

  const visibleStart = dateStr(days[0]);
  const visibleEnd = dateStr(days[days.length - 1]);

  const visibleBookingCount = activeBookings.filter(
    (b) => b.check_in <= visibleEnd && b.check_out > visibleStart
  ).length;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('calendar')}</h1>
          <p className="text-sm text-slate-400 mt-1">{t('calendar_subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setStartDate((d) => addDays(d, -7))} className="btn-secondary p-2.5">
            <ChevronRight size={18} />
          </button>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 min-w-[120px] text-center">{monthLabel}</span>
          <button onClick={() => setStartDate((d) => addDays(d, 7))} className="btn-secondary p-2.5">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => { const d = new Date(); d.setDate(d.getDate() - 3); d.setHours(0,0,0,0); setStartDate(d); }} className="btn-secondary text-xs">
            <CalendarDays size={16} />
            {t('calendar_today') as string}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-4 text-xs flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-airbnb" />
            <span className="text-slate-600 dark:text-slate-400">Airbnb</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-whatsapp" />
            <span className="text-slate-600 dark:text-slate-400">{t('whatsapp')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-purple-600" />
            <span className="text-slate-600 dark:text-slate-400">{t('gathern')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-sky-600" />
            <span className="text-slate-600 dark:text-slate-400">{t('direct_booking') as string}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Users size={14} />
          <span className="font-semibold">{visibleBookingCount}</span>
          <span>{t('active_bookings') as string}</span>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex">
          <div className="shrink-0 w-32 sm:w-44 border-l border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="h-14 flex items-center px-3 text-xs font-bold text-slate-400 border-b border-slate-200 dark:border-slate-800">
              {t('apt_name')}
            </div>
            {apartments.map((apt) => (
              <div key={apt.id} className="h-11 flex items-center px-3 border-b border-slate-100 dark:border-slate-800">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{apt.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{apt.location?.name ?? ''}</p>
                </div>
              </div>
            ))}
            {apartments.length === 0 && (
              <div className="h-20 flex items-center justify-center text-xs text-slate-400">{t('no_apartments')}</div>
            )}
          </div>

          <div className="flex-1 overflow-x-auto scrollbar-thin" ref={scrollRef} dir="ltr">
            <div style={{ minWidth: days.length * DAY_WIDTH }}>
              <div className="flex border-b border-slate-200 dark:border-slate-800">
                {days.map((d, i) => {
                  const isToday = i === todayIndex;
                  const isWeekend = d.getDay() === 5 || d.getDay() === 6;
                  return (
                    <div
                      key={i}
                      className={`shrink-0 h-14 flex flex-col items-start justify-start px-1.5 pt-1 ${
                        isToday ? 'bg-blue-50 dark:bg-blue-950/40' : isWeekend ? 'bg-slate-50 dark:bg-slate-800/50' : ''
                      }`}
                      style={{ width: DAY_WIDTH }}
                    >
                      <span className={`text-[9px] leading-none ${isToday ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400 dark:text-slate-500'}`}>
                        {d.toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                      <span className={`text-sm font-bold leading-none mt-0.5 ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`} dir="ltr">
                        {String(d.getDate()).padStart(2, '0')}/{String(d.getMonth() + 1).padStart(2, '0')}
                      </span>
                    </div>
                  );
                })}
              </div>

              {apartments.map((apt) => {
                const aptBookings = bookingsByApartment.get(apt.id) ?? [];
                const overlapping = aptBookings.filter(
                  (b) => b.check_in <= visibleEnd && b.check_out > visibleStart
                );
                return (
                  <div
                    key={apt.id}
                    className="relative border-b border-slate-100 dark:border-slate-800"
                    style={{ height: 44 }}
                  >
                    <div className="flex absolute inset-0">
                      {days.map((d, i) => {
                        const isToday = i === todayIndex;
                        const isWeekend = d.getDay() === 5 || d.getDay() === 6;
                        return (
                          <div
                            key={i}
                            className={`shrink-0 border-l border-slate-100 dark:border-slate-800 ${
                              isToday ? 'bg-blue-50/30 dark:bg-blue-950/20' : isWeekend ? 'bg-slate-50/50 dark:bg-slate-800/30' : ''
                            }`}
                            style={{ width: DAY_WIDTH }}
                          />
                        );
                      })}
                    </div>
                    {overlapping.map((booking) => (
                      <BookingBar
                        key={booking.id}
                        booking={booking}
                        days={days}
                        visibleStart={visibleStart}
                        visibleEnd={visibleEnd}
                        onClick={() => setSelectedBooking(booking)}
                      />
                    ))}
                  </div>
                );
              })}
              {apartments.length === 0 && (
                <div className="flex items-center justify-center h-32 text-sm text-slate-400">{t('no_apartments')}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedBooking && (
        <BookingDetail booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
      )}
    </div>
  );
}

function BookingBar({
  booking,
  days,
  visibleStart,
  visibleEnd,
  onClick,
}: {
  booking: Booking;
  days: Date[];
  visibleStart: string;
  visibleEnd: string;
  onClick: () => void;
}) {
  const colors = sourceColors(booking.source);
  const startsBeforeView = booking.check_in < visibleStart;
  const endsAfterView = booking.check_out > visibleEnd;

  const checkInIdx = startsBeforeView
    ? 0
    : days.findIndex((d) => dateStr(d) === booking.check_in);

  const checkOutIdx = endsAfterView
    ? days.length
    : days.findIndex((d) => dateStr(d) === booking.check_out);

  if (checkInIdx < 0 || checkOutIdx < 0) return null;

  const barStart = checkInIdx * DAY_WIDTH + (startsBeforeView ? 0 : DAY_WIDTH * CHECK_IN_RATIO);
  const barEnd = checkOutIdx * DAY_WIDTH + (endsAfterView ? 0 : DAY_WIDTH * CHECK_OUT_RATIO);

  const width = barEnd - barStart;
  if (width <= 0) return null;

  const radiusLeft = startsBeforeView ? '' : 'rounded-l-md';
  const radiusRight = endsAfterView ? '' : 'rounded-r-md';

  return (
    <button
      onClick={onClick}
      className={`absolute top-1.5 ${colors.bg} ${radiusLeft} ${radiusRight} text-white px-1.5 text-[10px] font-bold flex items-center shadow-md overflow-hidden hover:brightness-110 hover:shadow-lg transition-all cursor-pointer border-b-2 ${colors.border}`}
      style={{ left: barStart, width: Math.max(width, 3), height: 32, zIndex: 10 }}
      title={`${booking.guest_name} · ${formatDate(booking.check_in)} → ${formatDate(booking.check_out)}`}
    >
      <span className="truncate whitespace-nowrap">{booking.guest_name}</span>
    </button>
  );
}

function BookingDetail({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const { t } = useI18n();
  const colors = sourceColors(booking.source);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full space-y-4 animate-fade-in shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${colors.bg}`} />
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{booking.guest_name}</h3>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">{t('check_in')}</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300" dir="ltr">{formatDate(booking.check_in)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">{t('check_out')}</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300" dir="ltr">{formatDate(booking.check_out)}</span>
          </div>
          {booking.guest_phone && (
            <div className="flex justify-between">
              <span className="text-slate-400">{t('guest_phone')}</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300" dir="ltr">{booking.guest_phone}</span>
            </div>
          )}
          {booking.total_price != null && (
            <div className="flex justify-between">
              <span className="text-slate-400">{t('total_price')}</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{booking.total_price}</span>
            </div>
          )}
          {booking.notes && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">{t('notes')}</span>
              <p className="font-semibold text-slate-700 dark:text-slate-300 mt-1">{booking.notes}</p>
            </div>
          )}
        </div>
        <button onClick={onClose} className="btn-secondary w-full">{t('cancel')}</button>
      </div>
    </div>
  );
}
