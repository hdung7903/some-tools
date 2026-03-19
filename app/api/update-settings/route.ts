import { NextRequest, NextResponse } from 'next/server';
import { readConfig, writeConfig } from '@/lib/configManager';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        if (writeConfig('setting.json', body)) {
            return NextResponse.json({ success: true, message: 'Cập nhật cài đặt thành công' });
        }
        return NextResponse.json({ success: false, message: 'Lỗi khi cập nhật cài đặt' });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message || 'Lỗi server' });
    }
}

export async function GET() {
    try {
        const settings = readConfig('setting.json');
        return NextResponse.json({ success: true, data: settings });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message || 'Lỗi server' });
    }
}
