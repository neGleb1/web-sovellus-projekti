import React, { useEffect, useState } from 'react';
import axios from 'axios';
import xml2js from 'xml2js';

import MovieCard from './MovieCard.jsx';
import SearchBar from './SearchBar.jsx';
import { useSearch } from '../context/SearchContext.jsx';
import { useNotification } from '../context/NotificationContext';

export default function MovieList({ selectedDate }) {
    const [movies, setMovies] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    const { searchTerm } = useSearch();
    const { showNotification } = useNotification();

    const filteredMovies = movies?.filter((movie) =>
        movie.title && movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movie.theater && movie.theater.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movie.lengthInMinutes && movie.lengthInMinutes.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        const fetchMovies = async () => {
            if (!selectedDate) return;

            try {
                setIsLoading(true);
                const response = await axios.get(`https://www.finnkino.fi/xml/Schedule/?dt=${selectedDate}`);
                const parser = new xml2js.Parser({ explicitArray: false });

                const result = await parser.parseStringPromise(response.data);

                let shows = result.Schedule.Shows.Show;

                if (!Array.isArray(shows)) {
                    shows = [shows];
                }

                const uniqueShows = Array.from(
                    new Map(shows.map((show) => [show.EventID, show])).values()
                );

                const parsedMovies = uniqueShows.map((show) => ({
                    title: show.Title,
                    eventID: show.EventID,
                    theater: show.Theatre,
                    showStart: new Date(show.dttmShowStart).toLocaleString('fi-FI', { timeZone: 'UTC' }),
                    lengthInMinutes: show.LengthInMinutes,
                    imageUrl: show.Images.EventSmallImagePortrait,
                }));

                setMovies(parsedMovies);
            } catch (error) {
                console.error('Error fetching movies:', error);
                setIsError(true);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMovies();
    }, [selectedDate]);

    if (isLoading) return <div>Loading movies...</div>;
    if (isError) return <div>Error fetching movies.</div>;

    return (
        <>
            <SearchBar/>
            <div className='movie-list'>
                {filteredMovies?.map((movie, index) => (
                    <MovieCard key={index} movie={movie} />
                ))}
            </div>
        </>
    );
}