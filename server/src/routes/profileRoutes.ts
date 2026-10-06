import { Router } from 'express'
import { updateProfile } from '../controllers/profileController.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.put('/', requireAuth, updateProfile)

export default router
