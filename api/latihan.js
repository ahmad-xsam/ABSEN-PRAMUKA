const mongoose = require('mongoose');

// MongoDB Atlas Connection URI
// Can be configured in Vercel Settings -> Environment Variables -> MONGODB_URI
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://pramukasordu:pramukasordu123@cluster0.mongodb.net/pramuka_sordu?retryWrites=true&w=majority";

// Connection Cache for Vercel Serverless Functions
let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb && mongoose.connection.readyState === 1) {
        return cachedDb;
    }
    const db = await mongoose.connect(MONGODB_URI, {
        bufferCommands: false,
    });
    cachedDb = db;
    return db;
}

// Mongoose Schema Definition for Pramuka Sordu Latihan Record
const LatihanSchema = new mongoose.Schema({
    tanggal: { type: String, required: true },
    tahunPelajaran: { type: String, required: true },
    uraian: { type: String, required: true },
    foto1: { type: String, required: true },
    foto2: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Latihan = mongoose.models.Latihan || mongoose.model('Latihan', LatihanSchema);

module.exports = async (req, res) => {
    // Set CORS headers for cross-origin access
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        await connectToDatabase();

        const { method } = req;
        const { id } = req.query;

        // GET: Fetch all records from MongoDB Atlas
        if (method === 'GET') {
            const data = await Latihan.find({}).sort({ tanggal: 1 });
            return res.status(200).json({ success: true, data });
        }

        // POST: Add new record or bulk import to MongoDB Atlas
        if (method === 'POST') {
            let body = req.body;
            if (typeof body === 'string') {
                body = JSON.parse(body);
            }
            if (Array.isArray(body)) {
                await Latihan.deleteMany({});
                const inserted = await Latihan.insertMany(body);
                return res.status(201).json({ success: true, data: inserted });
            }
            const newLatihan = await Latihan.create(body);
            return res.status(201).json({ success: true, data: newLatihan });
        }

        // PUT: Update an existing record in MongoDB Atlas
        if (method === 'PUT') {
            let body = req.body;
            if (typeof body === 'string') {
                body = JSON.parse(body);
            }
            const targetId = id || body._id || body.id;
            const updated = await Latihan.findByIdAndUpdate(targetId, body, { new: true });
            return res.status(200).json({ success: true, data: updated });
        }

        // DELETE: Remove record from MongoDB Atlas
        if (method === 'DELETE') {
            await Latihan.findByIdAndDelete(id);
            return res.status(200).json({ success: true, message: 'Data successfully deleted from MongoDB' });
        }

        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    } catch (error) {
        console.error("MongoDB Atlas API Error:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
};
