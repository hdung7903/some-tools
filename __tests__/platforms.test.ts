/**
 * Tests cho Platform Types & Registry
 */
import { getPlatformAdapter, getAllPlatforms, isValidPlatform } from '@/lib/platforms';
import { TinderAdapter } from '@/lib/platforms/tinder';
import { BumbleAdapter } from '@/lib/platforms/bumble';
import { BadooAdapter } from '@/lib/platforms/badoo';
import type { PlatformId, PlatformAdapter, PlatformInfo } from '@/lib/platforms/types';

describe('Platform Registry', () => {
    test('getAllPlatforms trả về 3 nền tảng', () => {
        const platforms = getAllPlatforms();
        expect(platforms).toHaveLength(3);
        expect(platforms.map(p => p.id)).toEqual(['tinder', 'bumble', 'badoo']);
    });

    test('isValidPlatform kiểm tra đúng platform hợp lệ', () => {
        expect(isValidPlatform('tinder')).toBe(true);
        expect(isValidPlatform('bumble')).toBe(true);
        expect(isValidPlatform('badoo')).toBe(true);
        expect(isValidPlatform('facebook')).toBe(false);
        expect(isValidPlatform('')).toBe(false);
        expect(isValidPlatform('TINDER')).toBe(false);
    });

    test('getPlatformAdapter trả về adapter đúng loại', () => {
        const tinder = getPlatformAdapter('tinder');
        expect(tinder).toBeInstanceOf(TinderAdapter);
        expect(tinder.info.id).toBe('tinder');

        const bumble = getPlatformAdapter('bumble');
        expect(bumble).toBeInstanceOf(BumbleAdapter);
        expect(bumble.info.id).toBe('bumble');

        const badoo = getPlatformAdapter('badoo');
        expect(badoo).toBeInstanceOf(BadooAdapter);
        expect(badoo.info.id).toBe('badoo');
    });

    test('getPlatformAdapter ném lỗi cho platform không hợp lệ', () => {
        expect(() => getPlatformAdapter('facebook' as PlatformId)).toThrow('not supported');
    });
});

