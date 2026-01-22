(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/contexts/SocketContext.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SocketProvider",
    ()=>SocketProvider,
    "useSocket",
    ()=>useSocket
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$socket$2e$io$2d$client$2f$build$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/socket.io-client/build/esm/index.js [app-client] (ecmascript) <locals>");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
const SocketContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])({
    socket: null,
    isConnected: false
});
function useSocket() {
    _s();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(SocketContext);
}
_s(useSocket, "gDsCjeeItUuvgOWf1v4qoK9RF6k=");
// Singleton socket instance to prevent multiple connections
let globalSocket = null;
function SocketProvider({ children }) {
    _s1();
    const [socket, setSocket] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isConnected, setIsConnected] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const initRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SocketProvider.useEffect": ()=>{
            // Prevent double initialization in strict mode
            if (initRef.current) return;
            initRef.current = true;
            // Reuse existing socket or create new one
            if (!globalSocket) {
                // Determine socket URL based on environment
                let socketUrl;
                if ("TURBOPACK compile-time truthy", 1) {
                    // Client-side: check if we're on localhost
                    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                    console.log('🔍 URL Construction Debug:');
                    console.log('  - window.location.hostname:', window.location.hostname);
                    console.log('  - window.location.origin:', window.location.origin);
                    console.log('  - isLocalhost:', isLocalhost);
                    console.log('  - NEXT_PUBLIC_WS_URL env var:', ("TURBOPACK compile-time value", "ws://localhost:3000"));
                    console.log('  - Raw NEXT_PUBLIC_WS_URL:', JSON.stringify(("TURBOPACK compile-time value", "ws://localhost:3000")));
                    if (isLocalhost) {
                        // Local development
                        socketUrl = 'http://localhost:3000';
                        console.log('  ✅ Using localhost URL:', socketUrl);
                    } else if ("TURBOPACK compile-time truthy", 1) {
                        // Production: Use Railway backend
                        // Add https:// if not present
                        const wsUrl = ("TURBOPACK compile-time value", "ws://localhost:3000");
                        console.log('  - Raw wsUrl before processing:', wsUrl);
                        socketUrl = wsUrl.startsWith('http') ? wsUrl : `https://${wsUrl}`;
                        console.log('  ✅ Using Railway backend URL:', socketUrl);
                    } else //TURBOPACK unreachable
                    ;
                } else //TURBOPACK unreachable
                ;
                console.log('🔌 Final Socket Connection Config:');
                console.log('  - Final Target URL:', socketUrl);
                console.log('  - Environment:', ("TURBOPACK compile-time value", "development"));
                console.log('  - Protocol:', socketUrl.split('://')[0]);
                console.log('  - Host:', socketUrl.split('://')[1]);
                // Configure transports based on environment
                // Railway can be flaky with WebSocket upgrades, so we force polling in production
                const isProduction = !socketUrl.includes('localhost');
                globalSocket = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$socket$2e$io$2d$client$2f$build$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["io"])(socketUrl, {
                    path: '/socket.io',
                    reconnection: true,
                    reconnectionDelay: 1000,
                    reconnectionDelayMax: 5000,
                    reconnectionAttempts: 10,
                    // Force polling-only in production (Railway), allow upgrade in dev
                    transports: isProduction ? [
                        'polling'
                    ] : [
                        'polling',
                        'websocket'
                    ],
                    upgrade: !isProduction,
                    timeout: 20000,
                    autoConnect: true,
                    withCredentials: true,
                    forceNew: false,
                    multiplex: true
                });
                console.log('  - Transport mode:', isProduction ? 'polling-only (production)' : 'polling + websocket (dev)');
                globalSocket.on('connect', {
                    "SocketProvider.useEffect": ()=>{
                        console.log('Socket connected:', globalSocket?.id);
                        setIsConnected(true);
                    }
                }["SocketProvider.useEffect"]);
                globalSocket.on('disconnect', {
                    "SocketProvider.useEffect": (reason)=>{
                        console.log('Socket disconnected:', reason);
                        setIsConnected(false);
                    }
                }["SocketProvider.useEffect"]);
                globalSocket.on('connect_error', {
                    "SocketProvider.useEffect": (error)=>{
                        console.error('Socket connection error:', error);
                    }
                }["SocketProvider.useEffect"]);
            }
            setSocket(globalSocket);
            // Don't disconnect on unmount to prevent issues with strict mode
            return ({
                "SocketProvider.useEffect": ()=>{
                    // Only disconnect if window is actually closing
                    if ("TURBOPACK compile-time truthy", 1) {
                        window.addEventListener('beforeunload', {
                            "SocketProvider.useEffect": ()=>{
                                globalSocket?.disconnect();
                            }
                        }["SocketProvider.useEffect"]);
                    }
                }
            })["SocketProvider.useEffect"];
        }
    }["SocketProvider.useEffect"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SocketContext.Provider, {
        value: {
            socket,
            isConnected
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/contexts/SocketContext.tsx",
        lineNumber: 133,
        columnNumber: 5
    }, this);
}
_s1(SocketProvider, "cnRSGjIW5BhtrjBagqOEUtOjPEw=");
_c = SocketProvider;
var _c;
__turbopack_context__.k.register(_c, "SocketProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=contexts_SocketContext_tsx_e1372eee._.js.map