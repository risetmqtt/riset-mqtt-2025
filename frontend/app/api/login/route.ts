// app/api/login/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    const { email, sandi } = await req.json();

    const fetchLogin = await fetch(`${process.env.BACKEND_URL}/auth`, {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, sandi }),
    });

    const responseLogin = await fetchLogin.json();

    if (fetchLogin.status !== 200) {
        return NextResponse.json(responseLogin, { status: fetchLogin.status });
    }
    if (!responseLogin.token) {
        return NextResponse.json(
            { error: responseLogin.pesan },
            { status: fetchLogin.status }
        );
    }

    // Set token in cookies (this works in server context)
    return NextResponse.json(responseLogin, {
        status: 200,
        headers: {
            "Set-Cookie": `token=${responseLogin.token}; HttpOnly; Path=/; Max-Age=86400`,
        },
    });
}

export async function GET() {
    try {
        const token = (await cookies()).get("token")?.value;
        const response = await fetch(`${process.env.BACKEND_URL}/auth/user`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });
        const responseJson = await response.json();
        return NextResponse.json(responseJson, { status: response.status });
    } catch (error) {
        return NextResponse.json(
            {
                pesan: error,
            },
            { status: 500 }
        );
    }
}
