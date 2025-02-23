import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
    try {
        const token = (await cookies()).get("token")?.value;
        const response = await fetch(
            `${process.env.BACKEND_URL}/backend/sensor`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        const responseJson = await response.json();
        return NextResponse.json(responseJson, { status: response.status });
    } catch (error) {
        return NextResponse.json({ pesan: error }, { status: 500 });
    }
}
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const token = (await cookies()).get("token")?.value;
        const response = await fetch(
            `${process.env.BACKEND_URL}/backend/sensor`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify(body),
            }
        );
        const responseJson = await response.json();
        return NextResponse.json(responseJson, { status: response.status });
    } catch (error) {
        return NextResponse.json({ pesan: error }, { status: 500 });
    }
}
