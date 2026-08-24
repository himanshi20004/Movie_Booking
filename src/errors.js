class ShowNotFoundError extends Error {
  constructor(showId) {
    super(`Show not found: ${showId}`);
    this.name = 'ShowNotFoundError';
  }
}

class SeatNotFoundError extends Error {
  constructor(seatId) {
    super(`Seat not found: ${seatId}`);
    this.name = 'SeatNotFoundError';
  }
}

// Thrown when one or more requested seats are already BOOKED (or don't
// belong to the requested show). Nothing is booked if this is thrown.
class SeatNotAvailableError extends Error {
  constructor(seatIds) {
    super(`Seat(s) not available: ${seatIds.join(', ')}`);
    this.name = 'SeatNotAvailableError';
    this.seatIds = seatIds;
  }
}

class BookingNotFoundError extends Error {
  constructor(bookingId) {
    super(`Booking not found: ${bookingId}`);
    this.name = 'BookingNotFoundError';
  }
}

class BookingAlreadyCancelledError extends Error {
  constructor(bookingId) {
    super(`Booking already cancelled: ${bookingId}`);
    this.name = 'BookingAlreadyCancelledError';
  }
}

module.exports = {
  ShowNotFoundError,
  SeatNotFoundError,
  SeatNotAvailableError,
  BookingNotFoundError,
  BookingAlreadyCancelledError,
};
