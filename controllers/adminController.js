const adminModel = require('../models/adminModel');

// รายชื่อสถานะที่ระบบอนุญาตให้แก้ไขได้ (Validation)
const ALLOWED_STATUSES = ['pending', 'approved', 'rejected', 'ordering', 'completed'];

exports.getAllRequests = async (req, res) => {
    try {
        const { status } = req.query; // รับค่า filter จาก URL (เช่น ?status=pending)
        const requests = await adminModel.getAllRequests(status);

        res.status(200).json({
            status: 'success',
            data: requests
        });
    } catch (error) {
        console.error('Get all requests error:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

exports.getRequestById = async (req, res) => {
    try {
        const { id } = req.params;
        const requestDetail = await adminModel.getRequestById(id);

        if (!requestDetail) {
            return res.status(404).json({ status: 'error', message: 'Request not found' });
        }

        res.status(200).json({
            status: 'success',
            data: requestDetail
        });
    } catch (error) {
        console.error('Get request by id error:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

exports.updateRequestStatus = async (req, res) => {
    try {
        const requestId = req.params.id;
        // รับค่า status และ admin_note จากที่หน้าบ้านส่งมา
        const { status, admin_note } = req.body;

        // ส่งข้อมูลไปให้ Model จัดการต่อ
        // (สมมติว่าคุณเบทเรียกใช้ adminModel อยู่ด้านบนของไฟล์แล้ว)
        await adminModel.updateRequestStatus(requestId, status, admin_note);

        res.status(200).json({
            status: 'success',
            message: 'Request status updated successfully'
        });
    } catch (error) {
        console.error('Update request status error:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

exports.getDashboardStats = async (req, res) => {
    try {
        const stats = await adminModel.getDashboardStats();
        res.status(200).json({
            status: 'success',
            data: stats
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};
