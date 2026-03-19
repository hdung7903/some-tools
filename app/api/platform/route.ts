import { NextRequest, NextResponse } from 'next/server';
import { readConfig, writeConfig } from '@/lib/configManager';
import { getPlatformAdapter, isValidPlatform } from '@/lib/platforms';
import type { PlatformId } from '@/lib/platforms/types';

// Get current platform and auth
function getContext() {
    const authConfig = readConfig('auth.json');
    const platformId = (authConfig.activePlatform || 'tinder') as PlatformId;
    if (!isValidPlatform(platformId)) {
        throw new Error(`Invalid platform: ${platformId}`);
    }
    const adapter = getPlatformAdapter(platformId);
    const auth = authConfig.platforms?.[platformId] || {};
    return { adapter, auth, platformId, authConfig };
}

// ============================================
// POST /api/platform - Unified platform API
// Body: { action: string, ...params }
// ============================================
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, ...params } = body;

        // Switch platform
        if (action === 'switch-platform') {
            const { platform } = params;
            if (!isValidPlatform(platform)) {
                return NextResponse.json({ success: false, message: `Nền tảng "${platform}" không được hỗ trợ` });
            }
            const authConfig = readConfig('auth.json');
            authConfig.activePlatform = platform;
            writeConfig('auth.json', authConfig);
            const adapter = getPlatformAdapter(platform);
            return NextResponse.json({
                success: true,
                message: `Đã chuyển sang ${adapter.info.name}`,
                platform: adapter.info
            });
        }

        // Update auth for current platform
        if (action === 'update-auth') {
            const authConfig = readConfig('auth.json');
            const platformId = (authConfig.activePlatform || 'tinder') as PlatformId;
            if (!isValidPlatform(platformId)) {
                return NextResponse.json({ success: false, message: 'Platform không hợp lệ' });
            }
            const adapter = getPlatformAdapter(platformId);
            const newAuth = params.auth || params;
            delete newAuth.action;

            // Merge auth
            if (!authConfig.platforms) authConfig.platforms = {};
            authConfig.platforms[platformId] = { ...(authConfig.platforms[platformId] || {}), ...newAuth };

            // Validate
            const validation = await adapter.validateAuth(authConfig.platforms[platformId]);
            if (!validation.valid) {
                return NextResponse.json({ success: false, message: validation.error || 'Token không hợp lệ' });
            }

            writeConfig('auth.json', authConfig);
            return NextResponse.json({
                success: true,
                message: validation.name
                    ? `Chào mừng trở lại, ${validation.name}! (${adapter.info.name})`
                    : `Đã cập nhật auth ${adapter.info.name} thành công`,
                name: validation.name
            });
        }

        // Get profile
        if (action === 'get-profile') {
            const { adapter, auth } = getContext();
            const profile = await adapter.getProfile(auth);
            return NextResponse.json({ success: !!profile, data: profile, platform: adapter.info });
        }

        // Get recommendations
        if (action === 'get-recommendations') {
            const { adapter, auth } = getContext();
            const recs = await adapter.getRecommendations(auth);
            return NextResponse.json({ success: true, data: recs, platform: adapter.info });
        }

        // Like user
        if (action === 'like') {
            const { adapter, auth } = getContext();
            const result = await adapter.likeUser(auth, params.userId, params.swipeToken);
            return NextResponse.json({ success: result.success, data: result, platform: adapter.info });
        }

        // Dislike user
        if (action === 'dislike') {
            const { adapter, auth } = getContext();
            const result = await adapter.dislikeUser(auth, params.userId);
            return NextResponse.json({ success: result.success, platform: adapter.info });
        }

        // Get matches
        if (action === 'get-matches') {
            const { adapter, auth } = getContext();
            const matches = await adapter.getMatches(auth);
            return NextResponse.json({ success: true, data: matches, platform: adapter.info });
        }

        // Get messages
        if (action === 'get-messages') {
            const { adapter, auth } = getContext();
            const messages = await adapter.getMessages(auth, params.matchId);
            return NextResponse.json({ success: true, data: messages, platform: adapter.info });
        }

        // Send message
        if (action === 'send-message') {
            const { adapter, auth } = getContext();
            const result = await adapter.sendMessage(auth, params.matchId, params.text);
            return NextResponse.json({ success: result.success, message: result.message, platform: adapter.info });
        }

        // Unmatch
        if (action === 'unmatch') {
            const { adapter, auth } = getContext();
            const result = await adapter.unmatch(auth, params.matchId);
            return NextResponse.json({ success: result.success, platform: adapter.info });
        }

        // Get auth script
        if (action === 'get-auth-script') {
            const { adapter } = getContext();
            return NextResponse.json({ success: true, script: adapter.getAuthScript(), platform: adapter.info });
        }

        // Get settings
        if (action === 'get-settings') {
            const settings = readConfig('setting.json');
            const authConfig = readConfig('auth.json');
            const platformId = (authConfig.activePlatform || 'tinder') as PlatformId;
            const adapter = getPlatformAdapter(platformId);
            return NextResponse.json({ success: true, data: settings, platform: adapter.info });
        }

        // Update settings
        if (action === 'update-settings') {
            const { settings } = params;
            if (writeConfig('setting.json', settings)) {
                return NextResponse.json({ success: true, message: 'Đã lưu cài đặt' });
            }
            return NextResponse.json({ success: false, message: 'Lỗi khi lưu cài đặt' });
        }

        // Update location
        if (action === 'update-location') {
            const { adapter, auth } = getContext();
            if (adapter.updateLocation) {
                const result = await adapter.updateLocation(auth, params.lat, params.long);
                return NextResponse.json({ success: result.success });
            }
            return NextResponse.json({ success: false, message: `${adapter.info.name} chưa hỗ trợ cập nhật vị trí` });
        }

        // Update preferences
        if (action === 'update-preferences') {
            const { adapter, auth } = getContext();
            if (adapter.updatePreferences) {
                const result = await adapter.updatePreferences(auth, params.settings);
                return NextResponse.json({ success: result.success });
            }
            return NextResponse.json({ success: false, message: `${adapter.info.name} chưa hỗ trợ cập nhật tuỳ chọn` });
        }

        return NextResponse.json({ success: false, message: `Action "${action}" không được hỗ trợ` });
    } catch (error: any) {
        console.error('Platform API error:', error);
        return NextResponse.json({ success: false, message: error?.message || 'Lỗi server' });
    }
}

// GET /api/platform - Get current platform info & all platforms
export async function GET() {
    try {
        const authConfig = readConfig('auth.json');
        const platformId = (authConfig.activePlatform || 'tinder') as PlatformId;
        const adapter = getPlatformAdapter(platformId);
        const { getAllPlatforms } = await import('@/lib/platforms');
        const allPlatforms = getAllPlatforms();

        return NextResponse.json({
            success: true,
            activePlatform: adapter.info,
            allPlatforms,
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message });
    }
}
