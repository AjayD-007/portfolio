const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const API_KEY = '7184ef56';
const args = process.argv.slice(2);
const titleArg = args.join(' ');

if (!titleArg) {
  console.error("Please provide a movie title. Example: node scripts/add-movie.js 'Inception'");
  process.exit(1);
}

async function addMovie(title) {
  try {
    const response = await fetch(`http://www.omdbapi.com/?apikey=${API_KEY}&t=${encodeURIComponent(title)}`);
    const data = await response.json();

    if (data.Response === 'False') {
      console.error(`Error: ${data.Error}`);
      process.exit(1);
    }

    const newMovie = {
      title: data.Title,
      director: data.Director !== 'N/A' ? data.Director : data.Writer || 'Unknown',
      type: data.Type, // movie, series, episode
      genre: data.Genre,
      rating: data.imdbRating,
      review: "Watched recently.",
      coverImageUrl: data.Poster !== 'N/A' ? data.Poster : '',
      externalLink: `https://www.imdb.com/title/${data.imdbID}/`,
      dateCompleted: new Date().toISOString().split('T')[0]
    };

    const filePath = path.join(__dirname, '../src/data/movies.json');
    let movies = [];
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, 'utf8');
      if (fileData) {
        movies = JSON.parse(fileData);
      }
    }

    movies.push(newMovie);
    fs.writeFileSync(filePath, JSON.stringify(movies, null, 2), 'utf8');

    console.log(`Successfully added "${newMovie.title}" to src/data/movies.json!`);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

addMovie(titleArg);
