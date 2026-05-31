'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, MessageSquare, Check, X, Plus, Trash2, Loader2, AlertCircle, CalendarCheck, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface ViewingSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface ViewingBooking {
  id: string;
  slotId: string;
  date: string;
  message: string | null;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
  tenant?: {
    name: string | null;
    email: string | null;
  };
  slot: {
    startTime: string;
    endTime: string;
  };
}

interface ViewingSchedulerProps {
  listingId: string;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ViewingScheduler({ listingId }: ViewingSchedulerProps) {
  const [isOwner, setIsOwner] = useState(false);
  const [slots, setSlots] = useState<ViewingSlot[]>([]);
  const [bookings, setBookings] = useState<ViewingBooking[]>([]);
  const [loading, setLoading] = useState(true);

  // Landlord form states
  const [newDay, setNewDay] = useState(1); // Monday
  const [newStart, setNewStart] = useState('10:00');
  const [newEnd, setNewEnd] = useState('12:00');
  const [addingSlot, setAddingSlot] = useState(false);

  // Tenant booking form states
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [tenantMessage, setTenantMessage] = useState('');
  const [bookingSlot, setBookingSlot] = useState(false);

  // Fetch slots & bookings
  const loadSchedule = useCallback(async () => {
    try {
      const res = await fetch(`/api/listings/${listingId}/viewings`);
      if (!res.ok) throw new Error('Failed to load schedule');
      const data = await res.json();
      setIsOwner(data.isOwner);
      setSlots(data.slots || []);
      setBookings(data.bookings || []);
    } catch (err) {
      console.error(err);
      toast.error('Could not load scheduler information.');
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  // Landlord: Add viewing slot
  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingSlot(true);
    try {
      const res = await fetch(`/api/listings/${listingId}/viewings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_slot',
          dayOfWeek: newDay,
          startTime: newStart,
          endTime: newEnd,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add slot');

      toast.success('Viewing slot added successfully!');
      setSlots([...slots, data.slot].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime)));
    } catch (err: any) {
      toast.error(err.message || 'Could not add slot.');
    } finally {
      setAddingSlot(false);
    }
  };

  // Landlord: Delete slot
  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm('Are you sure you want to delete this available slot?')) return;
    try {
      const res = await fetch(`/api/listings/${listingId}/viewings`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete slot');

      toast.success('Slot deleted.');
      setSlots(slots.filter((s) => s.id !== slotId));
    } catch (err: any) {
      toast.error(err.message || 'Could not delete slot.');
    }
  };

  // Landlord/Tenant: Update booking status
  const handleUpdateBookingStatus = async (bookingId: string, status: 'CONFIRMED' | 'CANCELLED') => {
    try {
      const res = await fetch(`/api/listings/${listingId}/viewings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, status }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update booking');

      toast.success(`Booking status updated to ${status.toLowerCase()}!`);
      setBookings(bookings.map((b) => (b.id === bookingId ? { ...b, status } : b)));
    } catch (err: any) {
      toast.error(err.message || 'Could not update booking status.');
    }
  };

  // Tenant: Submit viewing request
  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedSlotId) {
      toast.error('Please pick a date and a time slot.');
      return;
    }

    setBookingSlot(true);
    try {
      const res = await fetch(`/api/listings/${listingId}/viewings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'book_slot',
          slotId: selectedSlotId,
          date: selectedDate,
          message: tenantMessage,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to book slot');

      toast.success('Viewing appointment requested successfully!');
      setSelectedDate('');
      setSelectedSlotId('');
      setTenantMessage('');
      loadSchedule();
    } catch (err: any) {
      toast.error(err.message || 'Could not request viewing appointment.');
    } finally {
      setBookingSlot(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col items-center justify-center space-y-3 animate-pulse min-h-[250px]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="text-xs text-slate-400 font-bold">Loading scheduler...</span>
      </div>
    );
  }

  // Get weekday of selected date to filter slots for tenant
  const getSelectedDayOfWeek = () => {
    if (!selectedDate) return -1;
    return new Date(selectedDate).getDay();
  };

  const activeDayOfWeek = getSelectedDayOfWeek();
  const availableSlotsForSelectedDate = slots.filter((s) => s.dayOfWeek === activeDayOfWeek);

  const getStatusBadge = (status: 'PENDING' | 'CONFIRMED' | 'CANCELLED') => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border border-emerald-100 flex items-center gap-1"><Check className="w-3 h-3" /> Confirmed</span>;
      case 'CANCELLED':
        return <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border border-rose-100 flex items-center gap-1"><X className="w-3 h-3" /> Cancelled</span>;
      default:
        return <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border border-amber-100 flex items-center gap-1"><Clock className="w-3 h-3" /> Pending Approval</span>;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
        <div className="p-2.5 bg-indigo-50 rounded-xl">
          <Calendar className="w-5 h-5 text-indigo-650" />
        </div>
        <div>
          <h3 className="font-extrabold text-slate-800 text-base">Viewing Appointment Scheduler</h3>
          <p className="text-xs text-slate-400 font-medium">Coordinate site visits and slots</p>
        </div>
      </div>

      {isOwner ? (
        /* OWNER / LANDLORD INTERFACE */
        <div className="space-y-6">
          {/* Create new slot form */}
          <form onSubmit={handleAddSlot} className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Add Availability Slot</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Day of Week</label>
                <select
                  value={newDay}
                  onChange={(e) => setNewDay(parseInt(e.target.value))}
                  className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-lg outline-hidden font-medium"
                >
                  {DAYS_OF_WEEK.map((day, idx) => (
                    <option key={idx} value={idx}>{day}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Start Time</label>
                <input
                  type="time"
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-lg outline-hidden font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">End Time</label>
                <input
                  type="time"
                  value={newEnd}
                  onChange={(e) => setNewEnd(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-lg outline-hidden font-semibold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={addingSlot}
              className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer select-none"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Slot</span>
            </button>
          </form>

          {/* Slots list */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Your Availability Slots ({slots.length})</h4>
            {slots.length === 0 ? (
              <p className="text-xs text-slate-450 italic">No availability slots set. Add slot(s) above so tenants can book viewings.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center gap-2 bg-indigo-50/50 border border-indigo-100 rounded-lg px-3 py-1.5 text-xs text-indigo-950 font-semibold"
                  >
                    <span>{DAYS_OF_WEEK[slot.dayOfWeek]}: {slot.startTime} - {slot.endTime}</span>
                    <button
                      onClick={() => handleDeleteSlot(slot.id)}
                      className="text-slate-400 hover:text-rose-600 transition"
                      title="Remove Slot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bookings Queue */}
          <div className="space-y-3 border-t border-slate-50 pt-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Requested Visits ({bookings.length})</h4>
            {bookings.length === 0 ? (
              <p className="text-xs text-slate-450 bg-slate-50 p-6 rounded-xl border text-center font-medium">No viewing booking requests received yet.</p>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs font-medium"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(booking.status)}
                        <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">{new Date(booking.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>

                      <div className="space-y-0.5">
                        <p className="font-extrabold text-slate-800 text-sm">Tenant: {booking.tenant?.name || 'Anonymous'}</p>
                        <p className="text-slate-450 text-xs">Email: {booking.tenant?.email || 'N/A'}</p>
                        <p className="text-indigo-700 text-xs font-bold flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          <span>Slot: {booking.slot.startTime} - {booking.slot.endTime}</span>
                        </p>
                      </div>

                      {booking.message && (
                        <p className="text-[11px] text-slate-500 italic bg-white border border-slate-100 rounded-lg p-2 flex items-start gap-1">
                          <MessageSquare className="w-3 h-3 mt-0.5 text-slate-400" />
                          <span>"{booking.message}"</span>
                        </p>
                      )}
                    </div>

                    {booking.status === 'PENDING' && (
                      <div className="flex gap-2 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => handleUpdateBookingStatus(booking.id, 'CONFIRMED')}
                          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg transition text-[11px]"
                        >
                          <Check className="w-3 h-3" /> Confirm
                        </button>
                        <button
                          onClick={() => handleUpdateBookingStatus(booking.id, 'CANCELLED')}
                          className="flex items-center gap-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold px-3 py-1.5 rounded-lg transition text-[11px]"
                        >
                          <X className="w-3 h-3 text-rose-500" /> Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* TENANT / VISITOR INTERFACE */
        <div className="space-y-6">
          <form onSubmit={handleBookAppointment} className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Book a Site Visit</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Choose Visit Date</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedSlotId('');
                  }}
                  className="w-full bg-white border border-slate-200 text-xs px-3.5 py-2 rounded-lg outline-hidden font-bold cursor-pointer"
                />
              </div>

              {selectedDate && (
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Select Time Slot</label>
                  {availableSlotsForSelectedDate.length === 0 ? (
                    <div className="text-xs text-rose-600 bg-rose-50/50 border border-rose-100 rounded-lg p-2 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Owner is not available on {DAYS_OF_WEEK[activeDayOfWeek]}s.</span>
                    </div>
                  ) : (
                    <select
                      value={selectedSlotId}
                      onChange={(e) => setSelectedSlotId(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-lg outline-hidden font-medium"
                    >
                      <option value="">-- Choose Slot --</option>
                      {availableSlotsForSelectedDate.map((slot) => (
                        <option key={slot.id} value={slot.id}>{slot.startTime} - {slot.endTime}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Message to Landlord (Optional)</label>
              <textarea
                value={tenantMessage}
                onChange={(e) => setTenantMessage(e.target.value)}
                placeholder="e.g. I would like to visit the property to see rooms and amenities."
                className="w-full bg-white border border-slate-200 text-xs px-3.5 py-2.5 rounded-lg outline-hidden resize-none h-16 font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={bookingSlot || !selectedDate || !selectedSlotId}
              className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs py-3 rounded-xl transition shadow-md cursor-pointer select-none disabled:opacity-50"
            >
              {bookingSlot ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Requesting visit...</span>
                </>
              ) : (
                <>
                  <CalendarCheck className="w-4 h-4" />
                  <span>Book Viewing Appointment</span>
                </>
              )}
            </button>
          </form>

          {/* Own bookings list */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Your Booked Viewings ({bookings.length})</h4>
            {bookings.length === 0 ? (
              <p className="text-xs text-slate-450 italic">You haven't requested any viewing appointments yet.</p>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex justify-between items-center text-xs font-medium"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(booking.status)}
                        <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">{new Date(booking.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-750 font-bold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Visit Time: {booking.slot.startTime} - {booking.slot.endTime}</span>
                      </p>
                      {booking.message && (
                        <p className="text-[10px] text-slate-450 leading-relaxed italic">
                          Message: "{booking.message}"
                        </p>
                      )}
                    </div>

                    {booking.status === 'PENDING' && (
                      <button
                        onClick={() => handleUpdateBookingStatus(booking.id, 'CANCELLED')}
                        className="text-slate-400 hover:text-rose-600 transition font-bold"
                        title="Cancel Appointment"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
