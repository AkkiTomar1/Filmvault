import React from 'react'

const Banner = () => {
  return (
    <div className='h-[20vh] md:h-[75vh] bg-cover bg-center flex items-end ' style={{backgroundImage:`url(https://4kwallpapers.com/images/wallpapers/tron-ares-poster-2880x1800-22060.jpg)`}}>
        <div className='p-2 text-white text-xl bg-gray-900/60 w-full text-center'>Tron: Ares</div>
    </div>
  )
}

export default Banner