describe('Platform Info', () => {
    const allPlatforms = getAllPlatforms();

    test.each(allPlatforms)('$name có đầy đủ thông tin', (platform: PlatformInfo) => {
        expect(platform.id).toBeTruthy();
        expect(platform.name).toBeTruthy();
        expect(platform.icon).toBeTruthy();
        expect(platform.color).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(platform.gradient).toContain('linear-gradient');
        expect(platform.website).toMatch(/^https?:\/\//);
    });
});

describe('Tinder Adapter', () => {
    const adapter = new TinderAdapter();

    test('info có đầy đủ properties', () => {
        expect(adapter.info).toEqual({
            id: 'tinder',
            name: 'Tinder',
            icon: '🔥',
            color: '#fd267a',
            gradient: expect.stringContaining('linear-gradient'),
            website: 'https://tinder.com'
        });
    });

    test('getAuthScript trả về script hợp lệ', () => {
        const script = adapter.getAuthScript();
        expect(script).toContain('TINDER AUTH SCRIPT');
        expect(script).toContain('api.gotinder.com');
        expect(script).toContain('x-auth-token');
        expect(script).toContain('window.fetch');
    });

    test('validateAuth trả về invalid khi token rỗng', async () => {
        const result = await adapter.validateAuth({});
        expect(result.valid).toBe(false);
    });

    test('getRecommendations trả về mảng rỗng khi auth sai', async () => {
        const recs = await adapter.getRecommendations({});
        expect(Array.isArray(recs)).toBe(true);
        expect(recs).toHaveLength(0);
    });

    test('getMatches trả về mảng rỗng khi auth sai', async () => {
        const matches = await adapter.getMatches({});
        expect(Array.isArray(matches)).toBe(true);
        expect(matches).toHaveLength(0);
    });

    test('getProfile trả về null khi auth sai', async () => {
        const profile = await adapter.getProfile({});
        expect(profile).toBeNull();
    });

    test('likeUser trả về lỗi khi auth sai', async () => {
        const result = await adapter.likeUser({}, 'fake-user-id');
        expect(result.success).toBe(false);
    });

    test('dislikeUser trả về lỗi khi auth sai', async () => {
        const result = await adapter.dislikeUser({}, 'fake-user-id');
        expect(result.success).toBe(false);
    });

    test('sendMessage trả về lỗi khi auth sai', async () => {
        const result = await adapter.sendMessage({}, 'fake-match-id', 'Hello');
        expect(result.success).toBe(false);
    });

    test('unmatch trả về lỗi khi auth sai', async () => {
        const result = await adapter.unmatch({}, 'fake-match-id');
        expect(result.success).toBe(false);
    });

    test('getMessages trả về mảng rỗng khi auth sai', async () => {
        const msgs = await adapter.getMessages({}, 'fake-match-id');
        expect(Array.isArray(msgs)).toBe(true);
        expect(msgs).toHaveLength(0);
    });

    test('adapter có đầy đủ các method bắt buộc', () => {
        expect(typeof adapter.validateAuth).toBe('function');
        expect(typeof adapter.getProfile).toBe('function');
        expect(typeof adapter.getRecommendations).toBe('function');
        expect(typeof adapter.likeUser).toBe('function');
        expect(typeof adapter.dislikeUser).toBe('function');
        expect(typeof adapter.getMatches).toBe('function');
        expect(typeof adapter.getMessages).toBe('function');
        expect(typeof adapter.sendMessage).toBe('function');
        expect(typeof adapter.unmatch).toBe('function');
        expect(typeof adapter.getAuthScript).toBe('function');
    });

    test('adapter có các method tuỳ chọn', () => {
        expect(typeof adapter.updateLocation).toBe('function');
        expect(typeof adapter.updatePreferences).toBe('function');
    });
});

describe('Bumble Adapter', () => {
    const adapter = new BumbleAdapter();

    test('info có đầy đủ properties', () => {
        expect(adapter.info).toEqual({
            id: 'bumble',
            name: 'Bumble',
            icon: '🐝',
            color: '#ffc629',
            gradient: expect.stringContaining('linear-gradient'),
            website: 'https://bumble.com'
        });
    });

    test('getAuthScript trả về script hợp lệ', () => {
        const script = adapter.getAuthScript();
        expect(script).toContain('BUMBLE AUTH SCRIPT');
        expect(script).toContain('mwebapi.phtml');
        expect(script).toContain('cookie');
    });

    test('validateAuth trả về invalid khi cookie rỗng', async () => {
        const result = await adapter.validateAuth({});
        expect(result.valid).toBe(false);
    });

    test('getRecommendations trả về mảng rỗng khi auth sai', async () => {
        const recs = await adapter.getRecommendations({});
        expect(Array.isArray(recs)).toBe(true);
    });

    test('adapter có đầy đủ các method bắt buộc', () => {
        expect(typeof adapter.validateAuth).toBe('function');
        expect(typeof adapter.getProfile).toBe('function');
        expect(typeof adapter.getRecommendations).toBe('function');
        expect(typeof adapter.likeUser).toBe('function');
        expect(typeof adapter.dislikeUser).toBe('function');
        expect(typeof adapter.getMatches).toBe('function');
        expect(typeof adapter.getMessages).toBe('function');
        expect(typeof adapter.sendMessage).toBe('function');
        expect(typeof adapter.unmatch).toBe('function');
        expect(typeof adapter.getAuthScript).toBe('function');
    });
});

describe('Badoo Adapter', () => {
    const adapter = new BadooAdapter();

    test('info có đầy đủ properties', () => {
        expect(adapter.info).toEqual({
            id: 'badoo',
            name: 'Badoo',
            icon: '💜',
            color: '#783bf9',
            gradient: expect.stringContaining('linear-gradient'),
            website: 'https://badoo.com'
        });
    });

    test('getAuthScript trả về script hợp lệ', () => {
        const script = adapter.getAuthScript();
        expect(script).toContain('BADOO AUTH SCRIPT');
        expect(script).toContain('webapi.phtml');
        expect(script).toContain('cookie');
    });

    test('validateAuth trả về invalid khi cookie rỗng', async () => {
        const result = await adapter.validateAuth({});
        expect(result.valid).toBe(false);
    });

    test('adapter có đầy đủ các method bắt buộc', () => {
        expect(typeof adapter.validateAuth).toBe('function');
        expect(typeof adapter.getProfile).toBe('function');
        expect(typeof adapter.getRecommendations).toBe('function');
        expect(typeof adapter.likeUser).toBe('function');
        expect(typeof adapter.dislikeUser).toBe('function');
        expect(typeof adapter.getMatches).toBe('function');
        expect(typeof adapter.getMessages).toBe('function');
        expect(typeof adapter.sendMessage).toBe('function');
        expect(typeof adapter.unmatch).toBe('function');
        expect(typeof adapter.getAuthScript).toBe('function');
    });
});

describe('Platform Adapter Interface Compliance', () => {
    const adapters: PlatformAdapter[] = [
        new TinderAdapter(),
        new BumbleAdapter(),
        new BadooAdapter(),
    ];

    test.each(adapters.map(a => [a.info.name, a]))('%s implements PlatformAdapter', (_, adapter) => {
        const a = adapter as PlatformAdapter;
        // Check all required methods exist
        const requiredMethods = [
            'validateAuth', 'getProfile', 'getRecommendations',
            'likeUser', 'dislikeUser', 'getMatches',
            'getMessages', 'sendMessage', 'unmatch', 'getAuthScript'
        ];
        for (const method of requiredMethods) {
            expect(typeof (a as any)[method]).toBe('function');
        }
        // Check info structure
        expect(a.info.id).toBeTruthy();
        expect(a.info.name).toBeTruthy();
    });
});
