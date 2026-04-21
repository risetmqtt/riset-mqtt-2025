import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

async function proxyRequest(
    req: NextRequest,
    params: { path: string[] },
    method: string
) {
    try {
        const token = (await cookies()).get("token")?.value;
        const slug = params.path?.join("/") || "";
        const search = new URL(req.url).search;
        const url = `${process.env.BACKEND_URL}/admin/${slug}${search}`;

        const headers: HeadersInit = {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
        };

        const init: RequestInit = {
            method,
            headers,
        };

        if (method !== "GET") {
            headers["Content-Type"] = "application/json";
            const rawBody = await req.text();
            if (rawBody) init.body = rawBody;
        }

        const response = await fetch(url, init);
        const responseJson = await response.json();
        return NextResponse.json(responseJson, { status: response.status });
    } catch (error) {
        return NextResponse.json({ pesan: error }, { status: 500 });
    }
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    return proxyRequest(req, await params, "GET");
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    return proxyRequest(req, await params, "POST");
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    return proxyRequest(req, await params, "PUT");
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    return proxyRequest(req, await params, "DELETE");
}
