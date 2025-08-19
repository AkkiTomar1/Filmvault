import React from 'react'

const Banner = () => {
  return (
    <div className='h-[20vh] md:h-[80vh] bg-cover bg-center flex items-end' style={{backgroundImage:`url(https://i.pinimg.com/736x/29/7d/e0/297de0761b0c756266d74ca50d03cc1d.jpg)`}}>
        <div className='p-2 text-white text-xl bg-gray-900/60 w-full text-center'>Avengers Endgame</div>
    </div>
  )
}

export default Banner