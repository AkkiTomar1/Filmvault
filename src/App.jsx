import './App.css'
import { useState } from 'react'
import Banner from './components/Banner.jsx'
import Movies from './components/Movies.jsx'
import Navbar from './components/Navbar.jsx'
import Watchlist from './components/Watchlist.jsx'
import Footer from './components/Footer.jsx'
import { HashRouter, Routes, Route } from 'react-router-dom'

function App() {
  let [watchlist, setWatchlist] = useState([])

  // Add to watchlist
  let handleAddtoWatchList = (movieObj) => {
    let newWatchlist = [...watchlist, movieObj]
    setWatchlist(newWatchlist)
    console.log(newWatchlist)
  }

  // Remove from watchlist
  let handleRemoveFromWatchList = (movieObj) => {
    let filteredWatchList = watchlist.filter((movie) => {
      return movie.id !== movieObj.id
    })
    setWatchlist(filteredWatchList)
    console.log(filteredWatchList)
  }

  return (
    <>
      <HashRouter>
        <Navbar />
        <Routes>
          {/* Home Route */}
          <Route
            path="/"
            element={
              <>
                <Banner />
                <Movies
                  watchlist={watchlist}
                  handleAddtoWatchList={handleAddtoWatchList}
                  handleRemoveFromWatchList={handleRemoveFromWatchList}
                />
              </>
            }
          />

          {/* Watchlist Route */}
          <Route
            path="/watchlist"
            element={
              <Watchlist
                watchlist={watchlist}
                handleRemoveFromWatchList={handleRemoveFromWatchList}
              />
            }
          />
        </Routes>
        <Footer />
      </HashRouter>
    </>
  )
}

export default App
