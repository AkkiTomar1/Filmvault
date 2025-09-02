import React, { useEffect, useState } from 'react'
import MovieCard from './MovieCard'
import axios from 'axios'
import Pagination from './Pagination'

const Movies = ({handleAddtoWatchList,handleRemoveFromWatchList,watchlist}) => {
  const [movies, setMovies] = useState([])
  const [pageNo, setPageNo]=useState(1);

    const handlePrev = () => {
    if (pageNo==1) {
      setPageNo(1);
    }else{
    setPageNo(pageNo-1);
    }
  };

  const handleNext = () => {
    setPageNo(pageNo + 1);
  };

  useEffect(() => {
    axios
      .get(
        `https://api.themoviedb.org/3/movie/popular?api_key=386a5f00b26fb16d13fac5cf2a8f525b&language=en-US&page=${pageNo}`
      )
      .then((res) => {
        setMovies(res.data.results)
      })
  }, [pageNo]) 



  return (
    <div className='p-3'>
      <div className='text-xl text-center font-bold p-2.5'>
        Trending Movies
      </div>
      <div className='flex flex-row flex-wrap justify-around'>
        {movies.map((movieObj) => (
          <MovieCard
            key={movieObj.id}
            movieObj={movieObj}
            poster_path={movieObj.poster_path}
            name={movieObj.title}
            handleAddtoWatchList={handleAddtoWatchList}
            handleRemoveFromWatchList={handleRemoveFromWatchList} 
            watchlist={watchlist}// ✅ pass function
          />
        ))}

      </div>
      <Pagination pageNo={pageNo} handleNext={handleNext} handlePrev={handlePrev}/>
    </div>
  )
}

export default Movies
