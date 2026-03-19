import type { PlatformAdapter, PlatformId, PlatformInfo } from './types';
import { TinderAdapter } from './tinder';
import { BumbleAdapter } from './bumble';
import { BadooAdapter } from './badoo';

// Registry of all platform adapters
const adapters: Record<PlatformId, PlatformAdapter> = {
    tinder: new TinderAdapter(),
    bumble: new BumbleAdapter(),
    badoo: new BadooAdapter(),
};

/**
 * Get the adapter for a given platform
 */
export function getPlatformAdapter(platformId: PlatformId): PlatformAdapter {
    const adapter = adapters[platformId];
    if (!adapter) {
        throw new Error(`Platform "${platformId}" is not supported`);
    }
    return adapter;
}

/**
 * Get list of all supported platforms
 */
export function getAllPlatforms(): PlatformInfo[] {
    return Object.values(adapters).map(a => a.info);
}

/**
 * Check if a platform ID is valid
 */
export function isValidPlatform(id: string): id is PlatformId {
    return id in adapters;
}

export { TinderAdapter, BumbleAdapter, BadooAdapter };
export type { PlatformAdapter, PlatformId, PlatformInfo };
