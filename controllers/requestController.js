const bookRequestModel = require('../models/bookRequestModel');

exports.createRequest = async (req, res) => {
    try {
        const { cache_id, reason } = req.body;
        const userId = req.user.id; // ได้มาจาก Token ผ่าน authMiddleware

        // ตรวจสอบความครบถ้วนของข้อมูล
        if (!cache_id || !reason) {
            return res.status(400).json({
                status: 'error',
                message: 'cache_id and reason are required'
            });
        }

        // ป้องกัน Invalid Request โดยเช็คว่าแคชมีจริงไหม
        const cacheExists = await bookRequestModel.checkCacheExists(cache_id);
        if (!cacheExists) {
            return res.status(404).json({
                status: 'error',
                message: 'Invalid cache_id. The selected book does not exist in the search cache.'
            });
        }

        // บันทึกคำร้อง
        const requestId = await bookRequestModel.createRequest(userId, cache_id, reason);

        res.status(201).json({
            status: 'success',
            message: 'Book request submitted successfully',
            request_id: requestId
        });

    } catch (error) {
        console.error('Create request error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error while creating request'
        });
    }
};

exports.getMyRequests = async (req, res) => {
    try {
        const userId = req.user.id; // ได้มาจาก Token
        const requests = await bookRequestModel.getMyRequests(userId);

        res.status(200).json({
            status: 'success',
            data: requests
        });

    } catch (error) {
        console.error('Get my requests error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error while fetching requests'
        });
    }
};

exports.checkHistory = async (req, res) => {
    try {
        const cacheId = req.params.cacheId;
        // เรียกใช้ฟังก์ชันจาก Model ที่เราเพิ่งสร้าง
        const history = await bookRequestModel.checkBookHistory(cacheId); 

        res.status(200).json({ status: 'success', data: history });
    } catch (error) {
        console.error('Check history error:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};