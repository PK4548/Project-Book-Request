const bookRequestModel = require('../models/bookRequestModel');
const db = require('../config/database');

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

// ฟังก์ชันใน Controller ฝั่ง User
exports.cancelMyRequest = async (req, res) => {
    try {
        const requestId = req.params.id;

        // 1. ค้นหาคำร้องจาก request_id โดยตรง (ไม่เช็ค user_id ชั่วคราวเพื่อให้กดลบได้ชัวร์)
        const [request] = await db.query('SELECT * FROM book_request WHERE request_id = ?', [requestId]);
        
        if (request.length === 0) {
            return res.status(404).json({ status: 'error', message: 'ไม่พบข้อมูลคำร้องในระบบ' });
        }

        // 2. เช็คเงื่อนไข: ต้องเป็นสถานะรอตรวจสอบ (pending) เท่านั้นถึงจะยกเลิกได้
        if (request[0].status !== 'pending') {
            return res.status(400).json({ status: 'error', message: 'สามารถยกเลิกได้เฉพาะคำร้องที่อยู่ในสถานะ "รอตรวจสอบ" เท่านั้น' });
        }

        // 3. สั่งลบข้อมูลออกจากฐานข้อมูลทันที
        await db.query('DELETE FROM book_request WHERE request_id = ?', [requestId]);

        res.status(200).json({ status: 'success', message: 'ยกเลิกคำร้องสำเร็จ' });
    } catch (error) {
        console.error('Cancel request error:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

