import * as crypto from "crypto";

class Transaction {
  constructor(
    public amount: number,
    public payer: string,
    public payee: string
  ) {}

  getTransactionData() {
    return JSON.stringify(this);
  }
}

class Block {
  public nonce = Math.round(Math.random() * 999999999);

  constructor(
    public prevHash: string,
    public transaction: Transaction,
    public time = Date.now()
  ) {}

  get hash() {
    const str = JSON.stringify(this);
    const hash = crypto.createHash("SHA256");

    hash.update(str).end();

    return hash.digest("hex");
  }
}

class Chain {
  public static instance = new Chain();

  chain: Block[];

  constructor() {
    // @ts-ignore -- First block in the chain
    this.chain = [new Block(null, new Transaction(50, "genesis", "satoshi"))];
  }

  get lastBlock() {
    return this.chain[this.chain.length];
  }

  mine(nonce: number) {
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

  addBlock(
    transaction: Transaction,
    payerPublicKey: string,
    signature: Buffer
  ) {
    const verifier = crypto.createVerify("SHA256");
    verifier.update(transaction.getTransactionData());

    const isValid = verifier.verify(payerPublicKey, signature);

    if (isValid) {
      const newBlock = new Block(this.lastBlock?.hash, transaction);

      this.mine(newBlock.nonce);

      this.chain.push(newBlock);
    }
  }
}

class Wallet {
  public publicKey: string;
  public privateKey: string;

  constructor() {
    const keypair = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });

    this.publicKey = keypair.publicKey;
    this.privateKey = keypair.privateKey;
  }

  sendMoney(amount: number, payeePublicKey: string) {
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
