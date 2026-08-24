const store = require('../store/inMemoryStore');
const { SeatStatus, BookingStatus, createBooking } = require('../models');
const {
  ShowNotFoundError,
  SeatNotFoundError,
  SeatNotAvailableError,
  BookingNotFoundError,
  BookingAlreadyCancelledError,
} = require('../errors');

let bookingSeq = 0;
function nextBookingId() {
  bookingSeq += 1;
  return `booking_${bookingSeq}`;
}

/**
 * Books one or more seats for a show:
 *  1. validate the show and seats exist
 *  2. reject if ANY requested seat is already booked (all-or-nothing — no partial booking)
 *  3. mark seats BOOKED immediately (so no one else can grab them)
 *
 * @param {{ userId: string, showId: string, seatIds: string[] }} input
 * @returns {object} the created booking
 */
function bookSeats({ userId, showId, seatIds }) {
  if (!Array.isArray(seatIds) || seatIds.length === 0) {
    throw new Error('seatIds must be a non-empty array');
  }

  const show = store.shows.get(showId);
  if (!show) {
    throw new ShowNotFoundError(showId);
  }

  const requestedSeats = seatIds.map((seatId) => {
    const seat = store.seats.get(seatId);
    if (!seat || seat.showId !== showId) {
      throw new SeatNotFoundError(seatId);
    }
    return seat;
  });

  // Don't book unavailable seats — and don't book any seat at all if even
  // one of the requested seats is already taken.
  const unavailable = requestedSeats
    .filter((seat) => seat.status !== SeatStatus.AVAILABLE)
    .map((seat) => seat.id);
  if (unavailable.length > 0) {
    throw new SeatNotAvailableError(unavailable);
  }

  const amount = requestedSeats.reduce((sum, seat) => sum + seat.price, 0);
  const booking = createBooking({ id: nextBookingId(), showId, userId, seatIds, amount });
  booking.createdAt = Date.now();
  booking.status = BookingStatus.CONFIRMED;

  // Mark seats booked immediately so no one else can grab them.
  requestedSeats.forEach((seat) => {
    seat.status = SeatStatus.BOOKED;
    seat.bookingId = booking.id;
  });

  store.bookings.set(booking.id, booking);

  return booking;
}

/**
 * Cancels a booking: frees its seats (AVAILABLE again).
 * Cancelling a booking that doesn't exist, or is already cancelled, is an error.
 *
 * @param {string} bookingId
 * @returns {object} the cancelled booking
 */
function cancelBooking(bookingId) {
  const booking = store.bookings.get(bookingId);
  if (!booking) {
    throw new BookingNotFoundError(bookingId);
  }
  if (booking.status === BookingStatus.CANCELLED) {
    throw new BookingAlreadyCancelledError(bookingId);
  }

  booking.seatIds.forEach((seatId) => {
    const seat = store.seats.get(seatId);
    if (seat) {
      seat.status = SeatStatus.AVAILABLE;
      seat.bookingId = null;
    }
  });

  booking.status = BookingStatus.CANCELLED;
  booking.cancelledAt = Date.now();

  return booking;
}

module.exports = { bookSeats, cancelBooking };
