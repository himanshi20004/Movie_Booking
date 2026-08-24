const test = require('node:test');
const assert = require('node:assert/strict');

const store = require('../src/store/inMemoryStore');
const { SeatStatus, BookingStatus, createShow, createSeat, createUser } = require('../src/models');
const bookingService = require('../src/services/bookingService');
const {
  SeatNotAvailableError,
  BookingNotFoundError,
  BookingAlreadyCancelledError,
} = require('../src/errors');

// Fresh in-memory store + a show with 3 seats before every test.
function seedShow() {
  store.reset();

  const show = createShow({
    id: 'show_1',
    movieId: 'movie_1',
    theatreId: 'theatre_1',
    language: 'English',
    format: '2D',
    startTime: '2026-08-24T18:00:00',
  });
  store.shows.set(show.id, show);

  ['seat_A1', 'seat_A2', 'seat_A3'].forEach((id, i) => {
    const seat = createSeat({ id, showId: show.id, row: 'A', column: i + 1, price: 200 });
    store.seats.set(seat.id, seat);
  });

  const user = createUser({ id: 'user_1', name: 'Alice' });
  store.users.set(user.id, user);

  return { show, user };
}

test.beforeEach(() => {
  seedShow();
});

test('happy flow: booking available seats confirms booking and marks seats booked', () => {
  const booking = bookingService.bookSeats({
    userId: 'user_1',
    showId: 'show_1',
    seatIds: ['seat_A1', 'seat_A2'],
  });

  assert.equal(booking.status, BookingStatus.CONFIRMED);
  assert.equal(booking.amount, 400);

  assert.equal(store.seats.get('seat_A1').status, SeatStatus.BOOKED);
  assert.equal(store.seats.get('seat_A1').bookingId, booking.id);
  assert.equal(store.seats.get('seat_A2').status, SeatStatus.BOOKED);

  // Seat not part of this booking stays available.
  assert.equal(store.seats.get('seat_A3').status, SeatStatus.AVAILABLE);
});

test('edge case: booking a seat that is already booked fails and books nothing', () => {
  bookingService.bookSeats({ userId: 'user_1', showId: 'show_1', seatIds: ['seat_A1'] });

  assert.throws(
    () =>
      bookingService.bookSeats({
        userId: 'user_2',
        showId: 'show_1',
        seatIds: ['seat_A1', 'seat_A2'],
      }),
    SeatNotAvailableError,
  );

  // seat_A2 must NOT have been booked either — all-or-nothing.
  assert.equal(store.seats.get('seat_A2').status, SeatStatus.AVAILABLE);
});

test('cancellation: cancelling a booked seat frees it up again', () => {
  const booking = bookingService.bookSeats({
    userId: 'user_1',
    showId: 'show_1',
    seatIds: ['seat_A1'],
  });

  const cancelled = bookingService.cancelBooking(booking.id);

  assert.equal(cancelled.status, BookingStatus.CANCELLED);
  assert.equal(store.seats.get('seat_A1').status, SeatStatus.AVAILABLE);
  assert.equal(store.seats.get('seat_A1').bookingId, null);

  // Freed seat can be booked again by someone else.
  const rebooking = bookingService.bookSeats({
    userId: 'user_2',
    showId: 'show_1',
    seatIds: ['seat_A1'],
  });
  assert.equal(rebooking.status, BookingStatus.CONFIRMED);
});

test('edge case: cancelling a booking that does not exist throws', () => {
  assert.throws(() => bookingService.cancelBooking('does_not_exist'), BookingNotFoundError);
});

test('edge case: cancelling an already-cancelled booking throws', () => {
  const booking = bookingService.bookSeats({
    userId: 'user_1',
    showId: 'show_1',
    seatIds: ['seat_A1'],
  });
  bookingService.cancelBooking(booking.id);

  assert.throws(() => bookingService.cancelBooking(booking.id), BookingAlreadyCancelledError);
});
