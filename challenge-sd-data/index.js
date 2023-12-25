const fs = require('fs');

// Read data from JSON files
const users = JSON.parse(fs.readFileSync('user_data.json', 'utf-8'));
const relatedUsers = JSON.parse(fs.readFileSync('related_users.json', 'utf-8'));
const movies = JSON.parse(fs.readFileSync('movie_data.json', 'utf-8'));
const userPreferences = JSON.parse(fs.readFileSync('user_preference.json', 'utf-8'));

// Function to calculate Gaussian decay
function calculateGaussianDecay(movieReleaseDate) {
  const timeDelta = new Date() - new Date(movieReleaseDate);
  const decayFactor = Math.exp(-(timeDelta / (365 * 24 * 60 * 60 * 1000))); // Assuming timeDelta in milliseconds
  return decayFactor;
}

// Function to calculate user's preference towards the movie based on genres
function calculateGenrePreference(movieGenres, userId) {
  const userPreference = userPreferences.find(preference => preference.user_id === userId);
  let genreScore = 0;

  movieGenres.forEach(movieGenre => {
    const genrePreference = userPreference.preference.find(p => p.genre === movieGenre);
    if (genrePreference) {
      genreScore += genrePreference.preference_score;
    }
  });

  return genreScore;
}

// Function to calculate average preference towards the movie by related users
function calculateAverageRelatedUserPreference(movieGenres, relatedUsersList) {
  let totalRelatedScore = 0;
  let totalRelatedUsers = 0;

  relatedUsersList.forEach(relatedUser => {
    const relatedUserPreference = userPreferences.find(preference => preference.user_id === relatedUser.user_id);

    if (relatedUserPreference && relatedUserPreference.preference) {
      movieGenres.forEach(movieGenre => {
        const genrePreference = relatedUserPreference.preference.find(p => p.genre === movieGenre);
        if (genrePreference) {
          totalRelatedScore += genrePreference.preference_score;
          totalRelatedUsers += 1;
        }
      });
    }
  });

  return totalRelatedUsers === 0 ? 0 : totalRelatedScore / totalRelatedUsers;
}

// Function to generate personalized feed for the user
function getPersonalizedFeed(userId) {
  const user = users.find(user => user.user_id === userId);
  const userRelated = relatedUsers[userId];

  // Generate personalized feed for each movie
  const personalizedFeed = movies.map(movie => {
    const decayFactor = calculateGaussianDecay(movie.release_date);
    const genreScore = calculateGenrePreference(movie.genres, userId);
    const relatedUserScore = calculateAverageRelatedUserPreference(movie.genres, userRelated);

    // Overall relevance score
    const relevanceScore = decayFactor * (0.6 * genreScore + 0.4 * relatedUserScore);

    return { ...movie, relevanceScore };
  });

  // Sort the personalized feed by relevance score in descending order
  personalizedFeed.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Return the top 10 movies
  return personalizedFeed.slice(0, 10);
}

// Example usage:
const userId = 115; // Replace with the desired user ID
const feed = getPersonalizedFeed(userId);
console.log(feed);
