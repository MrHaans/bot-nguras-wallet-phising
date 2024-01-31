const { ethers } = require("ethers");
const provider = new ethers.providers.JsonRpcProvider(
  "https://endpoints.omniatech.io/v1/arbitrum/goerli/4f476e82825a424197198c1d4a1f41c9" // Ganti ke Endpoint Network yang dipilih
);
const receiverWallet = "0xFaC5c4B11291C573F766fA092AEe9203C8a05E3A"; // Ganti ke Address-mu untuk terima Balance yang ada di wallet bot.
const privateKeys = [
  "7a4537b7d827a4063c33ecddd103cd8e82376fc23cbe9379b16729b6b52546db", // Ganti dengan Private-Key wallet-mu yang  terkena bot.
];
const contractAddress = "0xd14838A68E8AFBAdE5efb411d5871ea0011AFd28"; // Ganti ke Contract Address Token (ARB/UNI/OP/dll) yang mau dikuras di wallet bot.

// ERC20 Token Abi Definition
const tokenAbi = [
  "function transfer(address to, uint256 value) payable",
  "function balanceOf(address owner) view returns (uint256)",
];

// Create Contract Instance
const tokenContract = new ethers.Contract(contractAddress, tokenAbi, provider);

// Clear Console
console.clear();

provider.getNetwork().then((network) => {
  console.log(`Anda berada di Network : ${network.name}\n`);
});

//ASCII Banner
var figlet = require("figlet");

figlet.text(
  "Hans Bot",
  {
    font: "Standard",
    horizontalLayout: "default",
    width: 60,
    whitespaceBreak: false,
  },
  function (err, data) {
    if (err) {
      console.log("Something went wrong...");
      console.dir(err);
      return;
    }
    console.log(data);
  }
);

// Welcome Message
provider.once("block", (transaction) => {
  console.log("\n\nJUDUL : Bot Nguras Isi Balance\n\n");
  console.log("Nomor Block : ", transaction);
});

provider.getGasPrice().then((gasPrice) => {
  gasPriceString = gasPrice.toString();
  console.log("Harga gas terkini : ", gasPriceString);
  console.log("\n");
});

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000; // 5 seconds

const sendTransaction = async (unsignedTx, signer, name, retries = 0) => {
  try {
    const signedTx = await signer.signTransaction(unsignedTx);
    const transaction = await provider.sendTransaction(signedTx);
    console.log(`<${name}>`, `Transaksi hash: ${transaction.hash}`);
    return transaction;
  } catch (error) {
    if (error.message.includes("nonce sangat rendah")) {
      if (retries < MAX_RETRIES) {
        console.log(
          `<${name}>`,
          `Nonce sangat rendah. Mencoba dalam ${RETRY_DELAY_MS}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        return sendTransaction(unsignedTx, signer, name, retries + 1);
      } else {
        throw new Error("Mencapai batas maksimum!");
      }
    } else {
      console.log(`<${name}>`, `Error: ${error.message}`);
      throw error;
    }
  }
};

const txBot = async () => {
  const { chainId, name } = await provider.getNetwork();
  console.log(`<${name}>`, "Menunggu transaksi...");

  for (let i = 0; i < privateKeys.length; i++) {
    const privateKey = privateKeys[i];
    const signer = new ethers.Wallet(privateKey, provider);
    let balance = await tokenContract.balanceOf(signer.address);

    if (balance.gt(0)) {
      const amount = balance;
      console.log(`<${name}>`, `Terdeteksi balance baru: ${amount} token.`);

      const unsignedTx = {
        to: contractAddress,
        value: 0,
        gasPrice: ethers.utils.parseUnits("1", "gwei"), // SESUAIKAN GWEI SESUAI KEBUTUHAN (LEBIH BANYAK LEBIH BAGUS)
        gasLimit: 500000,  // SESUAIKAN GAS LIMIT SESUAI KEBUTUHAN (LEBIH BANYAK LEBIH BAGUS)
        nonce: await provider.getTransactionCount(signer.address, "latest"),
        data: tokenContract.interface.encodeFunctionData("transfer", [
          receiverWallet,
          amount,
        ]),
      };

      console.log(
        `<${name}>`,
        `Mengirim ${amount} token ke ${receiverWallet}...`
      );
      const transaction = await sendTransaction(unsignedTx, signer, name);
      console.log(`<${name}>`, `Transaksi sukses: ${transaction.hash}`);

      balance = await tokenContract.balanceOf(signer.address);
      if (balance.eq(0)) {
        console.log(`\n\n<${name}>`, `Semua token telah terkirim. Stop bot...`);
        process.exit(0);
      }
    }
  }

  setTimeout(txBot, RETRY_DELAY_MS);
};
txBot();
