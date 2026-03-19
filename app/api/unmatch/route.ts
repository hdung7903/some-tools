import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getTinderHeaders } from '@/lib/tinderHeaders';

export async function POST(request: NextRequest) {
    try {
        const { matchId } = await request.json();
        if (!matchId) return NextResponse.json({ success: false, message: 'Thiếu matchId' });

        const response = await axios({
            method: 'delete',
            url: `https://api.gotinder.com/user/matches/${matchId}?locale=vi`,
            headers: getTinderHeaders()
        });
        return NextResponse.json({ success: true, data: response.data });
    } catch (error: any) {
        console.error('Lỗi unmatch:', error?.message);
        return NextResponse.json({ success: false, message: 'Lỗi server' });
    }
}
