import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getTinderHeaders } from '@/lib/tinderHeaders';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId } = body || {};
        if (!userId) return NextResponse.json({ success: false, message: 'Thiếu userId' });

        const response = await axios({
            method: 'get',
            url: `https://api.gotinder.com/pass/${userId}?locale=vi`,
            headers: getTinderHeaders()
        });
        return NextResponse.json({ success: true, data: response.data });
    } catch (error: any) {
        console.error('Lỗi dislike:', error?.response?.data || error.message);
        return NextResponse.json({ success: false, message: error?.response?.data?.message || 'Lỗi server' });
    }
}
