
// เอา API Key ตัวใหม่สุดที่เบทเพิ่งสร้างมาวางในเครื่องหมายคำพูดนี้เลยครับ (ห้ามลบเครื่องหมายคำพูดออกนะ)
const API_KEY = "sk-user-5425d4ef86b68a1ff1b9b8c40bc01bd7a71285a72b1664496ac38efb9930d798";

async function testGemini() {
    try {
        console.log("🔎 1. กำลังเช็คว่า API Key ของเบทมีสิทธิ์ใช้รุ่นไหนได้บ้าง...");
        const resModels = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const dataModels = await resModels.json();
        
        if (dataModels.models) {
            console.log("✅ รุ่นที่รองรับ (ขอดูแค่ 3 รุ่นแรก):");
            console.log(dataModels.models.map(m => m.name).slice(0, 3));
        } else {
            console.log("❌ ดูรุ่นไม่ได้ Error:", dataModels);
        }

        console.log("\n🚀 2. ทดลองสั่งงาน AI ด้วยรุ่น gemini-1.5-flash...");
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "สวัสดี ทักทายสั้นๆ 1 ประโยค" }] }]
            })
        });

        const data = await res.json();
        console.log("✅ ผลลัพธ์ที่ AI ตอบกลับมา:\n", JSON.stringify(data, null, 2));

    } catch (error) {
        console.log("❌ Error พังทะลุโค้ด:", error);
    }
}

testGemini();