const store = require('../store/inMemoryStore');
const { SeatStatus } = require('../models');

// Theatres in a city, optionally narrowed to one locality.
function findTheatresByCity(city, locality) {
  return [...store.theatres.values()].filter(
    (theatre) => theatre.city === city && (!locality || theatre.locality === locality),
  );
}

// Shows running at a theatre, optionally filtered by language/format (2D/3D).
function findShowsByTheatre(theatreId, { language, format } = {}) {
  return [...store.shows.values()].filter(
    (show) =>
      show.theatreId === theatreId &&
      (!language || show.language === language) &&
      (!format || show.format === format),
  );
}

/**
 * Lists movies for a city -> locality -> theatre, each show carrying its
 * language and format (2D/3D), matching the required search flow.
 *
 * @param {string} city
 * @param {{ locality?: string, language?: string, format?: string }} [filters]
 * @returns {Array<{ theatre: object, shows: Array<{ show: object, movie: object }> }>}
 */
function listMoviesByCity(city, { locality, language, format } = {}) {
  return findTheatresByCity(city, locality).map((theatre) => ({
    theatre,
    shows: findShowsByTheatre(theatre.id, { language, format }).map((show) => ({
      show,
      movie: store.movies.get(show.movieId),
    })),
  }));
}

// Seat availability for a show — the step right after picking a show from search results.
function getAvailableSeats(showId) {
  return [...store.seats.values()].filter(
    (seat) => seat.showId === showId && seat.status === SeatStatus.AVAILABLE,
  );
}

module.exports = { findTheatresByCity, findShowsByTheatre, listMoviesByCity, getAvailableSeats };
