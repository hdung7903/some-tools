import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getTinderHeaders } from '@/lib/tinderHeaders';

export async function GET() {
    try {
        const response = await axios({
            method: 'get',
            url: `https://api.gotinder.com/v2/matches?locale=vi&count=60&message=0&is_tinder_u=false`,
            headers: getTinderHeaders()
        });
        return NextResponse.json({ success: true, data: response.data });
    } catch (error: any) {
        console.error('Lỗi lấy matches:', error?.message);
        return NextResponse.json({ success: false, message: 'Lỗi server' });
    }
}
