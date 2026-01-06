import { Router } from 'express';
import { isAuthenticated, getEffectiveUserId } from '../middleware/auth.js';

const router = Router();

// Groups page - Display list of WhatsApp groups
router.get('/groups', isAuthenticated, async (req, res) => {
    try {
        const userId = getEffectiveUserId(req);
        const whatsappService = req.app.get('whatsappService');

        // Check if WhatsApp is connected
        const status = whatsappService.getSessionStatus(userId);

        if (!status.connected) {
            return res.render('groups', {
                page: 'groups',
                user: req.user,
                groups: [],
                error: 'WhatsApp belum terhubung. Silakan scan QR code terlebih dahulu.',
                connected: false
            });
        }

        // Get groups
        const groups = await whatsappService.getGroups(userId);

        res.render('groups', {
            page: 'groups',
            user: req.user,
            groups: groups,
            error: null,
            connected: true
        });
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.render('groups', {
            page: 'groups',
            user: req.user,
            groups: [],
            error: 'Gagal mengambil data group: ' + error.message,
            connected: false
        });
    }
});

// API endpoint to get groups as JSON
router.get('/api/groups', isAuthenticated, async (req, res) => {
    try {
        const userId = getEffectiveUserId(req);
        const whatsappService = req.app.get('whatsappService');

        const groups = await whatsappService.getGroups(userId);

        res.json({
            success: true,
            groups: groups
        });
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
