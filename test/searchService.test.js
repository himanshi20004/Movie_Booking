const test = require('node:test');
const assert = require('node:assert/strict');

const store = require('../src/store/inMemoryStore');
const { createMovie, createTheatre, createShow, createSeat } = require('../src/models');
const searchService = require('../src/services/searchService');

function seedCatalog() {
  store.reset();

  const movie = createMovie({
    id: 'movie_1',
    name: 'Interstellar',
    durationMins: 169,
    language: 'English',
    format: '2D',
    cost: 200,
  });
  store.movies.set(movie.id, movie);

  const theatreInCity = createTheatre({
    id: 'theatre_1',
    name: 'PVR',
    city: 'Bangalore',
    locality: 'Koramangala',
  });
  const theatreInOtherCity = createTheatre({
    id: 'theatre_2',
    name: 'INOX',
    city: 'Mumbai',
    locality: 'Andheri',
  });
  store.theatres.set(theatreInCity.id, theatreInCity);
  store.theatres.set(theatreInOtherCity.id, theatreInOtherCity);

  const show2D = createShow({
    id: 'show_2d',
    movieId: movie.id,
    theatreId: theatreInCity.id,
    language: 'English',
    format: '2D',
    startTime: '2026-08-24T18:00:00',
  });
  const show3D = createShow({
    id: 'show_3d',
    movieId: movie.id,
    theatreId: theatreInCity.id,
    language: 'Hindi',
    format: '3D',
    startTime: '2026-08-24T21:00:00',
  });
  const showOtherCity = createShow({
    id: 'show_other_city',
    movieId: movie.id,
    theatreId: theatreInOtherCity.id,
    language: 'English',
    format: '2D',
    startTime: '2026-08-24T18:00:00',
  });
  store.shows.set(show2D.id, show2D);
  store.shows.set(show3D.id, show3D);
  store.shows.set(showOtherCity.id, showOtherCity);

  const availableSeat = createSeat({ id: 'seat_1', showId: show2D.id, row: 'A', column: 1, price: 200 });
  const bookedSeat = createSeat({ id: 'seat_2', showId: show2D.id, row: 'A', column: 2, price: 200 });
  bookedSeat.status = 'BOOKED';
  bookedSeat.bookingId = 'booking_1';
  store.seats.set(availableSeat.id, availableSeat);
  store.seats.set(bookedSeat.id, bookedSeat);
}

test.beforeEach(() => {
  seedCatalog();
});

test('lists movies by city, grouped by theatre, only for theatres in that city', () => {
  const results = searchService.listMoviesByCity('Bangalore');

  assert.equal(results.length, 1);
  assert.equal(results[0].theatre.id, 'theatre_1');

  const movieNames = results[0].shows.map((entry) => entry.movie.name);
  assert.deepEqual(movieNames, ['Interstellar', 'Interstellar']);
});

test('narrows results by locality, language and format (2D/3D)', () => {
  const byLocality = searchService.listMoviesByCity('Bangalore', { locality: 'Koramangala' });
  assert.equal(byLocality.length, 1);

  const noSuchLocality = searchService.listMoviesByCity('Bangalore', { locality: 'Whitefield' });
  assert.equal(noSuchLocality.length, 0);

  const hindi3D = searchService.listMoviesByCity('Bangalore', { language: 'Hindi', format: '3D' });
  assert.equal(hindi3D[0].shows.length, 1);
  assert.equal(hindi3D[0].shows[0].show.id, 'show_3d');
});

test('returns only available seats for a show', () => {
  const availableSeats = searchService.getAvailableSeats('show_2d');

  assert.equal(availableSeats.length, 1);
  assert.equal(availableSeats[0].id, 'seat_1');
});
