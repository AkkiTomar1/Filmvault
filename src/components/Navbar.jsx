import React from 'react'
import Logo from "../assets/Na.jpg"
import {Link} from 'react-router-dom'

const Navbar = () => {
  return (
    <div className='flex border space-x-7 items-center pl-3 py-3 ' >
      <img className='w-[50px] ' src={Logo} alt="Logo" />
      <Link to="/" className='text-blue-500 font-bold text-2xl'>Home</Link>
      <Link to="/watchlist" className='text-blue-500 font-bold text-2xl'>Watchlist</Link>
    </div>
  )
}

export default Navbar