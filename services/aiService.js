require('dotenv').config();

exports.recommendBooks = async (searchParams) => {
    try {
        const apiKey = process.env.DOTBLUE_API_KEY;
        
        if (!apiKey) {
            console.error("❌ หา DOTBLUE_API_KEY ไม่เจอในไฟล์ .env");
            return [];
        }

        const { keyword, title, author, isbn } = searchParams;

        // คำนวณช่วงปีล่าสุดย้อนหลังไม่เกิน 2 ปี (ทั้ง ค.ศ. และ พ.ศ.)
        const currentYearAD = new Date().getFullYear();
        const minYearAD = currentYearAD - 2;
        const currentYearBE = currentYearAD + 543;
        const minYearBE = minYearAD + 543;
        
        const prompt = `
        คุณคือบรรณารักษ์ผู้เชี่ยวชาญการคัดเลือกและแนะนำหนังสือเข้าห้องสมุดมหาวิทยาลัย
        กรุณาค้นหาและลิสต์รายชื่อหนังสือที่เกี่ยวข้อง ซึ่งมีอยู่จริงบนโลกและมีการตีพิมพ์จริงเท่านั้น จำนวน 3-5 เล่ม ที่ตรงกับเงื่อนไขต่อไปนี้:
        - คำค้นหาทั่วไป (Keyword): ${keyword || '-'} (หากมีหลายคำค้นหา ให้พิจารณาหนังสือที่เกี่ยวข้องกับทุกคำค้นหา หรือเกี่ยวข้องกับแต่ละคำค้นหา)
        - ชื่อหนังสือ: ${title || '-'}
        - ชื่อผู้แต่ง: ${author || '-'}
        - รหัส ISBN: ${isbn || '-'}

        กฎเหล็กในการคัดเลือกและเรียงลำดับ (สำคัญมาก):
        1. ห้ามแต่งชื่อหนังสือ ชื่อผู้แต่ง หรือเลข ISBN ขึ้นมาเองเด็ดขาด ต้องเป็นหนังสือที่มีอยู่จริง
        2. จำกัดเฉพาะหนังสือใหม่ที่ตีพิมพ์ในช่วง 1-2 ปีล่าสุดเท่านั้น คือตั้งแต่ปี ค.ศ. ${minYearAD}-${currentYearAD} (หรือ พ.ศ. ${minYearBE}-${currentYearBE})
        3. เทคนิคการเรียงลำดับกรณีหนังสือคล้ายกัน: ให้เรียงลำดับจากหนังสือที่มีเนื้อหาตรงกับคำค้นหามากที่สุดขึ้นก่อน และเรียงตามปีที่พิมพ์ใหม่ล่าสุด (Newest First)
        4. หากไม่พบหนังสือที่มีอยู่จริงตามเงื่อนไข ให้คืนค่าเป็น Array เปล่า [] ทันที ห้ามเดาข้อมูล
        5. ตอบกลับข้อมูลเป็นรูปแบบ JSON Array เท่านั้น ห้ามมีข้อความหรือคำอธิบายอื่นใดปนเด็ดขาด
        [
            {
                "book_title": "ชื่อหนังสือภาษาไทยหรืออังกฤษ",
                "author": "ชื่อผู้แต่ง",
                "publisher": "ชื่อสำนักพิมพ์",
                "publish_year": "ปีที่พิมพ์ (ระบุเป็นตัวเลข 4 หลัก)",
                "isbn": "รหัส ISBN",
                "src_web": "PSU dotBlue AI"
            }
        ]
        `;

        console.log("กำลังส่งคำค้นหาไปที่ PSU dotBlue API...");
        
        const response = await fetch('https://ai.psu.blue/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "deepseek/deepseek-v4.1-flash",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.1
            })
        });

        const rawText = await response.text();

        if (!response.ok || rawText.trim().startsWith('<!DOCTYPE') || rawText.trim().startsWith('<html')) {
            console.error("❌ PSU dotBlue API ขัดข้องหรือ Timeout:", rawText.substring(0, 150));
            return [];
        }

        const lines = rawText.split('\n');
        let fullContent = "";

        for (const line of lines) {
            if (line.startsWith('data:')) {
                const jsonStr = line.replace(/^data:\s*/, '').trim();
                if (jsonStr === '[DONE]') continue;
                try {
                    const parsedLine = JSON.parse(jsonStr);
                    const content = parsedLine.choices?.[0]?.delta?.content || parsedLine.choices?.[0]?.message?.content || "";
                    fullContent += content;
                } catch (e) {}
            }
        }

        if (!fullContent && rawText) {
            try {
                const normalJson = JSON.parse(rawText);
                fullContent = normalJson.choices?.[0]?.message?.content || "";
            } catch (e) {
                fullContent = rawText;
            }
        }

        let responseText = fullContent.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const firstBracket = responseText.indexOf('[');
        const lastBracket = responseText.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket !== -1) {
            responseText = responseText.substring(firstBracket, lastBracket + 1);
        }

        const parsedData = JSON.parse(responseText);
        let books = Array.isArray(parsedData) ? parsedData : (parsedData.books || Object.values(parsedData)[0] || []);

        // จัดเรียงหนังสือที่คล้ายกันให้เรียงตามปีที่พิมพ์ใหม่สุดขึ้นก่อนเสมอ (แก้ข้อ 10)
        books.sort((a, b) => (parseInt(b.publish_year) || 0) - (parseInt(a.publish_year) || 0));

        console.log("✅ ค้นหาหนังสือผ่าน dotBlue สำเร็จ:", books);
        return books;

    } catch (error) {
        console.error("❌ AI Service Error:", error.message);
        return []; 
    }
};