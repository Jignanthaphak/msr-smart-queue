const express = require('express');
const cors = require('cors');
const { ThaiIdCard } = require('thai-id-card');

const app = express();
app.use(cors());

const reader = new ThaiIdCard();
let currentCardData = null;

console.log('🚀 กำลังเริ่มระบบ Smartcard Agent...');

// ฟังก์ชันอ่านข้อมูลจากบัตร
async function readData() {
    try {
        const users = await reader.read();
        if (users) {
            currentCardData = users;
            console.log('💳 อ่านข้อมูลสำเร็จ:', users.citizenId);
        }
    } catch (err) {
        // ถ้าไม่มีบัตรเสียบอยู่ หรืออ่านไม่ได้ จะเคลียร์ค่า
        currentCardData = null;
    }
}

// ตั้งเวลาให้ตรวจสอบบัตรทุกๆ 1 วินาที (Polling)
setInterval(readData, 1000);

// API สำหรับ Next.js มาดึงข้อมูล
app.get('/api/smartcard', (req, res) => {
    if (currentCardData) {
        // ปรับ format ข้อมูลให้ใช้ง่ายเหมือนที่คุยกันไว้
        res.json({ 
            status: 'success', 
            data: {
                citizenId: currentCardData.citizenId,
                titleTH: currentCardData.titleTH,
                firstNameTH: currentCardData.firstNameTH,
                lastNameTH: currentCardData.lastNameTH,
                dob: currentCardData.birthDate
            }
        });
    } else {
        res.json({ status: 'waiting', message: 'กรุณาเสียบบัตร' });
    }
});

app.listen(8000, () => {
    console.log('✅ Agent พร้อม! ยิง fetch มาที่ http://localhost:8000/api/smartcard');
});