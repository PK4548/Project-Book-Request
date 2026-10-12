require('dotenv').config();

exports.recommendBooks = async (searchParams) => {
    try {
        const apiKey = process.env.DOTBLUE_API_KEY;
        
        if (!apiKey) {
            console.error("❌ หา DOTBLUE_API_KEY ไม่เจอในไฟล์ .env");
            return [];
        }

        const { keyword, title, author, isbn } = searchParams;
        
        const prompt = `
        คุณคือบรรณารักษ์ผู้เชี่ยวชาญการค้นหาหนังสือ 
        กรุณาค้นหาและแนะนำหนังสือที่มีอยู่จริงบนโลกและมีการตีพิมพ์จริงเท่านั้น จำนวน 1-3 เล่ม ที่ตรงกับเงื่อนไขต่อไปนี้:
        - คำค้นหาทั่วไป (Keyword): ${keyword || '-'}
        - ชื่อหนังสือ: ${title || '-'}
        - ชื่อผู้แต่ง: ${author || '-'}
        - รหัส ISBN: ${isbn || '-'}

        กฎเหล็ก (สำคัญมาก):
        1. ห้ามแต่งชื่อหนังสือ ชื่อผู้แต่ง หรือเลข ISBN ขึ้นมาเองเด็ดขาด ต้องเป็นหนังสือที่มีอยู่จริง
        2. หากไม่พบหนังสือที่มีอยู่จริงที่ตรงกับเงื่อนไข ให้คืนค่าเป็น Array เปล่า [] ทันที ห้ามเดาข้อมูล
        3. ตอบกลับข้อมูลเป็นรูปแบบ JSON Array เท่านั้น ห้ามมีข้อความหรือคำอธิบายอื่นใดปนเด็ดขาด
        [
            {
                "book_title": "ชื่อหนังสือภาษาไทยหรืออังกฤษ",
                "author": "ชื่อผู้แต่ง",
                "publisher": "ชื่อสำนักพิมพ์",
                "publish_year": "ปีที่พิมพ์",
                "isbn": "รหัส ISBN",
                "src_web": "PSU dotBlue"
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
                temperature: 0.1 // 🌟 เพิ่มค่านี้เพื่อลดการมั่วข้อมูลของ AI และเน้นความแม่นยำ
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
        const books = Array.isArray(parsedData) ? parsedData : (parsedData.books || Object.values(parsedData)[0] || []);

        console.log("✅ ค้นหาหนังสือผ่าน dotBlue สำเร็จ:", books);
        return books;

    } catch (error) {
        console.error("❌ AI Service Error:", error.message);
        return []; 
    }
};