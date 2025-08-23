import React from 'react'
const MovieCard=({poster_path, name})=>{
    return(
        <div className='relative h-[48vh] w-[189px] bg-center bg-cover rounded-xl hover:cursor-pointer hover:scale-105 duration-200 flex flex-col items-end' style={{backgroundImage: `url(https://image.tmdb.org/t/p/original${poster_path})`}}>
            <div className='absolute bottom-0 w-full bg-gray-900/60  text-white text-center'>
                {name}
            </div>
        </div>
    )
}
export default MovieCard