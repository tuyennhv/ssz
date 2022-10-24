import { WasmContext } from "./wasm";
export declare class ChaCha20Poly1305 {
    private readonly ctx;
    private wasmKeyArr;
    private wasmNonceArr;
    private wasmAdArr;
    private wasmInputArr;
    private wasmChacha20OutputArr;
    private wasmPoly1305OutputArr;
    private wasmDebugArr;
    constructor(ctx: WasmContext);
    seal(key: Uint8Array, nonce: Uint8Array, plaintext: Uint8Array, associatedData?: Uint8Array): Uint8Array;
    open(key: Uint8Array, nonce: Uint8Array, sealed: Uint8Array, overwriteSealed?: boolean, associatedData?: Uint8Array): Uint8Array | null;
    private init;
    private openUpdate;
    private sealUpdate;
    private commonUpdate;
    private isSameTag;
}
//# sourceMappingURL=chacha20poly1305.d.ts.map