"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = __importStar(require("crypto"));
class Transaction {
    constructor(amount, payer, payee) {
        this.amount = amount;
        this.payer = payer;
        this.payee = payee;
    }
    getTransactionData() {
        return JSON.stringify(this);
    }
}
class Block {
    constructor(prevHash, transaction, time = Date.now()) {
        this.prevHash = prevHash;
        this.transaction = transaction;
        this.time = time;
        this.nonce = Math.round(Math.random() * 999999999);
    }
    get hash() {
        const str = JSON.stringify(this);
        const hash = crypto.createHash("SHA256");
        hash.update(str).end();
        return hash.digest("hex");
    }
}
class Chain {
    constructor() {
        // @ts-ignore -- First block in the chain
        this.chain = [new Block(null, new Transaction(50, "genesis", "satoshi"))];
    }
    get lastBlock() {
        return this.chain[this.chain.length];
    }
    mine(nonce) {
        let solution = 1;
        console.log("⛏️    Mining...");
        while (true) {
            const hash = crypto.createHash("MD5");
            hash.update((nonce + solution).toString()).end();
            const attempt = hash.digest("hex");
            if (attempt.substr(0, 4) === "0000") {
                console.log(`Solved: ${solution}`);
                return solution;
            }
            solution += 1;
        }
    }
    addBlock(transaction, payerPublicKey, signature) {
        var _a;
        const verifier = crypto.createVerify("SHA256");
        verifier.update(transaction.getTransactionData());
        const isValid = verifier.verify(payerPublicKey, signature);
        if (isValid) {
            const newBlock = new Block((_a = this.lastBlock) === null || _a === void 0 ? void 0 : _a.hash, transaction);
            this.mine(newBlock.nonce);
            this.chain.push(newBlock);
        }
    }
}
Chain.instance = new Chain();
class Wallet {
    constructor() {
        const keypair = crypto.generateKeyPairSync("rsa", {
            modulusLength: 2048,
            publicKeyEncoding: { type: "spki", format: "pem" },
            privateKeyEncoding: { type: "pkcs8", format: "pem" },
        });
        this.publicKey = keypair.publicKey;
        this.privateKey = keypair.privateKey;
    }
    sendMoney(amount, payeePublicKey) {
        const transaction = new Transaction(amount, this.publicKey, payeePublicKey);
        const sign = crypto.createSign("SHA256");
        sign.update(transaction.getTransactionData()).end();
        const signature = sign.sign(this.privateKey);
        Chain.instance.addBlock(transaction, this.publicKey, signature);
    }
}
// USAGE
const satoshi = new Wallet();
const ilkay = new Wallet();
satoshi.sendMoney(100, ilkay.publicKey);
ilkay.sendMoney(25, satoshi.publicKey);
satoshi.sendMoney(50, ilkay.publicKey);
ilkay.sendMoney(35, satoshi.publicKey);
