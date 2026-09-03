const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // İkinci parametre olarak bağlantı seçeneklerini ekliyoruz
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            family: 4, // Bağlantıyı IPv4 üzerinden yapmaya zorlar (ECONNREFUSED çözümüdür)
            serverSelectionTimeoutMS: 5000 // Sunucu bulamazsa sonsuza kadar beklemesini engeller
        });
        console.log(`✅ MongoDB Bağlantısı Başarılı : ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB Bağlantı Hatası ❌: ${error.message}`);
        process.exit(1); 
    }
};

module.exports = connectDB;