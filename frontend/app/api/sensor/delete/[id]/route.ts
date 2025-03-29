import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = (await cookies()).get("token")?.value;
        const response = await fetch(
            `${process.env.BACKEND_URL}/sensor/delete/${(await params).id}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                method: "POST",
            }
        );
        const responseJson = await response.json();
        return NextResponse.json(responseJson, { status: response.status });
    } catch (error) {
        return NextResponse.json({ pesan: error }, { status: 500 });
    }
}
