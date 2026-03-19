// ================================================
//   🔥 TINDER SUPER TOOL AUTH DEVTOOLS SCRIPT 🔥
//   Hướng dẫn sử dụng:
//   1. Mở Tinder web, đăng nhập và vào trang hồ sơ cá nhân.
//   2. Mở DevTools Console (F12 hoặc Ctrl+Shift+I).
//   3. Dán toàn bộ script này rồi Enter.
//   4. Tải lại trang để trigger fetch.
//   5. Copy kết quả JSON "📦 TINDER SESSION JSON" để cấu hình.
// ================================================

(() => {
    const _fetch = window.fetch;

    window.fetch = async (...args) => {
        const [url, options] = args;

        if (typeof url === "string" && url.includes("api.gotinder.com/v2/profile")) {
            const headers =
                options?.headers instanceof Headers
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

                window.__TINDER_SESSION__ = result;
            } catch (e) {
                console.error("Parse response error", e);
            }

            return response;
        }

        return _fetch(...args);
    };
})();
