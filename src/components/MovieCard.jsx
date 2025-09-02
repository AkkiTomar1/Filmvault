import React from 'react'

const MovieCard = ({ movieObj, poster_path, watchlist, name, handleAddtoWatchList,handleRemoveFromWatchList }) => {

  function doesContain(movieObj) {
    for (let i = 0; i < watchlist.length; i++) {
      if (watchlist[i].id == movieObj.id) {
        return true;
      }
    }
    return false;

  }
  return (
    <div
      className='relative h-[48vh] w-[189px] bg-center bg-cover rounded-xl hover:cursor-pointer hover:scale-105 duration-200 flex flex-col items-end mb-4'
      style={{ backgroundImage: `url(https://image.tmdb.org/t/p/original${poster_path})` }}
    >
      {doesContain(movieObj) ?
        <div onClick={() => handleRemoveFromWatchList(movieObj)}
          className='mx-2 mt-1 bg-gray-900/60 rounded-l px-2 text-white'>&#10060;</div> :
        <div
          onClick={() => handleAddtoWatchList(movieObj)}
          className='mx-2 mt-1 bg-gray-900/60 rounded-l px-2 text-white'
        >
          &#128525;
        </div>
      }


      {/* Movie title at bottom */}
      <div className='absolute bottom-0 w-full bg-gray-900/60 text-white text-center'>
        {name}
      </div>
    </div>
  )
}

export default MovieCard
