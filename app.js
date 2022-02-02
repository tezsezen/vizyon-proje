const path = require("path")
const express = require("express");
const helmet = require("helmet");
const callApi = require("./apiCaller")
require("dotenv").config()

const KEY = process.env.API_KEY
const PORT = process.env.PORT || 3000
const app = express();

const apiBaseUrl = 'http://api.themoviedb.org/3';
const imageBaseUrl = "http://image.tmdb.org/t/p";

app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))

app.use(
    helmet.contentSecurityPolicy({
      useDefaults: true,
      directives: {
        "img-src": ["'self'", "https: data:"]
      }
    }),
    helmet.crossOriginResourcePolicy({
        policy: "cross-origin"
    })
)

app.use(async (req, res, next) => {
    const movieGenresUrl = `${apiBaseUrl}/genre/movie/list?api_key=${KEY}`;
    const tvGenresUrl = `${apiBaseUrl}/genre/tv/list?api_key=${KEY}`;

    const movieGenres = await callApi(movieGenresUrl).then(res => res.genres)
    const tvGenres = await callApi(tvGenresUrl).then(res => res.genres)

    res.locals.movieGenres = movieGenres
    res.locals.tvGenres = tvGenres
    res.locals.imageBaseUrl = imageBaseUrl

    next()
})

app.use(express.json())
app.use(express.urlencoded())

app.get('/', async(req, res) => {  
    const nowPlayingUrl = `${apiBaseUrl}/movie/now_playing?api_key=${KEY}`;
    const trendingUrl = `${apiBaseUrl}/trending/movie/week?api_key=${KEY}`;
    const topRatedUrl = `${apiBaseUrl}/movie/top_rated?page=1&api_key=${KEY}`;

    const nowPlaying = await callApi(nowPlayingUrl).then(res => res.results)
    const trending = await callApi(trendingUrl).then(res => res.results)
    const topRated = await callApi(topRatedUrl).then(res => res.results)

    res.render("pages/movies.ejs", {nowPlaying, trending, topRated})
})

app.get("/movie/:id", async(req, res) => {
    const url = `${apiBaseUrl}/movie/${req.params.id}?api_key=${KEY}&append_to_response=credits,recommendations`
    const movie = await callApi(url)

    res.render("pages/movie-details.ejs",{movie})
})

app.get("/tvshows", async(req, res) => {   
    const airingTodayUrl = `${apiBaseUrl}/tv/airing_today?api_key=${KEY}`;
    const popularUrl = `${apiBaseUrl}/tv/popular?api_key=${KEY}`;
    const topRatedUrl = `${apiBaseUrl}/tv/top_rated?page=1&api_key=${KEY}`;

    const airsToday = await callApi(airingTodayUrl).then(res => res.results)
    const popular = await callApi(popularUrl).then(res => res.results)
    const topRated = await callApi(topRatedUrl).then(res => res.results)

    res.render("pages/shows.ejs", {airsToday, popular, topRated})
})

app.get("/tv/:id", async(req, res) => {
    const url = `${apiBaseUrl}/tv/${req.params.id}?api_key=${KEY}&append_to_response=credits,recommendations`
    const show = await callApi(url)

    res.render("pages/show-details.ejs", {show})
})

app.get("/people", async(req, res) => {
    const peopleUrl = `${apiBaseUrl}/person/popular?api_key=${KEY}`;
    const people = await callApi(peopleUrl).then(res => res.results)

    res.render("pages/people.ejs", {people})
})

app.get("/person/:id", async(req, res) => {
    const personUrl = `${apiBaseUrl}/person/${req.params.id}?api_key=${KEY}&append_to_response=combined_credits`;
    const person = await callApi(personUrl)
    
    res.render("pages/person-details.ejs", {person})
})

app.get("/search", async(req, res) => {
    let url = `${apiBaseUrl}/search/`;
    let keyword = req.query.keyword.trim()

    if(!keyword) res.redirect("/")

    switch(req.query.type){
        case "Movie":
            url += "movie"
            break;
        
        case "Tv Show":
            url += "tv"
            break;

        case "Person":
            url += "person"
            break;

        default:
            res.send("search type doesn't exist.")
    }

    url += `?api_key=${KEY}&query=${encodeURIComponent(keyword)}`
    
    const results = await callApi(url).then(res => res.results)

    res.render("pages/search.ejs", { results , type :  req.query.type})
})

app.listen(PORT)