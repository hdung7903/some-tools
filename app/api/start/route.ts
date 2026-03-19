import { NextResponse } from 'next/server';
import { readConfig } from '@/lib/configManager';
import { autoState } from '@/lib/autoState';
import { getPlatformAdapter, isValidPlatform } from '@/lib/platforms';
import type { PlatformId } from '@/lib/platforms/types';

function parseMessageLine(lines: string[], name: string): string | null {
    const line = lines[Math.floor(Math.random() * lines.length)]?.replace(/\r/g, '').trim();
    if (!line) return null;
    return line.replace(/\{\{name\}\}/g, name);
}

export async function POST() {
    try {
        if (autoState.isAutoRunning) {
            return NextResponse.json({ success: false, message: 'Đã đang chạy tự động' });
        }

        const settings = readConfig('setting.json');
        const authConfig = readConfig('auth.json');
        const platformId = (authConfig.activePlatform || 'tinder') as PlatformId;

        if (!isValidPlatform(platformId)) {
            return NextResponse.json({ success: false, message: 'Platform không hợp lệ' });
        }

        const adapter = getPlatformAdapter(platformId);
        const auth = authConfig.platforms?.[platformId] || {};

        // Validate auth
        const validation = await adapter.validateAuth(auth);
        if (!validation.valid) {
            return NextResponse.json({ success: false, message: validation.error || 'Vui lòng cập nhật thông tin xác thực' });
        }

        // Update location if supported
        const hasValidLocation = (settings.location?.lat !== 0 || settings.location?.long !== 0)
            && Number.isFinite(settings.location?.lat) && Number.isFinite(settings.location?.long);
        if (hasValidLocation && adapter.updateLocation) {
            try {
                await adapter.updateLocation(auth, settings.location.lat, settings.location.long);
            } catch (err: any) {
                console.error('Lỗi cập nhật vị trí:', err.message);
            }
        }

        // Update preferences if supported
        if (adapter.updatePreferences) {
            try {
                await adapter.updatePreferences(auth, {
                    likeRecommendUser: settings.likeRecommendUser ?? true,
                    sendMessageToMatchedUser: settings.sendMessageToMatchedUser ?? true,
                    message: settings.message || [],
                    location: settings.location || { lat: 0, long: 0 },
                    distance: settings.unMatch?.distance ?? 10,
                    distanceMax: settings.autoExpandDistanceMax ?? 50,
                    autoExpandDistance: settings.autoExpandDistance ?? true,
                    ageFilterMin: settings.ageFilterMin ?? 18,
                    ageFilterMax: settings.ageFilterMax ?? 30,
                    gender: settings.unMatch?.gender ?? '1',
                    likeDelayMs: settings.likeDelayMs ?? 3000,
                    messageDelayMs: settings.messageDelayMs ?? 5000,
                });
            } catch (err: any) {
                console.error('Lỗi cập nhật preferences:', err.message);
            }
        }

        // Test getting recommendations
        try {
            await adapter.getRecommendations(auth);
        } catch (error: any) {
            return NextResponse.json({ success: false, message: `Lỗi API ${adapter.info.name}: ${error.message}` });
        }

        // Check settings
        if (!settings.likeRecommendUser && !settings.sendMessageToMatchedUser) {
            return NextResponse.json({ success: false, message: 'Vui lòng bật ít nhất một chức năng tự động' });
        }

        autoState.isAutoRunning = true;

        // Auto like recommendations
        if (settings.likeRecommendUser) {
            autoState.autoLikeInterval = setInterval(async () => {
                if (!autoState.isAutoRunning) {
                    if (autoState.autoLikeInterval) clearInterval(autoState.autoLikeInterval);
                    return;
                }
                try {
                    const freshAuth = readConfig('auth.json');
                    const currentAuth = freshAuth.platforms?.[platformId] || {};
                    const recs = await adapter.getRecommendations(currentAuth);

                    if (recs.length > 0) {
                        for (const rec of recs) {
                            if (!autoState.isAutoRunning) break;
                            try {
                                const result = await adapter.likeUser(currentAuth, rec.user.id, rec.swipeToken);
                                if (result.rateLimited) {
                                    console.warn(`[${adapter.info.name}] Rate limited! Dừng auto.`);
                                    autoState.stopAll();
                                    break;
                                }
                                if (result.success) {
                                    const matchText = result.matched ? ' 🎉 MATCH!' : '';
                                    console.log(`✅ [${adapter.info.name}] Đã like: ${rec.user.name}${matchText}`);
                                }
                                const likeDelay = Math.max(0, Math.min(60000, settings.likeDelayMs ?? 3000));
                                await new Promise(resolve => setTimeout(resolve, likeDelay));
                            } catch (error: any) {
                                console.error(`Lỗi like ${rec.user.name}:`, error.message);
                            }
                        }
                    } else {
                        console.log(`[${adapter.info.name}] Không tìm thấy người dùng mới`);
                    }
                } catch (error: any) {
                    console.error('Lỗi khi lấy recommendations:', error.message);
                }
            }, 15000);
        }

        // Auto send messages
        if (settings.sendMessageToMatchedUser) {
            autoState.autoMessageInterval = setInterval(async () => {
                if (!autoState.isAutoRunning) {
                    if (autoState.autoMessageInterval) clearInterval(autoState.autoMessageInterval);
                    return;
                }
                try {
                    const freshAuth = readConfig('auth.json');
                    const currentAuth = freshAuth.platforms?.[platformId] || {};
                    const matches = await adapter.getMatches(currentAuth);

                    for (const match of matches) {
                        if (!autoState.isAutoRunning) break;
                        if (autoState.hasSentMessage(match.id)) continue;

                        // Skip if already has messages from us
                        if (match.lastMessage) {
                            autoState.markMessageSent(match.id);
                            continue;
                        }

                        try {
                            if (!settings.message || settings.message.length === 0) continue;
                            const parsed = parseMessageLine(settings.message, match.person.name);
                            if (!parsed) continue;

                            const result = await adapter.sendMessage(currentAuth, match.id, parsed);
                            if (result.success) {
                                autoState.markMessageSent(match.id);
                                console.log(`💬 [${adapter.info.name}] Đã gửi tin nhắn cho: ${match.person.name} - "${parsed}"`);
                            }

                            const msgDelay = Math.max(0, Math.min(120000, settings.messageDelayMs ?? 5000));
                            await new Promise(resolve => setTimeout(resolve, msgDelay));
                        } catch (error: any) {
                            console.error(`Lỗi gửi tin nhắn cho ${match.person.name}:`, error.message);
                            autoState.markMessageSent(match.id);
                        }
                    }
                } catch (error: any) {
                    console.error('Lỗi khi lấy matches:', error.message);
                }
            }, 30000);
        }

        const parts = [];
        if (settings.likeRecommendUser) parts.push('like');
        if (settings.sendMessageToMatchedUser) parts.push('gửi tin nhắn');
        const message = `[${adapter.info.name}] Đã bắt đầu tự động ${parts.join(' và ')}`;

        return NextResponse.json({ success: true, message, platform: adapter.info });
    } catch (error: any) {
        console.error('Lỗi khi bắt đầu tự động:', error);
        return NextResponse.json({ success: false, message: 'Lỗi: ' + error.message });
    }
}

export async function GET() {
    return NextResponse.json({ isAutoRunning: autoState.isAutoRunning });
}
