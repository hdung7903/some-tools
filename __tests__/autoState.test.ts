/**
 * Tests cho autoState - quản lý trạng thái tự động
 */
import { autoState } from '@/lib/autoState';

describe('autoState', () => {
    // Reset trạng thái trước mỗi test
    beforeEach(() => {
        autoState.stopAll();
    });

    test('mặc định isAutoRunning = false', () => {
        expect(autoState.isAutoRunning).toBe(false);
    });

    test('có thể set isAutoRunning = true', () => {
        autoState.isAutoRunning = true;
        expect(autoState.isAutoRunning).toBe(true);
    });

    test('khi set isAutoRunning = false thì xoá sentMessages', () => {
        autoState.isAutoRunning = true;
        autoState.markMessageSent('match-1');
        autoState.markMessageSent('match-2');
        expect(autoState.hasSentMessage('match-1')).toBe(true);

        autoState.isAutoRunning = false;
        expect(autoState.hasSentMessage('match-1')).toBe(false);
        expect(autoState.hasSentMessage('match-2')).toBe(false);
    });

    test('markMessageSent và hasSentMessage hoạt động đúng', () => {
        expect(autoState.hasSentMessage('match-abc')).toBe(false);
        autoState.markMessageSent('match-abc');
        expect(autoState.hasSentMessage('match-abc')).toBe(true);
        expect(autoState.hasSentMessage('match-xyz')).toBe(false);
    });

    test('có thể đánh dấu nhiều match đã gửi', () => {
        autoState.markMessageSent('m1');
        autoState.markMessageSent('m2');
        autoState.markMessageSent('m3');
        expect(autoState.hasSentMessage('m1')).toBe(true);
        expect(autoState.hasSentMessage('m2')).toBe(true);
        expect(autoState.hasSentMessage('m3')).toBe(true);
        expect(autoState.hasSentMessage('m4')).toBe(false);
    });

    test('currentDistanceFilter mặc định = 0', () => {
        expect(autoState.currentDistanceFilter).toBe(0);
    });

    test('có thể set currentDistanceFilter', () => {
        autoState.currentDistanceFilter = 25;
        expect(autoState.currentDistanceFilter).toBe(25);
    });

    test('autoLikeInterval mặc định = null', () => {
        expect(autoState.autoLikeInterval).toBeNull();
    });

    test('autoMessageInterval mặc định = null', () => {
        expect(autoState.autoMessageInterval).toBeNull();
    });

    test('autoLikeCatalogInterval mặc định = null', () => {
        expect(autoState.autoLikeCatalogInterval).toBeNull();
    });

    test('có thể set và clear interval', () => {
        const id = setInterval(() => { }, 1000);
        autoState.autoLikeInterval = id;
        expect(autoState.autoLikeInterval).toBe(id);
        clearInterval(id);
        autoState.autoLikeInterval = null;
        expect(autoState.autoLikeInterval).toBeNull();
    });

    test('stopAll reset tất cả trạng thái', () => {
        // Setup
        autoState.isAutoRunning = true;
        autoState.markMessageSent('m1');
        autoState.currentDistanceFilter = 50;
        const interval1 = setInterval(() => { }, 1000);
        const interval2 = setInterval(() => { }, 1000);
        const interval3 = setInterval(() => { }, 1000);
        autoState.autoLikeInterval = interval1;
        autoState.autoLikeCatalogInterval = interval2;
        autoState.autoMessageInterval = interval3;

        // Act
        autoState.stopAll();

        // Assert
        expect(autoState.isAutoRunning).toBe(false);
        expect(autoState.hasSentMessage('m1')).toBe(false);
        expect(autoState.currentDistanceFilter).toBe(0);
        expect(autoState.autoLikeInterval).toBeNull();
        expect(autoState.autoLikeCatalogInterval).toBeNull();
        expect(autoState.autoMessageInterval).toBeNull();
    });

    test('stopAll an toàn khi gọi nhiều lần liên tiếp', () => {
        autoState.isAutoRunning = true;
        autoState.stopAll();
        autoState.stopAll();
        autoState.stopAll();
        expect(autoState.isAutoRunning).toBe(false);
    });

    test('stopAll an toàn khi interval đã null', () => {
        autoState.autoLikeInterval = null;
        autoState.autoMessageInterval = null;
        expect(() => autoState.stopAll()).not.toThrow();
    });
});
