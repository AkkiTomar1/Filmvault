import { createBrowserRouter, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import RouteError from './components/RouteError'

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Layout />,
      children: [
        {
          index: true,
          lazy: async () => {
            const { default: Component } = await import('./pages/HomePage')
            return { Component }
          },
          errorElement: <RouteError message="We couldn't load the home page." />,
        },
        {
          path: 'watchlist',
          lazy: async () => {
            const { default: Component } = await import('./pages/WatchlistPage')
            return { Component }
          },
          errorElement: <RouteError message="We couldn't load your watchlist." />,
        },
        {
          path: 'movie/:id',
          lazy: async () => {
            const mod = await import('./pages/MovieDetailsPage')
            return { loader: mod.loader, Component: mod.default }
          },
          errorElement: <RouteError message="We couldn't load this movie." />,
        },
        {
          path: 'search',
          lazy: async () => {
            const { default: Component } = await import('./pages/SearchResultsPage')
            return { Component }
          },
          errorElement: <RouteError message="We couldn't run your search." />,
        },
        {
          path: 'genre/:id',
          lazy: async () => {
            const { default: Component } = await import('./pages/GenreMoviesPage')
            return { Component }
          },
          errorElement: <RouteError message="We couldn't load these movies." />,
        },
        {
          path: 'movie-night',
          lazy: async () => {
            const { default: Component } = await import('./pages/MovieNightPage')
            return { Component }
          },
          errorElement: <RouteError message="We couldn't load movie night picks." />,
        },
        {
          path: '*',
          element: <Navigate to="/" replace />,
        },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL },
)