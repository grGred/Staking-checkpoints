const { ethers } = require("ethers");
const sd = require("silly-datetime");

function curHumanTime() {
  return sd.format(new Date(), "YYYY-MM-DD_HH:mm:ss");
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// parameters
let retryTimes = 10;
let rpcStr = "https://rpc.ankr.com/eth";
let privatekeyStr =
  "0x1111111111111111111111111111111111111111111111111111111111111111";

let chainProvider = new ethers.providers.JsonRpcProvider({ url: rpcStr });
let wallet = new ethers.Wallet(privatekeyStr);

let rawTx = {
  chainId: 1,
  to: "0xbba4115ecb1f811061ecb5a8dc8fcdee2748ceba",
  data: "0xc2c4c5c1",
  value: ethers.BigNumber.from("0"),
};

async function sendTx(testMode = true) {
  console.log(`${curHumanTime()}, ------------ begin send tx ------------ `);

  for (let i = 0; i < retryTimes; i++) {
    try {
      let curRawTx = JSON.parse(JSON.stringify(rawTx));

      let nonce = await chainProvider.getTransactionCount(wallet.address);
      let gasPrice = await chainProvider.getGasPrice();
      let gasLimit = await (
        await chainProvider.estimateGas(curRawTx)
      ).add("30000");

      curRawTx.nonce = nonce;
      curRawTx.gasPrice = gasPrice;
      curRawTx.gasLimit = gasLimit;

      let signedTx = await wallet.signTransaction(curRawTx);

      let txParse = ethers.utils.parseTransaction(signedTx);
      console.log(
        `${curHumanTime()}, parsed signed tx is: \n${JSON.stringify(txParse)}`
      );
      console.log(
        `${curHumanTime()}, tx_hash: https://etherscan.io/tx/${txParse.hash}`
      );

      if (!testMode) {
        let receipt = await chainProvider.sendTransaction(signedTx);
        console.log(
          `${curHumanTime()}, receipt is: \n${JSON.stringify(receipt)}`
        );
      }

      break;
    } catch (err) {
      console.log(
        `${curHumanTime()}, the ${i + 1}-th try failed with error: ${err}`
      );
      await sleep(20000); // 20s
    }
  }

  console.log(`${curHumanTime()}, ------------ end send tx ------------ `);
}

setInterval(() => sendTx(false), 156 * 60 * 60 * 1000); // 561600s = 156h = 6.5d
