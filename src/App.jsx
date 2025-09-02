import './App.css'
import { useState } from 'react'
import Banner from './components/Banner.jsx'
import Movies from './components/Movies.jsx'
import Navbar from './components/Navbar.jsx'
import Watchlist from './components/Watchlist.jsx'
import Footer from './components/Footer.jsx'
import { BrowserRouter, Routes, Route } from 'react-router-dom'


function App() {

  let [watchlist, setWatchlist] = useState([])
  let handleAddtoWatchList = (movieObj) => {
    let newWatchlist = [...watchlist, movieObj]
    setWatchlist(newWatchlist)

    console.log(newWatchlist);

  }

  let handleRemoveFromWatchList=(movieObj)=>{
    let filteredWatchList=watchlist.filter((movie)=>{
      return movie.id!=movieObj.id;
    })
    setWatchlist(filteredWatchList);
    console.log(filteredWatchList);
    
  }
  

  return (
    <>
      <BrowserRouter>

        <Navbar />
        <Routes>
          <Route path='/' element={<> <Banner /> 
          <Movies
          watchlist={watchlist}
          handleAddtoWatchList={handleAddtoWatchList}
          handleRemoveFromWatchList={handleRemoveFromWatchList} />
           </>} />

          <Route path='/Watchlist' element={<Watchlist watchlist={watchlist} handleRemoveFromWatchList={handleRemoveFromWatchList}/>} />


        </Routes>
        <Footer />
      </BrowserRouter>
   
    </>
  )
}

export default App
