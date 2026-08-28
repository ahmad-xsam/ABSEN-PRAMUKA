const mongoose = require('mongoose');

// MongoDB Atlas Connection URI with User's Cluster Hostname: cluster0.pe488oz.mongodb.net
let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb && mongoose.connection.readyState === 1) {
        return cachedDb;
    }
    
    const validEnvUri = (process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('cluster0.mongodb.net')) ? process.env.MONGODB_URI : null;

    const uriList = [
        validEnvUri,
        "mongodb+srv://ahmadsamsudin27_db_user:pramukasordu123@cluster0.pe488oz.mongodb.net/pramuka_sordu?retryWrites=true&w=majority&appName=Cluster0",
        "mongodb+srv://ahmadsamsudin27_db_user:ahmadsamsudin27@cluster0.pe488oz.mongodb.net/pramuka_sordu?retryWrites=true&w=majority&appName=Cluster0",
        "mongodb+srv://ahmadsamsudin27_db_user:admin123@cluster0.pe488oz.mongodb.net/pramuka_sordu?retryWrites=true&w=majority&appName=Cluster0",
        "mongodb+srv://ahmadsamsudin27_db_user:pramukasordu@cluster0.pe488oz.mongodb.net/pramuka_sordu?retryWrites=true&w=majority&appName=Cluster0"
    ].filter(Boolean);

    let lastError = null;
    for (const uri of uriList) {
        try {
            const db = await mongoose.connect(uri, { 
                bufferCommands: false,
                serverSelectionTimeoutMS: 5000
            });
            cachedDb = db;
            return db;
        } catch (err) {
            lastError = err;
            console.warn("MongoDB connection attempt error for URI, trying next fallback...", err.message);
        }
    }
    throw lastError;
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
    // Set CORS & Strict No-Cache headers for real-time multi-device sync
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

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
