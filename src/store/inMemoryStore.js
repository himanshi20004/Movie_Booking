// In-memory storage. Plain Maps keyed by id — no external DB.
// `reset()` is used by tests to start each test with a clean slate.

let movies = new Map();
let theatres = new Map();
let shows = new Map();
let seats = new Map();
let users = new Map();
let bookings = new Map();

function reset() {
  movies = new Map();
  theatres = new Map();
  shows = new Map();
  seats = new Map();
  users = new Map();
  bookings = new Map();
}

// Getters (not plain property references) so that `reset()` reassigning the
// underlying Maps is actually visible to anything holding this module.
module.exports = {
  get movies() {
    return movies;
  },
  get theatres() {
    return theatres;
  },
  get shows() {
    return shows;
  },
  get seats() {
    return seats;
  },
  get users() {
    return users;
  },
  get bookings() {
    return bookings;
  },
  reset,
};
