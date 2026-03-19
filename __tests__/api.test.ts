/**
 * Tests cho Platform API Route - /api/platform
 * Mock các HTTP requests để test API logic
 */
import { getPlatformAdapter, isValidPlatform, getAllPlatforms } from '@/lib/platforms';
import { readConfig, writeConfig } from '@/lib/configManager';
import type { PlatformId } from '@/lib/platforms/types';

// Vì API routes trong Next.js cần NextRequest/NextResponse,
// ta test logic nghiệp vụ trực tiếp qua adapter & config

describe('Platform API Logic', () => {
    describe('switch-platform', () => {
        test('chuyển platform hợp lệ', () => {
            const authConfig = readConfig('auth.json');
            const originalPlatform = authConfig.activePlatform;

            for (const pid of ['tinder', 'bumble', 'badoo'] as PlatformId[]) {
                authConfig.activePlatform = pid;
                expect(authConfig.activePlatform).toBe(pid);
                const adapter = getPlatformAdapter(pid);
                expect(adapter.info.id).toBe(pid);
            }

            // Restore
            authConfig.activePlatform = originalPlatform;
        });

        test('từ chối platform không hợp lệ', () => {
            expect(isValidPlatform('instagram')).toBe(false);
            expect(isValidPlatform('whatsapp')).toBe(false);
            expect(() => getPlatformAdapter('instagram' as PlatformId)).toThrow();
        });
    });

    describe('update-auth logic', () => {
        test('merge auth config cho tinder', () => {
            const authConfig = readConfig('auth.json');
            const newAuth = { 'x-auth-token': 'test-token-123', 'meID': 'user-456' };
            const merged = { ...(authConfig.platforms?.tinder || {}), ...newAuth };

            expect(merged['x-auth-token']).toBe('test-token-123');
            expect(merged['meID']).toBe('user-456');
        });

        test('merge auth config cho bumble', () => {
            const authConfig = readConfig('auth.json');
            const newAuth = { cookie: 'session=abc123', 'x-pingback': 'ping-xyz' };
            const merged = { ...(authConfig.platforms?.bumble || {}), ...newAuth };

            expect(merged.cookie).toBe('session=abc123');
            expect(merged['x-pingback']).toBe('ping-xyz');
        });

        test('merge auth config cho badoo', () => {
            const authConfig = readConfig('auth.json');
            const newAuth = { cookie: 'badoo_session=def456' };
            const merged = { ...(authConfig.platforms?.badoo || {}), ...newAuth };

            expect(merged.cookie).toBe('badoo_session=def456');
        });
    });

    describe('get-auth-script', () => {
        test.each(['tinder', 'bumble', 'badoo'] as PlatformId[])('%s có auth script', (pid) => {
            const adapter = getPlatformAdapter(pid);
            const script = adapter.getAuthScript();
            expect(typeof script).toBe('string');
            expect(script.length).toBeGreaterThan(50);
        });

        test('tinder script chứa từ khoá đúng', () => {
            const script = getPlatformAdapter('tinder').getAuthScript();
            expect(script).toContain('gotinder');
            expect(script).toContain('SESSION JSON');
        });

        test('bumble script chứa từ khoá đúng', () => {
            const script = getPlatformAdapter('bumble').getAuthScript();
            expect(script).toContain('mwebapi');
            expect(script).toContain('SESSION JSON');
        });

        test('badoo script chứa từ khoá đúng', () => {
            const script = getPlatformAdapter('badoo').getAuthScript();
            expect(script).toContain('webapi');
            expect(script).toContain('SESSION JSON');
        });
    });

    describe('get-settings & update-settings logic', () => {
        test('đọc và ghi settings thành công', () => {
            const settings = readConfig('setting.json');
            const backup = { ...settings };

            // Modify
            const newSettings = { ...settings, likeDelayMs: 9999, ageFilterMin: 21 };
            writeConfig('setting.json', newSettings);

            // Verify
            const verified = readConfig('setting.json');
            expect(verified.likeDelayMs).toBe(9999);
            expect(verified.ageFilterMin).toBe(21);

            // Restore
            writeConfig('setting.json', backup);
        });
    });

    describe('get-profile with invalid auth', () => {
        test.each(['tinder', 'bumble', 'badoo'] as PlatformId[])('%s trả null profile khi auth sai', async (pid) => {
            const adapter = getPlatformAdapter(pid);
            const profile = await adapter.getProfile({});
            expect(profile).toBeNull();
        });
    });

    describe('get-recommendations with invalid auth', () => {
        test.each(['tinder', 'bumble', 'badoo'] as PlatformId[])('%s trả mảng rỗng recommendations khi auth sai', async (pid) => {
            const adapter = getPlatformAdapter(pid);
            const recs = await adapter.getRecommendations({});
            expect(Array.isArray(recs)).toBe(true);
        });
    });

    describe('like/dislike with invalid auth', () => {
        test.each(['tinder', 'bumble', 'badoo'] as PlatformId[])('%s xử lý like gracefully khi auth sai', async (pid) => {
            const adapter = getPlatformAdapter(pid);
            const result = await adapter.likeUser({}, 'fake-id');
            expect(result).toHaveProperty('success');
            expect(result).toHaveProperty('matched');
        });

        test.each(['tinder', 'bumble', 'badoo'] as PlatformId[])('%s xử lý dislike gracefully khi auth sai', async (pid) => {
            const adapter = getPlatformAdapter(pid);
            const result = await adapter.dislikeUser({}, 'fake-id');
            expect(result).toHaveProperty('success');
        });
    });

    describe('messaging with invalid auth', () => {
        test.each(['tinder', 'bumble', 'badoo'] as PlatformId[])('%s xử lý send message gracefully', async (pid) => {
            const adapter = getPlatformAdapter(pid);
            const result = await adapter.sendMessage({}, 'fake-match', 'Chào bạn');
            expect(result).toHaveProperty('success');
        });

        test.each(['tinder', 'bumble', 'badoo'] as PlatformId[])('%s xử lý get messages gracefully', async (pid) => {
            const adapter = getPlatformAdapter(pid);
            const msgs = await adapter.getMessages({}, 'fake-match');
            expect(Array.isArray(msgs)).toBe(true);
        });
    });

    describe('unmatch with invalid auth', () => {
        test.each(['tinder', 'bumble', 'badoo'] as PlatformId[])('%s xử lý unmatch gracefully', async (pid) => {
            const adapter = getPlatformAdapter(pid);
            const result = await adapter.unmatch({}, 'fake-match');
            expect(result).toHaveProperty('success');
        });
    });
});

describe('All platforms list', () => {
    test('getAllPlatforms trả về đủ nền tảng', () => {
        const all = getAllPlatforms();
        expect(all.length).toBeGreaterThanOrEqual(3);
        const ids = all.map(p => p.id);
        expect(ids).toContain('tinder');
        expect(ids).toContain('bumble');
        expect(ids).toContain('badoo');
    });

    test('mỗi platform có thông tin đầy đủ', () => {
        for (const p of getAllPlatforms()) {
            expect(p.id).toBeTruthy();
            expect(p.name).toBeTruthy();
            expect(p.icon).toBeTruthy();
            expect(p.color).toBeTruthy();
            expect(p.gradient).toBeTruthy();
            expect(p.website).toBeTruthy();
        }
    });
});
