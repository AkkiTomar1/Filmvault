import React from 'react'

const Watchlist = ({ watchlist, handleRemoveFromWatchList }) => {
  return (
    <>
      {/* Genre filter buttons */}
      <div className='flex justify-center flex-wrap m-4'>
        <div className='flex justify-center items-center h-[2.5rem] w-[6rem] bg-blue-300 rounded-xl text-white font-bold hover:cursor-pointer mx-3'>All Genres</div>
        <div className='flex justify-center items-center h-[2.5rem] w-[6rem] bg-gray-400 rounded-xl text-white font-bold hover:cursor-pointer mx-3'>Action</div>
        <div className='flex justify-center items-center h-[2.5rem] w-[6rem] bg-gray-400 rounded-xl text-white font-bold hover:cursor-pointer mx-3'>Crime</div>
      </div>

      {/* Search input */}
      <div className='flex justify-center my-4'>
        <input type="text" placeholder='Search movies' className='h-[2rem] w-[18rem] bg-gray-300 px-2' />
      </div>

      {/* Movies Table */}
      <div className='overflow-hidden rounded-lg border border-gray-200 m-8'>
        <table className='w-full text-gray-500 text-center'>
          <thead className='border-b-1'>
            <tr>
              <th>Name</th>
              <th>Ratings</th>
              <th>Popularity</th>
              <th>Genre</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {watchlist.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-4 text-gray-400">
                  No movies in Watchlist
                </td>
              </tr>
            ) : (
              watchlist.map((movieObj) => (
                <tr key={movieObj.id} className='border-b-2'>
                  <td className='flex items-center px-6 py-4'>
                    <img
                      className='h-[7.5rem] w-[12rem]'
                      src={`https://image.tmdb.org/t/p/original/${movieObj.backdrop_path}`}
                      alt={movieObj.title}
                    />
                    <div className='mx-12'>{movieObj.title}</div>
                  </td>
                  <td>{movieObj.vote_average}</td>
                  <td>{movieObj.popularity}</td>
                  <td>{movieObj.genre_ids[0]}</td>
                  <td>
                    <button
                      onClick={() => handleRemoveFromWatchList(movieObj)}
                      className='text-red-800 underline hover:cursor-pointer'
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default Watchlist
