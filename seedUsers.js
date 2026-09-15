const bcrypt = require('bcrypt');
const db = require('./config/database');

async function seed() {
    try {
        const plainPassword = 'password123';
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(plainPassword, salt);

        // --- จุดที่แก้ไข ---
        await db.query('SET FOREIGN_KEY_CHECKS = 0');
        await db.query('TRUNCATE TABLE user');
        await db.query('SET FOREIGN_KEY_CHECKS = 1');
        // ------------------

        await db.query(`
            INSERT INTO user (full_name, email, password, role) 
            VALUES 
            ('Somchai (User)', 'user@example.com', ?, 'USER'),
            ('Somsri (Admin)', 'admin@example.com', ?, 'ADMIN')
        `, [hashedPassword, hashedPassword]);

        console.log('Test users created successfully!');
        console.log('1. User -> Email: user@example.com | Pass: password123');
        console.log('2. Admin -> Email: admin@example.com | Pass: password123');
        process.exit();
    } catch (err) {
        console.error('Error seeding users:', err);
        process.exit(1);
    }
}

seed();