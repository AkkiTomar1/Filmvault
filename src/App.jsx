import './App.css'
import Banner from './components/Banner.jsx'
import Footer from './components/Footer.jsx'
import Movies from './components/Movies.jsx'
import Navbar from './components/Navbar.jsx'
import Watchlist from './components/Watchlist.jsx'
import { BrowserRouter, Routes, Route } from 'react-router-dom'


function App() {

  return (
    <>
      <BrowserRouter>

        <Navbar />
        <Routes>
          <Route path='/' element={<> <Banner /> <Movies/> </>} />

          <Route path='/Watchlist' element={<Watchlist />} />


        </Routes>
        <Footer/>

      </BrowserRouter>

    </>
  )
}

export default App
