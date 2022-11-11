const { ethers } = require("ethers");
const sd = require("silly-datetime");
const Contract = require("web3-eth-contract");
const dotenv = require("dotenv");
dotenv.config();
let abiReward = require("./abiReward.json");

function curHumanTime() {
  return sd.format(new Date(), "YYYY-MM-DD_HH:mm:ss");
}

let rpcStr = "https://bsc-dataseed1.binance.org/";
const privateKey = process.env.MNEMONIC;

let privatekeyStr = `0x${privateKey}`;
let chainProvider = new ethers.providers.JsonRpcProvider({ url: rpcStr });
let wallet = new ethers.Wallet(privatekeyStr);

let addressReward = "0x333C28fca941b5B229fbAEC7D1385Ae7139da333";

Contract.setProvider("https://bsc-dataseed1.binance.org/");
let reward = new Contract(abiReward, addressReward);

let rawTx = {
  chainId: 56,
  to: "0x3333B155fa21A972D179921718792f1036370333",
  data: "0xc2c4c5c1",
  value: 0,
};

async function sendTx() {
  console.log(`${curHumanTime()}, ------------ begin send tx ------------ `);
  let epoch = 12;
  // find last epoch

  // we will revert when there will be no output, you can check
  while ((await reward.methods.epochInfo(epoch).call()) != 0) {
    epoch += 1;
    try {
      await reward.methods.epochInfo(epoch).call();
    } catch (error) {
      break;
    }
  }

  let encoded = reward.methods.checkpointAndCheckEpoch(epoch - 1).encodeABI();
  let rawtxReward = {
    chainId: 56,
    to: addressReward,
    data: encoded,
    value: 0,
  };

  let curRawTxReward = JSON.parse(JSON.stringify(rawtxReward));
  let nonce = await chainProvider.getTransactionCount(wallet.address);
  let gasPrice = await chainProvider.getGasPrice();
  let gasLimit = await (
    await chainProvider.estimateGas(curRawTxReward)
  ).add("100000");
  curRawTxReward.nonce = nonce;
  curRawTxReward.gasPrice = gasPrice;
  curRawTxReward.gasLimit = gasLimit;
  let signedTxReward = await wallet.signTransaction(curRawTxReward);
  let receiptReward = await chainProvider.sendTransaction(signedTxReward);
  console.log(
    `${curHumanTime()}, receipt is: \n${JSON.stringify(receiptReward)}`
  );

  let curRawTx = JSON.parse(JSON.stringify(rawTx));

  nonce += 1;
  let gasPriceVe = await chainProvider.getGasPrice();
  let gasLimitVe = await (
    await chainProvider.estimateGas(curRawTx)
  ).add("30000");

  curRawTx.nonce = nonce;
  curRawTx.gasPrice = gasPriceVe;
  curRawTx.gasLimit = gasLimitVe;

  let signedTx = await wallet.signTransaction(curRawTx);

  let receipt = await chainProvider.sendTransaction(signedTx);
  console.log(`${curHumanTime()}, receipt is: \n${JSON.stringify(receipt)}`);

  console.log(`${curHumanTime()}, ------------ end send tx ------------ `);
}

async function trySend() {
  setInterval(() => sendTx(), 72 * 60 * 60 * 1000); // 72 hours - 3 days
  setTimeout(() => trySend(), 48 * 60 * 60 * 1000);
}

trySend();
