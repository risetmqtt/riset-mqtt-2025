import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const body = await req.json();
        const token = (await cookies()).get("token")?.value;
        const response = await fetch(
            `${process.env.BACKEND_URL}/sensor/data/${(await params).id}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                method: "PUT",
                body: JSON.stringify(body),
            }
        );
        const responseJson = await response.json();
        return NextResponse.json(responseJson, { status: response.status });
    } catch (error) {
        return NextResponse.json({ pesan: error }, { status: 500 });
    }
}
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const body = await req.json();
        const token = (await cookies()).get("token")?.value;
        const response = await fetch(
            `${process.env.BACKEND_URL}/sensor/data/${(await params).id}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                method: "DELETE",
                body: JSON.stringify(body),
            }
        );
        const responseJson = await response.json();
        return NextResponse.json(responseJson, { status: response.status });
    } catch (error) {
        return NextResponse.json({ pesan: error }, { status: 500 });
    }
}
