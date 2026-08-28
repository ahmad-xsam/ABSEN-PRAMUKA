import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getLatihanModel } from '@/models/Latihan';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    const conn = await connectToDatabase();
    const Latihan = await getLatihanModel(conn);
    const data = await Latihan.find({}).sort({ tanggal: 1 }).lean();
    
    return NextResponse.json({ success: true, data }, { headers: corsHeaders });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Database error';
    return NextResponse.json({ success: false, error: errMessage }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(req: NextRequest) {
  try {
    const conn = await connectToDatabase();
    const Latihan = await getLatihanModel(conn);
    const body = await req.json();

    if (Array.isArray(body)) {
      await Latihan.deleteMany({});
      const inserted = await Latihan.insertMany(body);
      return NextResponse.json({ success: true, data: inserted }, { status: 201, headers: corsHeaders });
    }

    const newDoc = await Latihan.create(body);
    return NextResponse.json({ success: true, data: newDoc }, { status: 201, headers: corsHeaders });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Database error';
    return NextResponse.json({ success: false, error: errMessage }, { status: 500, headers: corsHeaders });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const conn = await connectToDatabase();
    const Latihan = await getLatihanModel(conn);
    const { searchParams } = new URL(req.url);
    const queryId = searchParams.get('id');
    const body = await req.json();

    const targetId = queryId || body._id || body.id;
    const updated = await Latihan.findByIdAndUpdate(targetId, body, { new: true }).lean();

    return NextResponse.json({ success: true, data: updated }, { headers: corsHeaders });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Database error';
    return NextResponse.json({ success: false, error: errMessage }, { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const conn = await connectToDatabase();
    const Latihan = await getLatihanModel(conn);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing id parameter' }, { status: 400, headers: corsHeaders });
    }

    await Latihan.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Deleted successfully' }, { headers: corsHeaders });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Database error';
    return NextResponse.json({ success: false, error: errMessage }, { status: 500, headers: corsHeaders });
  }
}
