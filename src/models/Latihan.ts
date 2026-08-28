import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILatihan extends Document {
  tanggal: string;
  tahunPelajaran: string;
  uraian: string;
  foto1: string;
  foto2: string;
  createdAt: Date;
}

export interface ILatihanData {
  id?: string;
  _id?: string;
  tanggal: string;
  tahunPelajaran: string;
  uraian: string;
  foto1: string;
  foto2: string;
  createdAt?: string | Date;
}

export const LatihanSchema = new Schema<ILatihan>({
  tanggal: { type: String, required: true },
  tahunPelajaran: { type: String, required: true },
  uraian: { type: String, required: true },
  foto1: { type: String, required: true },
  foto2: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export async function getLatihanModel(conn: mongoose.Connection): Promise<Model<ILatihan>> {
  return conn.models.Latihan || conn.model<ILatihan>('Latihan', LatihanSchema);
}
