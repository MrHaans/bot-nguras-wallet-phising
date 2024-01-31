const { Connection, Transaction, clusterApiUrl, PublicKey, SystemProgram, TransactionInstruction } = require("@solana/web3.js");

const endpoint = clusterApiUrl("devnet"); // Ganti dengan endpoint sesuai jaringan Solana yang diinginkan

const connection = new Connection(endpoint, 'confirmed');

const receiverWallet = new PublicKey("FR7xemsDR3CZ1dGcmzejRR6ZgYoRfJwFn2TajqtsT8xT"); // Ganti dengan alamat wallet Solana penerima
const privateKeys = [
  new Uint8Array(["5YXYAZSUW8moZyayWJHuwinhsyFBHJ1Rda6GdWmL3SMEqhm9C8an4ymkrFd8ab2g2uHtypYVVPvugfWSr8eUCURu"]), // Ganti dengan private key Solana Anda
];
const tokenMintAddress = new PublicKey("3aMbgP7aGsP1sVcFKc6j65zu7UiziP57SMFzf6ptiCSX"); // Ganti dengan alamat mint token Solana (mungkin dari Jupiter Exchange)

const decimals = 6; // Sesuaikan dengan desimal token Solana yang digunakan

// Clear Console
console.clear();

// Welcome Message
console.log("Anda terhubung ke Solana Network\n");

// ... (bagian lain dari script tetap sama)

const txBot = async () => {
  console.log("Menunggu transaksi...");

  for (let i = 0; i < privateKeys.length; i++) {
    const privateKey = privateKeys[i];
    const wallet = new Account(privateKey);
    const publicKey = wallet.publicKey;

    const balanceInfo = await connection.getTokenAccountBalance(publicKey);
    const balance = parseInt(balanceInfo.value.amount, 10) / Math.pow(10, decimals);

    if (balance > 0) {
      console.log(`Terdeteksi balance baru: ${balance} token.`);

      const instruction = Token.createTransferInstruction(
        TOKEN_PROGRAM_ID,
        publicKey,
        receiverWallet,
        wallet.publicKey,
        [],
        balance * Math.pow(10, decimals)
      );

      const transaction = new Transaction().add(instruction);
      transaction.feePayer = publicKey;

      console.log(`Mengirim ${balance} token ke ${receiverWallet.toBase58()}...`);

      const signature = await sendAndConfirmTransaction(connection, transaction, [wallet]);
      console.log(`Transaksi sukses: ${signature}`);

      const updatedBalanceInfo = await connection.getTokenAccountBalance(publicKey);
      const updatedBalance = parseInt(updatedBalanceInfo.value.amount, 10) / Math.pow(10, decimals);

      if (updatedBalance === 0) {
        console.log(`Semua token telah terkirim. Stop bot...`);
        process.exit(0);
      }
    }
  }

  setTimeout(txBot, RETRY_DELAY_MS);
};
txBot();
