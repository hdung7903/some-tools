import { NextRequest, NextResponse } from 'next/server';
import { autoState } from '@/lib/autoState';

export async function POST() {
    try {
        if (!autoState.isAutoRunning) {
            return NextResponse.json({ success: false, message: 'Chưa chạy tự động' });
        }
        autoState.stopAll();
        console.log('🛑 Đã dừng tất cả các quá trình tự động');
        return NextResponse.json({ success: true, message: 'Đã dừng tự động' });
    } catch (error: any) {
        console.error('Lỗi khi dừng tự động:', error);
        return NextResponse.json({ success: false, message: 'Lỗi khi dừng: ' + error.message });
    }
}
