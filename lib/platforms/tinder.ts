import axios from 'axios';
import type {
    PlatformAdapter, PlatformInfo, PlatformAuthConfig, PlatformProfile,
    PlatformRecommendation, PlatformMatch, PlatformMessage, PlatformUser,
    PlatformSettings, LikeResult, SendMessageResult
} from './types';

function buildHeaders(auth: PlatformAuthConfig) {
    return {
        'accept': 'application/json',
        'accept-language': 'vi,vi-VN,en-US,en,zh-CN',
        'app-session-id': auth['app-session-id'] || '',
        'app-session-time-elapsed': auth['app-session-time-elapsed'] || '',
        'app-version': '1070200',
        'dnt': '1',
        'origin': 'https://tinder.com',
        'persistent-device-id': auth['persistent-device-id'] || '',
        'platform': 'web',
        'priority': 'u=1, i',
        'referer': 'https://tinder.com/',
        'sec-ch-ua': '"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'cross-site',
        'tinder-version': '7.2.0',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
        'user-session-id': auth['user-session-id'] || '',
        'user-session-time-elapsed': auth['user-session-time-elapsed'] || '',
        'x-auth-token': auth['x-auth-token'] || '',
        'x-supported-image-formats': 'webp,jpeg'
    };
}

function mapUser(u: any): PlatformUser {
    return {
        id: u._id,
        name: u.name || 'Unknown',
        age: u.birth_date ? Math.floor((Date.now() - new Date(u.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : undefined,
        bio: u.bio || '',
        photos: (u.photos || []).map((p: any) => p.url || p.processedFiles?.[0]?.url || ''),
        distance: u.distance_mi,
        raw: u
    };
}

export class TinderAdapter implements PlatformAdapter {
    readonly info: PlatformInfo = {
        id: 'tinder',
        name: 'Tinder',
        icon: '🔥',
        color: '#fd267a',
        gradient: 'linear-gradient(135deg, #fd267a 0%, #ff6036 100%)',
        website: 'https://tinder.com'
    };

    async validateAuth(auth: PlatformAuthConfig) {
        try {
            const res = await axios.get('https://api.gotinder.com/v2/profile?locale=vi', {
                headers: buildHeaders(auth)
            });
            const name = res.data?.data?.user?.name ?? res.data?.data?.user?.first_name ?? null;
            return { valid: true, name: name || undefined };
        } catch (err: any) {
            if (err.response?.status === 401) {
                return { valid: false, error: 'Token không hợp lệ hoặc hết hạn' };
            }
            return { valid: false, error: err.message };
        }
    }

    async getProfile(auth: PlatformAuthConfig): Promise<PlatformProfile | null> {
        try {
            const res = await axios.get('https://api.gotinder.com/v2/profile?locale=vi', {
                headers: buildHeaders(auth)
            });
            const u = res.data?.data?.user;
            if (!u) return null;
            return {
                id: u._id,
                name: u.name,
                age: u.birth_date ? Math.floor((Date.now() - new Date(u.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : undefined,
                bio: u.bio,
                photos: (u.photos || []).map((p: any) => p.url),
                likesRemaining: u.likes_remaining ?? null,
                raw: u
            };
        } catch { return null; }
    }

    async getRecommendations(auth: PlatformAuthConfig): Promise<PlatformRecommendation[]> {
        try {
            const res = await axios.get('https://api.gotinder.com/v2/recs/core?locale=vi&duos=0', {
                headers: buildHeaders(auth)
            });
            const results = res.data?.data?.results ?? [];
            return results.map((r: any) => ({
                user: mapUser(r.user),
                swipeToken: String(r.s_number ?? ''),
                raw: r
            }));
        } catch { return []; }
    }

    async likeUser(auth: PlatformAuthConfig, userId: string, swipeToken?: string): Promise<LikeResult> {
        try {
            const res = await axios.get(
                `https://api.gotinder.com/like/${userId}?locale=vi&s_number=${swipeToken || ''}`,
                { headers: buildHeaders(auth) }
            );
            const data = res.data;
            // Check rate limit
            if (data.likes_remaining !== undefined && data.likes_remaining <= 0) {
                return { success: false, matched: false, rateLimited: true, message: 'Hết lượt like' };
            }
            if (data.rate_limited_until && data.rate_limited_until > Date.now()) {
                return { success: false, matched: false, rateLimited: true, message: 'Bị rate limit' };
            }
            return { success: true, matched: !!data.match };
        } catch (err: any) {
            return { success: false, matched: false, message: err.message };
        }
    }

    async dislikeUser(auth: PlatformAuthConfig, userId: string) {
        try {
            await axios.get(`https://api.gotinder.com/pass/${userId}?locale=vi`, {
                headers: buildHeaders(auth)
            });
            return { success: true };
        } catch { return { success: false }; }
    }

    async getMatches(auth: PlatformAuthConfig): Promise<PlatformMatch[]> {
        try {
            const res = await axios.get(
                'https://api.gotinder.com/v2/matches?locale=vi&count=60&message=0&is_tinder_u=false',
                { headers: buildHeaders(auth) }
            );
            const matches = res.data?.data?.matches ?? [];
            return matches.map((m: any) => ({
                id: m._id,
                person: mapUser(m.person),
                lastMessage: m.messages?.[0]?.message || '',
                lastMessageTime: m.messages?.[0]?.sent_date || '',
                raw: m
            }));
        } catch { return []; }
    }

    async getMessages(auth: PlatformAuthConfig, matchId: string): Promise<PlatformMessage[]> {
        try {
            const res = await axios.get(
                `https://api.gotinder.com/v2/matches/${matchId}/messages?locale=vi&count=100`,
                { headers: buildHeaders(auth) }
            );
            const meId = auth['meID'] || '';
            const msgs = res.data?.data?.messages ?? [];
            return msgs.map((m: any) => ({
                id: m._id,
                fromMe: m.from === meId,
                text: m.message,
                timestamp: m.sent_date,
                raw: m
            }));
        } catch { return []; }
    }

    async sendMessage(auth: PlatformAuthConfig, matchId: string, text: string): Promise<SendMessageResult> {
        try {
            await axios.post(
                `https://api.gotinder.com/user/matches/${matchId}?locale=vi`,
                { message: text },
                { headers: { ...buildHeaders(auth), 'content-type': 'application/json' } }
            );
            return { success: true };
        } catch (err: any) {
            return { success: false, message: err.message };
        }
    }

    async unmatch(auth: PlatformAuthConfig, matchId: string) {
        try {
            await axios.delete(`https://api.gotinder.com/user/matches/${matchId}?locale=vi`, {
                headers: buildHeaders(auth)
            });
            return { success: true };
        } catch { return { success: false }; }
    }

    async updateLocation(auth: PlatformAuthConfig, lat: number, long: number) {
        try {
            await axios.post('https://api.gotinder.com/v2/meta?locale=vi',
                { lat, long, force_fetch_resources: true },
                { headers: { ...buildHeaders(auth), 'content-type': 'application/json' } }
            );
            return { success: true };
        } catch { return { success: false }; }
    }

    async updatePreferences(auth: PlatformAuthConfig, settings: PlatformSettings) {
        try {
            const gender = settings.gender;
            const interestedInGenders = gender === 'all' ? [0, 1, 2] : [parseInt(gender)];
            await axios.post('https://api.gotinder.com/v2/profile?locale=vi',
                {
                    user: {
                        interested_in_genders: interestedInGenders,
                        age_filter_min: settings.ageFilterMin,
                        age_filter_max: settings.ageFilterMax,
                        distance_filter: settings.distance,
                        auto_expansion: {
                            age_toggle: true,
                            distance_toggle: settings.autoExpandDistance
                        }
                    }
                },
                { headers: { ...buildHeaders(auth), 'content-type': 'application/json' } }
            );
            return { success: true };
        } catch { return { success: false }; }
    }

    getAuthScript(): string {
        return `// 🔥 TINDER AUTH SCRIPT
// 1. Mở tinder.com → đăng nhập → vào trang profile
// 2. F12 → Console → dán script → Enter
// 3. Tải lại trang → copy JSON kết quả

(() => {
  const _fetch = window.fetch;
  window.fetch = async (...args) => {
    const [url, options] = args;
    if (typeof url === "string" && url.includes("api.gotinder.com/v2/profile")) {
      const headers = options?.headers instanceof Headers
        ? Object.fromEntries(options.headers.entries())
        : (options?.headers || {});
      const result = {
        meID: null,
        "app-session-id": headers["app-session-id"] || headers["App-Session-Id"],
        "app-session-time-elapsed": headers["app-session-time-elapsed"] || headers["App-Session-Time-Elapsed"],
        "persistent-device-id": headers["persistent-device-id"] || headers["Persistent-Device-Id"],
        "user-session-id": headers["user-session-id"] || headers["User-Session-Id"],
        "user-session-time-elapsed": headers["user-session-time-elapsed"] || headers["User-Session-Time-Elapsed"],
        "x-auth-token": headers["x-auth-token"] || headers["X-Auth-Token"],
        locale: "vi"
      };
      const response = await _fetch(...args);
      const clone = response.clone();
      try {
        const json = await clone.json();
        result.meID = json?.data?.user?._id || null;
        console.log("📦 TINDER SESSION JSON");
        console.log(JSON.stringify(result, null, 2));
      } catch (e) { console.error("Parse error", e); }
      return response;
    }
    return _fetch(...args);
  };
})();`;
    }
}
