const adminModel = require('../models/adminModel');
const XLSX = require('xlsx');
const ExcelJS = require('exceljs');

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
        const topKeywords = await adminModel.getTopKeywords();
        
        res.status(200).json({
            status: 'success',
            data: {
                ...stats,
                top_keywords: topKeywords
            }
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

// เพิ่มฟังก์ชัน Export รายการคำร้องเป็น Excel
exports.exportRequestsExcel = async (req, res) => {
    try {
        const requests = await adminModel.getAllRequests();

        // 1. สร้าง Workbook และ Worksheet
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'University Library System';
        const sheet = workbook.addWorksheet('Book Requests Report', {
            views: [{ showGridLines: true }] // แสดงเส้นตาราง (Gridlines)
        });

        // 2. เพิ่มหัวข้อรายงานด้านบน
        sheet.mergeCells('A1:H1');
        sheet.getCell('A1').value = 'มหาวิทยาลัยสงขลานครินทร์ วิทยาเขตตรัง - ระบบห้องสมุดอัจฉริยะ';
        sheet.getCell('A1').font = { name: 'TH Sarabun PSK', size: 16, bold: true, color: { argb: '0A4275' } };
        sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'center' };

        sheet.mergeCells('A2:H2');
        sheet.getCell('A2').value = 'รายงานสรุปข้อมูลคำร้องเสนอซื้อหนังสือเข้าห้องสมุด (Book Requests Report)';
        sheet.getCell('A2').font = { name: 'TH Sarabun PSK', size: 14, bold: true };
        sheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'center' };

        sheet.mergeCells('A3:H3');
        sheet.getCell('A3').value = `ประจำวันที่พิมพ์รายงาน: ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}`;
        sheet.getCell('A3').font = { name: 'TH Sarabun PSK', size: 12, italic: true };
        sheet.getCell('A3').alignment = { horizontal: 'center', vertical: 'center' };

        // เว้นบรรทัดที่ 4
        sheet.addRow([]);

        // 3. กำหนดหัวตาราง (แถวที่ 5)
        const headerRow = sheet.addRow(['ลำดับ', 'ชื่อหนังสือ', 'ผู้แต่ง', 'ISBN', 'ผู้ขอ', 'สถานะ', 'เหตุผลที่ขอ (User Reason)', 'วันที่ขอ']);
        
        // ตกแต่งหัวตาราง (สีน้ำเงินเข้ม #0A4275, ตัวหนังสือสีขาว ตัวหนา)
        headerRow.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0A4275' } };
            cell.font = { name: 'TH Sarabun PSK', size: 13, bold: true, color: { argb: 'FFFFFF' } };
            cell.alignment = { horizontal: 'center', vertical: 'center' };
            cell.border = {
                top: { style: 'thin', color: { argb: 'CCCCCC' } },
                bottom: { style: 'thin', color: { argb: 'CCCCCC' } },
                left: { style: 'thin', color: { argb: 'CCCCCC' } },
                right: { style: 'thin', color: { argb: 'CCCCCC' } }
            };
        });
        headerRow.height = 25;

        // 4. วนลูปใส่ข้อมูลลงในตาราง
        requests.forEach((item, index) => {
            let statusText = 'รอพิจารณา';
            if (item.status === 'approved') statusText = 'อนุมัติแล้ว';
            else if (item.status === 'rejected') statusText = 'ปฏิเสธ';

            // จัดรูปแบบวันที่ให้เป็นไทย อ่านง่าย
            const reqDate = item.request_date ? new Date(item.request_date).toLocaleString('th-TH') : '-';

            const row = sheet.addRow([
                index + 1,
                item.book_title || item.title || '-',
                item.author || '-',
                String(item.isbn || '-'),
                item.requester_name || item.full_name || 'ไม่ระบุ',
                statusText,
                item.reason || '-', // ดึงเหตุผลที่ User เสนอมาลงช่องนี้
                reqDate             // ดึงวันเวลาที่ขอจริงจากฐานข้อมูล (request_date)
            ]);

            // กำหนดความสูงและเส้นขอบแถวข้อมูล
            row.height = 20;
            row.eachCell((cell, colNumber) => {
                cell.font = { name: 'TH Sarabun PSK', size: 12 };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'E2E8F0' } },
                    bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
                    left: { style: 'thin', color: { argb: 'E2E8F0' } },
                    right: { style: 'thin', color: { argb: 'E2E8F0' } }
                };

                // จัดตำแหน่ง (คอลัมน์ ลำดับ, ISBN, สถานะ, วันที่ จัดกลาง)
                if ([1, 4, 6, 8].includes(colNumber)) {
                    cell.alignment = { horizontal: 'center', vertical: 'center' };
                } else {
                    cell.alignment = { horizontal: 'left', vertical: 'center' };
                }

                // ทำสีสลับแถว (Zebra Striping: แถวคู่สีเทาอ่อนมาก #F8F9FA)
                if (row.number % 2 === 0) {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8F9FA' } };
                }
            });
        });

        // 5. กำหนดความกว้างคอลัมน์อัตโนมัติ (Auto-fit)
        sheet.columns = [
            { width: 8 },   // ลำดับ
            { width: 42 },  // ชื่อหนังสือ
            { width: 25 },  // ผู้แต่ง
            { width: 18 },  // ISBN
            { width: 22 },  // ผู้ขอ
            { width: 16 },  // สถานะ
            { width: 30 },  // เหตุผล
            { width: 22 }   // วันที่ขอ
        ];

        // 6. ตั้งค่า Header เพื่อส่งไฟล์ออกไปดาวน์โหลด
        res.setHeader('Content-Disposition', 'attachment; filename="book_requests_report.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Export requests excel error:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};
