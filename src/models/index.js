// Data models. Plain factory functions instead of classes — keeps them cheap
// to create and easy to serialize for an in-memory store.

const SeatStatus = Object.freeze({
  AVAILABLE: 'AVAILABLE',
  BOOKED: 'BOOKED',
});

const BookingStatus = Object.freeze({
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
});

function createMovie({ id, name, durationMins, language, format, cost }) {
  return { id, name, durationMins, language, format, cost };
}

function createTheatre({ id, name, city, locality }) {
  return { id, name, city, locality };
}

// A single screening: one movie, at one theatre, in one language/format, at one time.
// Seats are scoped to a Show, not to a (movie, theatre) pair, so the same movie
// can run multiple times a day in the same theatre with independent seat maps.
function createShow({ id, movieId, theatreId, language, format, startTime }) {
  return { id, movieId, theatreId, language, format, startTime };
}

function createSeat({ id, showId, row, column, price }) {
  return {
    id,
    showId,
    row,
    column,
    price,
    status: SeatStatus.AVAILABLE,
    bookingId: null, // set when BOOKED, cleared when the booking is cancelled
  };
}

function createUser({ id, name }) {
  return { id, name };
}

function createBooking({ id, showId, userId, seatIds, amount }) {
  return {
    id,
    showId,
    userId,
    seatIds,
    amount,
    status: BookingStatus.CONFIRMED,
    createdAt: null,
    cancelledAt: null,
  };
}

module.exports = {
  SeatStatus,
  BookingStatus,
  createMovie,
  createTheatre,
  createShow,
  createSeat,
  createUser,
  createBooking,
};
