import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const password = searchParams.get('password');

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Forward the request to the actual backend
    const backendUrl = `${process.env.NEXT_PUBLIC_API_BASE}/login?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    });

    const data = await response.text();
    
    if (!response.ok) {
      return NextResponse.json(
        { error: data || 'Login failed' },
        { status: response.status }
      );
    }

    // Try to parse as JSON, otherwise return as text
    try {
      const jsonData = JSON.parse(data);
      return NextResponse.json(jsonData);
    } catch {
      return NextResponse.json({ token: data });
    }
  } catch (error) {
    console.error('Login proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}