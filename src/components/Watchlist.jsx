import React from 'react'


const Watchlist = () => {
  return (
    <>
    <div className='flex justify-center flex-wrap m-4'>
      <div className='flex justify-center items-center h-[2.5rem] w-[6rem] bg-blue-300 rounded-xl text-white font-bold hover:cursor-pointer mx-3'>All Genres</div>
      <div className='flex justify-center items-center h-[2.5rem] w-[6rem] bg-gray-400 rounded-xl text-white font-bold hover:cursor-pointer mx-3'>Action</div>
      <div className='flex justify-center items-center h-[2.5rem] w-[6rem] bg-gray-400 rounded-xl text-white font-bold hover:cursor-pointer mx-3'>Crime</div>
    </div>
    <div className='flex justify-center my-4'>
      <input type="text" placeholder='Search movies' className='h-[2rem] w-[18rem] bg-gray-300 px-2' />

    </div>

    <div className='overflow-hidden rounded-lg border border-gray-200 m-8'>
          <table className='w-full text-gray-500 text-center'>
            <thead className='border-b-1'>
              <tr>
                <th>Name</th>
                <th>Ratings</th>
                <th>Popularity</th>
                <th>Genre</th>
              </tr>
            </thead>
            <tbody>
                  <tr className='border-b-2'>
                    <td className='flex items-center px-6 py-4'>
                      <img className='h-[7.5rem] w-[12rem]' src={'https://i.pinimg.com/originals/fb/55/dc/fb55dc632b7a7ffbabf104b1208b27fc.jpg'} />
                      <div className='mx-12'>Kalki 2898 AD</div>
                    </td>
                    <td>7</td>
                    <td>9</td>
                    <td> Mythological </td>
                    <td><button  className='text-red-800 underline hover:cursor-pointer'>Delete</button></td>
                  </tr>
            </tbody>
          </table>
    </div>
    </>
  )
}

export default Watchlist