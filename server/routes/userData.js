const express = require('express');
const router = express.Router();
const UserData = require('../models/UserData');

// Get user data by ID
router.get('/:userId', async (req, res) => {
    try {
        const userData = await UserData.findOne({ userId: req.params.userId });
        if (!userData) {
            // Return default data if not found
            return res.json({
                userId: req.params.userId,
                targetSlots: 1,
                ownedRare: 0,
                ownedUncommon: 0,
                ownedCommon: 0
            });
        }
        res.json(userData);
    } catch (err) {
        const fs = require('fs');
        fs.appendFileSync('server_error.log', `[GET] ${new Date().toISOString()} - ${err.message}\n${err.stack}\n`);
        res.status(500).json({ message: err.message });
    }
});

// Save or Update user data
router.post('/', async (req, res) => {
    const { userId, targetSlots, ownedRare, ownedUncommon, ownedCommon } = req.body;

    try {
        let userData = await UserData.findOne({ userId });

        if (userData) {
            // Update existing
            userData.targetSlots = targetSlots;
            userData.ownedRare = ownedRare;
            userData.ownedUncommon = ownedUncommon;
            userData.ownedCommon = ownedCommon;
            userData.updatedAt = Date.now();
        } else {
            // Create new
            userData = new UserData({
                userId,
                targetSlots,
                ownedRare,
                ownedUncommon,
                ownedCommon
            });
        }

        const savedData = await userData.save();
        res.json(savedData);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
