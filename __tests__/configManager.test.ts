/**
 * Tests cho configManager - đọc/ghi config files
 */
import fs from 'fs';
import path from 'path';
import { readConfig, writeConfig } from '@/lib/configManager';

// Test trong thư mục tạm
const TEST_CONFIG_DIR = path.join(process.cwd(), 'config');

describe('configManager', () => {
    const testFile = '__test_config__.json';
    const testFilePath = path.join(TEST_CONFIG_DIR, testFile);

    afterEach(() => {
        // Dọn dẹp file test
        try {
            if (fs.existsSync(testFilePath)) {
                fs.unlinkSync(testFilePath);
            }
        } catch { /* ignore */ }
    });

    describe('readConfig', () => {
        test('trả về object rỗng khi file không tồn tại', () => {
            const data = readConfig('__nonexistent_file__.json');
            expect(data).toEqual({});
        });

        test('đọc được file auth.json', () => {
            const data = readConfig('auth.json');
            expect(data).toBeDefined();
            expect(typeof data).toBe('object');
            expect(data).toHaveProperty('activePlatform');
        });

        test('đọc được file setting.json', () => {
            const data = readConfig('setting.json');
            expect(data).toBeDefined();
            expect(typeof data).toBe('object');
        });
    });

    describe('writeConfig', () => {
        test('ghi file mới thành công', () => {
            const testData = { key: 'value', number: 42, nested: { a: 1 } };
            const result = writeConfig(testFile, testData);
            expect(result).toBe(true);
            expect(fs.existsSync(testFilePath)).toBe(true);
        });

        test('dữ liệu ghi ra đọc lại đúng', () => {
            const testData = {
                name: 'test',
                items: ['a', 'b', 'c'],
                deeply: { nested: { value: true } }
            };
            writeConfig(testFile, testData);
            const read = readConfig(testFile);
            expect(read).toEqual(testData);
        });

        test('ghi đè file cũ thành công', () => {
            writeConfig(testFile, { version: 1 });
            writeConfig(testFile, { version: 2 });
            const data = readConfig(testFile);
            expect(data.version).toBe(2);
        });

        test('xử lý dữ liệu Unicode (tiếng Việt)', () => {
            const testData = { message: 'Xin chào bạn! 🔥💕' };
            writeConfig(testFile, testData);
            const read = readConfig(testFile);
            expect(read.message).toBe('Xin chào bạn! 🔥💕');
        });

        test('xử lý mảng rỗng', () => {
            const testData = { items: [] };
            writeConfig(testFile, testData);
            const read = readConfig(testFile);
            expect(read.items).toEqual([]);
        });

        test('xử lý object rỗng', () => {
            writeConfig(testFile, {});
            const read = readConfig(testFile);
            expect(read).toEqual({});
        });
    });

    describe('auth.json structure', () => {
        test('auth.json chứa activePlatform', () => {
            const auth = readConfig('auth.json');
            expect(auth.activePlatform).toBeDefined();
            expect(['tinder', 'bumble', 'badoo']).toContain(auth.activePlatform);
        });

        test('auth.json chứa platforms object', () => {
            const auth = readConfig('auth.json');
            expect(auth.platforms).toBeDefined();
            expect(auth.platforms).toHaveProperty('tinder');
            expect(auth.platforms).toHaveProperty('bumble');
            expect(auth.platforms).toHaveProperty('badoo');
        });

        test('tinder auth có các field cần thiết', () => {
            const auth = readConfig('auth.json');
            const tinder = auth.platforms.tinder;
            expect(tinder).toHaveProperty('x-auth-token');
            expect(tinder).toHaveProperty('app-session-id');
        });

        test('bumble auth có các field cần thiết', () => {
            const auth = readConfig('auth.json');
            const bumble = auth.platforms.bumble;
            expect(bumble).toHaveProperty('cookie');
        });

        test('badoo auth có các field cần thiết', () => {
            const auth = readConfig('auth.json');
            const badoo = auth.platforms.badoo;
            expect(badoo).toHaveProperty('cookie');
        });
    });

    describe('setting.json structure', () => {
        test('setting.json chứa các trường chính', () => {
            const s = readConfig('setting.json');
            // Nếu file tồn tại, kiểm tra cấu trúc
            if (Object.keys(s).length > 0) {
                expect(typeof s.likeRecommendUser).toBe('boolean');
                expect(typeof s.sendMessageToMatchedUser).toBe('boolean');
                expect(Array.isArray(s.message)).toBe(true);
            }
        });
    });
});
