import { NextResponse } from "next/server";

export async function GET() {
    try {
        const response = await fetch(`${process.env.BACKEND_URL}/satuan`);
        const responseJson = await response.json();
        return NextResponse.json(responseJson, { status: response.status });
    } catch (error) {
        return NextResponse.json({ pesan: error }, { status: 500 });
    }
}
