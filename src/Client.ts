import { request } from "https";
import type { Credential } from "./types";

interface ClientOptions {
    secret?: string;
    url?: string;
    timeout?: number;
} 

export default class Client {
    private readonly secret: string;
    private readonly url: string;
    private readonly timeout: number;

    constructor(options?: ClientOptions) {
        this.secret = (options?.secret || process.env.PWLESS_SECRET) ?? (() => { throw new Error("An API secret must be specified, either in the Client options or the PWLESS_SECRET environment variable.") })();
        this.url = options?.url || process.env.PWLESS_API_URL || "https://v4.passwordless.dev";
        this.timeout = options?.timeout || 5000;
    }

    public async listCredentials(userId: string) {
        return await this._request<Credential[]>("/credentials/list", { userId }, "GET");
    }

    private _request<T>(endpoint: string, payload: Record<string, string | string[]>, method: "GET" | "POST" = "POST") {
        const reqData = JSON.stringify(payload);
        return new Promise<T>((resolve, reject) => {
            const req = request({
                hostname: this.url.replace(/http(s)?:\/\//, ""),
                method,
                path: method === "GET" ? this._buildParams(endpoint, payload) : endpoint,
                timeout: this.timeout,
                headers: {
                    "ApiSecret": this.secret,
                    ...(method === "POST" ? {
                        "Content-Type": "application/json",
                        "Content-Length": Buffer.byteLength(reqData)
                    } : {})
                }
            }, res => {
                const resBody: Uint8Array[] = [];

                res.on("data", chunk => resBody.push(chunk));
                res.once("end", () => {
                    try {
                        const stringBody = Buffer.concat(resBody).toString();
                        const parsed = JSON.parse(stringBody);
                        if (res.statusCode?.toString().startsWith("4")) {
                            reject(parsed);
                        } else resolve(parsed);
                    } catch (err) {
                        reject(err);
                    }
                });
            });

            req.on("error", err => reject(err));
            req.on("timeout", () => {
                req.destroy();
                reject(new Error(`The request has timed out after ${this.timeout} milliseconds.`))
            });

            if (reqData) req.write(reqData, () => req.end());
        })
    }

    private _buildParams(endpoint: string, payload: Record<string, string | string[]>) {
        const keys = Object.keys(payload);
        const values = Object.values(payload);
        return `${endpoint}?${keys.map((k, i) => `${k}=${values[i]}`).join("&")}`;
    }
}