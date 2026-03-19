import axios from 'axios';
import type {
    PlatformAdapter, PlatformInfo, PlatformAuthConfig, PlatformProfile,
    PlatformRecommendation, PlatformMatch, PlatformMessage, PlatformUser,
    PlatformSettings, LikeResult, SendMessageResult
} from './types';

// Badoo uses same engine as Bumble but different domain
const BADOO_API = 'https://badoo.com/webapi.phtml';
const BADOO_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36';

function buildHeaders(auth: PlatformAuthConfig) {
    return {
        'accept': 'application/json',
        'content-type': 'application/json',
        'user-agent': BADOO_UA,
        'x-pingback': auth['x-pingback'] || '',
        'cookie': auth['cookie'] || '',
        'origin': 'https://badoo.com',
        'referer': 'https://badoo.com/',
    };
}

async function badooRequest(auth: PlatformAuthConfig, body: any) {
    const headers = buildHeaders(auth);
    const res = await axios.post(BADOO_API, body, {
        headers,
        timeout: 15000,
    });
    return res.data;
}

function extractPhotoUrl(photo: any): string {
    if (!photo) return '';
    if (photo.large_url) return photo.large_url;
    if (photo.large_photo_url) return photo.large_photo_url;
    if (photo.preview_url) return photo.preview_url;
    return '';
}

function mapUser(u: any): PlatformUser {
    const photos: string[] = [];
    if (u.user_photos) {
        for (const p of u.user_photos) {
            const url = extractPhotoUrl(p);
            if (url) photos.push(url);
        }
    }
    if (u.profile_photo) {
        const url = extractPhotoUrl(u.profile_photo);
        if (url && !photos.includes(url)) photos.unshift(url);
    }
    return {
        id: String(u.user_id || u.uid || ''),
        name: u.name || u.display_name || 'Unknown',
        age: u.age,
        bio: u.about || u.profile_summary || '',
        photos,
        distance: u.distance_long,
        raw: u
    };
}

export class BadooAdapter implements PlatformAdapter {
    readonly info: PlatformInfo = {
        id: 'badoo',
        name: 'Badoo',
        icon: '💜',
        color: '#783bf9',
        gradient: 'linear-gradient(135deg, #783bf9 0%, #aa6dfa 100%)',
        website: 'https://badoo.com'
    };

    async validateAuth(auth: PlatformAuthConfig) {
        try {
            const data = await badooRequest(auth, {
                version: 1,
                message_type: 403,
                server_get_user: {
                    user_field_filter: {
                        projection: [210, 370, 200, 230, 490, 540, 530, 560, 291, 890]
                    }
                }
            });
            const user = data?.body?.[0]?.client_user?.user;
            if (user) {
                return { valid: true, name: user.name || user.display_name };
            }
            return { valid: false, error: 'Không thể xác thực' };
        } catch (err: any) {
            return { valid: false, error: err.message };
        }
    }

    async getProfile(auth: PlatformAuthConfig): Promise<PlatformProfile | null> {
        try {
            const data = await badooRequest(auth, {
                version: 1,
                message_type: 403,
                server_get_user: {
                    user_field_filter: {
                        projection: [210, 370, 200, 230, 490, 540, 530, 560, 291, 890]
                    }
                }
            });
            const u = data?.body?.[0]?.client_user?.user;
            if (!u) return null;
            const mapped = mapUser(u);
            return { ...mapped, likesRemaining: null };
        } catch { return null; }
    }

    async getRecommendations(auth: PlatformAuthConfig): Promise<PlatformRecommendation[]> {
        try {
            const data = await badooRequest(auth, {
                version: 1,
                message_type: 81,
                server_get_encounters: {
                    number: 20,
                    context: 1,
                    user_field_filter: {
                        projection: [210, 370, 200, 230, 490, 540, 530, 560, 291]
                    }
                }
            });
            const results = data?.body?.[0]?.client_encounters?.results || [];
            return results.map((r: any) => ({
                user: mapUser(r.user),
                swipeToken: String(r.user?.user_id || ''),
                raw: r
            }));
        } catch { return []; }
    }

