export interface Credential {
    descriptor: {
        type: string;
        id: string;
    };
    publicKey: string;
    userHandle: string;
    signatureCounter: number;
    createdAt: string;
    aaGuid: string;
    lastUsedAt: string;
    rpid: string;
    origin: string;
    country: string;
    device: string;
    nickname: string;
    userId: string;
}