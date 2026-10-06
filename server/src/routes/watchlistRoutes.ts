import { Router } from 'express'
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  syncWatchlist,
} from '../controllers/watchlistController.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth, getWatchlist)
router.post('/', requireAuth, addToWatchlist)
router.delete('/:movieId', requireAuth, removeFromWatchlist)
router.post('/sync', requireAuth, syncWatchlist)

export default router