    async likeUser(auth: PlatformAuthConfig, userId: string): Promise<LikeResult> {
        try {
            const data = await badooRequest(auth, {
                version: 1,
                message_type: 80,
                server_encounters_vote: {
                    person_id: userId,
                    vote: 2,
                    vote_source: 1
                }
            });
            const matched = data?.body?.[0]?.client_vote_response?.vote_response_type === 2;
            return { success: true, matched };
        } catch (err: any) {
            return { success: false, matched: false, message: err.message };
        }
    }

    async dislikeUser(auth: PlatformAuthConfig, userId: string) {
        try {
            await badooRequest(auth, {
                version: 1,
                message_type: 80,
                server_encounters_vote: {
                    person_id: userId,
                    vote: 1,
                    vote_source: 1
                }
            });
            return { success: true };
        } catch { return { success: false }; }
    }

    async getMatches(auth: PlatformAuthConfig): Promise<PlatformMatch[]> {
        try {
            const data = await badooRequest(auth, {
                version: 1,
                message_type: 245,
                server_get_user_list: {
                    user_field_filter: {
                        projection: [210, 370, 200, 230, 490, 540, 530, 560, 291]
                    },
                    preferred_count: 50,
                    folder_id: 0
                }
            });
            const sections = data?.body?.[0]?.client_user_list?.section || [];
            const matches: PlatformMatch[] = [];
            for (const section of sections) {
                const users = section.users || [];
                for (const u of users) {
                    matches.push({
                        id: String(u.user_id || ''),
                        person: mapUser(u),
                        lastMessage: u.their_last_message?.text || u.my_last_message?.text || '',
                        lastMessageTime: '',
                        raw: u
                    });
                }
            }
            return matches;
        } catch { return []; }
    }

    async getMessages(auth: PlatformAuthConfig, matchId: string): Promise<PlatformMessage[]> {
        try {
            const data = await badooRequest(auth, {
                version: 1,
                message_type: 102,
                server_open_chat: {
                    user_id: matchId
                }
            });
            const msgs = data?.body?.[0]?.client_chat_messages?.messages || [];
            const profile = await this.getProfile(auth);
            const meId = profile?.id || '';
            return msgs.map((m: any) => ({
                id: String(m.id || m.message_id || Date.now()),
                fromMe: String(m.from_person_id) === meId,
                text: m.text || m.mssg || '',
                timestamp: m.date_created || '',
                raw: m
            }));
        } catch { return []; }
    }

    async sendMessage(auth: PlatformAuthConfig, matchId: string, text: string): Promise<SendMessageResult> {
        try {
            await badooRequest(auth, {
                version: 1,
                message_type: 104,
                server_send_chat_message: {
                    user_id: matchId,
                    mssg: text,
                    type: 1
                }
            });
            return { success: true };
        } catch (err: any) {
            return { success: false, message: err.message };
        }
    }

    async unmatch(auth: PlatformAuthConfig, matchId: string) {
        try {
            await badooRequest(auth, {
                version: 1,
                message_type: 253,
                server_block_user: {
                    user_id: matchId,
                    block_type: 1
                }
            });
            return { success: true };
        } catch { return { success: false }; }
    }

    getAuthScript(): string {
        return `// 💜 BADOO AUTH SCRIPT
// 1. Mở badoo.com → đăng nhập
// 2. F12 → Console → dán script → Enter
// 3. Thao tác trên trang (lướt, like...) → copy JSON kết quả

(() => {
  const _fetch = window.fetch;
  window.fetch = async (...args) => {
    const [url, options] = args;
    if (typeof url === "string" && url.includes("webapi.phtml")) {
      const cookie = document.cookie;
      const headers = options?.headers instanceof Headers
        ? Object.fromEntries(options.headers.entries())
        : (options?.headers || {});
      const result = {
        cookie: cookie,
        "x-pingback": headers["x-pingback"] || headers["X-Pingback"] || ""
      };
      console.log("📦 BADOO SESSION JSON");
      console.log(JSON.stringify(result, null, 2));
      window.__BADOO_SESSION__ = result;
    }
    return _fetch(...args);
  };
})();`;
    }
}
