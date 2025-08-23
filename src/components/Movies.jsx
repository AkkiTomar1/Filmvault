import React, { useEffect, useState } from 'react'
import MovieCard from './MovieCard'
import axios from 'axios'

 

const Movies = () => {
   const [movies , setMovies]=useState([ ])
 
  useEffect(()=>{

    axios.get(`https://api.themoviedb.org/3/movie/popular?api_key=386a5f00b26fb16d13fac5cf2a8f525b&language=en-US&page=2`).then((res)=>{
      setMovies(res.data.results);
      
    })
  })
  
  return (
    <div className='bg-gray-700 p-3'>
      <div className='text-xl text-center font-bold p-2.5 mb-5'>
        Trending Movies
      </div>
      <div className=' flex flex-row flex-wrap justify-around gap-7'>
       
       {movies.map((movieObj)=>{
        return <MovieCard poster_path={movieObj.poster_path} name={movieObj.original_title}/>
       })}

      </div>
    </div>
  )
}

export default Movies
//https://api.themoviedb.org/3/movie/popular?api_key=386a5f00b26fb16d13fac5cf2a8f525b&language=en-US&page=1