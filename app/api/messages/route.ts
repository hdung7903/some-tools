import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getTinderHeaders } from '@/lib/tinderHeaders';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const matchId = searchParams.get('matchId');
        if (!matchId) return NextResponse.json({ success: false, message: 'Thiếu matchId' });

        const response = await axios({
            method: 'get',
            url: `https://api.gotinder.com/v2/matches/${matchId}/messages?locale=vi&count=100`,
            headers: getTinderHeaders()
        });
        return NextResponse.json({ success: true, data: response.data });
    } catch (error: any) {
        console.error('Lỗi lấy messages:', error?.message);
        return NextResponse.json({ success: false, message: 'Lỗi server' });
    }
}
