const { client } = require('./helper/midas-redis-helper');
const { load, dumpPrettyText } = require("ion-js");
const { deaggregateSync } = require("aws-kinesis-agg");
const { debug } = require("@dazn/lambda-powertools-logger");
const {
  updateBalance,
  updateCryptoBalance,
  getWsConnectionId,
} = require("./helper/midas-ddb-helper");
const { sendWebsocketMessage } = require("./helper/update-balance-websocket");
const { sendMessage } = require("./helper/midas-sqs");

const computeChecksums = true;

const JournalUrl = process.env.JournalUrl;
const StatisticUrl = process.env.StatisticUrl;
const CampaignSystemUrl = process.env.CampaignSystemUrl;

const redisCache = async (client, key, value) => {
  console.log("START", value);
  let result;
  try {
    client.on("error", (err) => console.log("Redis error", err));

    result = await client.get(key);

    if (result == null || result == undefined) {
      result = await client.set(key, value);
    }

    return result;
  } catch (err) {
    console.log(err);
    return err;
  }
};

const promiseDeaggregate = (record) =>
  new Promise((resolve, reject) => {
    deaggregateSync(record, computeChecksums, (err, responseObject) => {
      if (err) {
        // handle/report error
        return reject(err);
      }
      return resolve(responseObject);
    });
  });

async function processIon(ionRecord) {
  // retrieve the version and id from the metadata section of the message
  // console.log("ini record:" + JSON.stringify(ionRecord));
  // const version = ionRecord.payload.revision.metadata.version.numberValue();

  // const id = ionRecord.payload.revision.metadata.id.stringValue();

  // debug(`Version ${version} and id ${id}`);

  console.log("ionRecord: " + JSON.stringify(ionRecord));

  // Check to see if the data section exists.
  if (ionRecord == null || !ionRecord) {
    debug("No data section so handle as a delete");
    //delete
  } else {
    // if (ionRecord.payload.tableInfo.tableName.stringValue() == "playerWallet") {
    const brandUsername = ionRecord.brandUsername;
    const brandId = ionRecord.brandId;
    const username = ionRecord.username;
    const previousBalance = ionRecord.previousBalance;
    const currentBalance = ionRecord.currentBalance;
    const bonusCurrentBalance = ionRecord.bonusCurrentBalance;
    const bonusPreviousBalance = ionRecord.bonusPreviousBalance;
    const activeWallet = ionRecord.activeWallet;
    const cryptoBalance = ionRecord.cryptoBalance;
    const previousCryptoBalance = ionRecord.previousCryptoBalance;
    const bonusAdjustAmount = ionRecord.bonusAdjustAmount;
    const adjustAmount = ionRecord.adjustAmount;
    const txType = ionRecord.txType;
    const txTypeAtt1 = ionRecord.txTypeAtt1;
    const txTypeAtt2 = ionRecord.txTypeAtt2;
    const txTypeAtt3 = ionRecord.txTypeAtt3;
    const gameId = ionRecord.metadata.gameId;
    const providerId = ionRecord.metadata.providerName;
    const reference = ionRecord.metadata.reference;
    const roundDetails = ionRecord.metadata.roundDetails;
    const roundId = ionRecord.metadata.roundId;
    const bonusCode = ionRecord.metadata.bonusCode;
    const gpTimestamp = ionRecord.metadata.gpTimestamp;
    const createdAt = ionRecord.createdAt;
    const usedPromo = ionRecord.metadata.usedPromo;
    const validBetAmount = ionRecord.validBetAmount;
    const promoWinAmount = ionRecord.metadata.promoWinAmount;
    const jackpotId = ionRecord.metadata.jackpotId;
    const promoCampaignType = ionRecord.metadata.promoCampaignType;
    const promoCampaignId = ionRecord.metadata.promoCampaignId;
    const promoWinReference = ionRecord.metadata.promoWinReference;
    const campaignType = ionRecord.metadata.campaignType;
    const campaignId = ionRecord.metadata.campaignId;
    const statistic = ionRecord.statistic;
    const currency = ionRecord.currency;
    const targetCurrency = ionRecord.targetCurrency;
    const cryptoCurrentBalance = ionRecord.cryptoCurrentBalance;
    const targetCryptoCurrentBalance = ionRecord.targetCryptoCurrentBalance;
    const targetCryptoPreviousBalance = ionRecord.targetCryptoPreviousBalance;
    const campaignWithdrawLock = ionRecord.campaignWithdrawLock;
    const campaignStatistic = ionRecord.campaignStatistic;
    const adjustmentAmountToOrigin = ionRecord.adjustmentAmountToOrigin;
    const exchangeRate = ionRecord.exchangeRate;
    const exchangeRateId = ionRecord.exchangeRateId;
    const exchangeRateMeta = ionRecord.exchangeRateMeta;
    // debug("*** playerWallet Table, execute! ***");
    // debug(brandUsername);
    // debug(brandId);
    // debug(username);
    // debug(previousBalance);
    // debug(currentBalance);
    // debug(bonusCurrentBalance);
    // debug(bonusPreviousBalance);
    // debug(bonusAdjustAmount);
    // debug(activeWallet);
    // debug(cryptoBalance);
    // debug(adjustAmount);
    // debug(txType);
    // debug(txTypeAtt1);
    // debug(txTypeAtt2);
    // debug(txTypeAtt3);
    // debug(gameId);
    // debug(providerId);
    // debug(reference);
    // debug(roundDetails);
    // debug(roundId);
    // debug(gpTimestamp);
    // debug(createdAt);
    // debug(usedPromo);
    // debug(jackpotId);
    // debug(cryptoPreviousBalance);
    // debug(campaignStatistic);

    // await client.quit();

    // SQS data to send
    const payload = {
      brandUsername,
      brandId,
      username,
      currentBalance,
      previousBalance,
      bonusCurrentBalance,
      bonusPreviousBalance,
      bonusAdjustAmount,
      activeWallet,
      cryptoBalance,
      previousCryptoBalance,
      adjustAmount,
      validBetAmount,
      txType,
      txTypeAtt1,
      txTypeAtt2,
      txTypeAtt3,
      gameId: txTypeAtt1 == "Deposit" || txTypeAtt1 == "Withdraw" ? "" : gameId,
      providerId:
        txTypeAtt1 == "Deposit" || txTypeAtt1 == "Withdraw" ? "" : providerId,
      reference:
        txTypeAtt1 == "Deposit" || txTypeAtt1 == "Withdraw" ? "" : reference,
      roundDetails:
        txTypeAtt1 == "Deposit" || txTypeAtt1 == "Withdraw" ? "" : roundDetails,
      roundId:
        txTypeAtt1 == "Deposit" || txTypeAtt1 == "Withdraw" ? "" : roundId,
      bonusCode:
        txTypeAtt1 == "Deposit" || txTypeAtt1 == "Withdraw" ? "" : bonusCode,
      gpTimestamp:
        txTypeAtt1 == "Deposit" || txTypeAtt1 == "Withdraw" ? "" : gpTimestamp,
      createdAt,
      usedPromo:
        txTypeAtt1 == "Deposit" || txTypeAtt1 == "Withdraw" ? "" : usedPromo,
      jackpotId:
        txTypeAtt1 == "Deposit" || txTypeAtt1 == "Withdraw" ? "" : jackpotId,
      promoWinAmount:
        txTypeAtt1 == "Deposit" || txTypeAtt1 == "Withdraw"
          ? ""
          : promoWinAmount,
      promoCampaignType:
        txTypeAtt1 == "Deposit" || txTypeAtt1 == "Withdraw"
          ? ""
          : promoCampaignType,
      promoCampaignId:
        txTypeAtt1 == "Deposit" || txTypeAtt1 == "Withdraw"
          ? ""
          : promoCampaignId,
      promoWinReference:
        txTypeAtt1 == "Deposit" || txTypeAtt1 == "Withdraw"
          ? ""
          : promoWinReference,
      campaignType:
        txTypeAtt1 == "Deposit" || txTypeAtt1 == "Withdraw" ? "" : campaignType,
      campaignId:
        txTypeAtt1 == "Deposit" || txTypeAtt1 == "Withdraw" ? "" : campaignId,
      statistic,
      campaignWithdrawLock,
      campaignStatistic,
      mainCurrency: "USD",
      adjustmentAmountToOrigin: (adjustmentAmountToOrigin) ? adjustmentAmountToOrigin : 0,
      adjustmentAmountToOriginCurrency: activeWallet,
      exchangeRate: exchangeRate,
      exchangeRateId: exchangeRateId,
      exchangeRateMeta: exchangeRateMeta,
      walletBtcCurrent: cryptoBalance['BTC'],
      walletBtcPrevious: previousCryptoBalance['BTC'],
      walletShibaCurrent: cryptoBalance['SHIB'],
      walletShibaPrevious: previousCryptoBalance['SHIB'],
      walletEthCurrent: cryptoBalance['ETH'],
      walletEthPrevious: previousCryptoBalance['ETH'],
      walletBscCurrent: cryptoBalance['BSC'],
      walletBscPrevious: previousCryptoBalance['BSC'],
      walletDogeCurrent: cryptoBalance['DOGE'],
      walletDogePrevious: previousCryptoBalance['DOGE'],
      walletUsdtCurrent: cryptoBalance['USDT'],
      walletUsdtPrevious: previousCryptoBalance['USDT'],
      walletIdrtCurrent: cryptoBalance['IDRT'],
      walletIdrtPrevious: previousCryptoBalance['IDRT'],
      walletBidrCurrent: cryptoBalance['BIDR'],
      walletBidrPrevious: previousCryptoBalance['BIDR'],
    };

    console.log("PAYLOAD: " + JSON.stringify(payload));

    // sent to SQS Journal
    const sqsMessage = await sendMessage({
      url: JournalUrl,
      payload: JSON.stringify(payload),
    });

    // console.log("SQS Journal: " + JSON.stringify(sqsMessage));

    const sqsMessageStatistic = await sendMessage({
      url: StatisticUrl,
      payload: JSON.stringify(payload),
    });

    // console.log("SQS: " + JSON.stringify(sqsMessageStatistic));

    // sent to Bonus

    const sqsMessageCampaignSystem = await sendMessage({
      url: CampaignSystemUrl,
      payload: JSON.stringify(payload),
    });

    // console.log("SQS: " + JSON.stringify(sqsMessageBonusSystem));

    // DDB Wager insertion
    // await insertOne(brandUsername, brandId, username, currentBalance, previousBalance, bonusCurrentBalance, bonusPreviousBalance, bonusAdjustAmount, adjustAmount, txType, txTypeAtt1, txTypeAtt2, txTypeAtt3, gameId, providerId, reference, roundDetails, roundId, gpTimestamp, createdAt, usedPromo, jackpotId);
    const redisKey = "pdc:" + brandUsername;
    // selfmade optimistic lock :D
    const invoker = await redisCache(client, redisKey, createdAt);
    // console.log(`createdAt: ${createdAt}, pdc: ${invoker}, ` + (createdAt - invoker));
    // console.log(`createdAt: ${txTypeAtt1}: ` + createdAt);
    const ca = new Date(createdAt);
    const i = new Date(invoker);

    const pdcChecker = ca < i;

    if (pdcChecker == false) {
      //updatepdc
      await client.set(redisKey, createdAt.toString());
    }

    if (txTypeAtt1 == 'result') {
      await new Promise((r) => setTimeout(r, 50))
    }

    if (pdcChecker === true) {
      return console.log("data update ke dynamo dan ws skipped");
    } else {
      // DDB updateBalance
      if (txTypeAtt1 == "swap") {
        await updateCryptoBalance(
          brandUsername,
          currency,
          cryptoCurrentBalance,
          previousCryptoBalance,
          targetCurrency,
          targetCryptoCurrentBalance,
          targetCryptoPreviousBalance,
          txTypeAtt1
        );
      } else {
        if (activeWallet == "MAIN") {
          await updateBalance(
            brandUsername,
            previousBalance,
            currentBalance,
            bonusCurrentBalance,
            bonusPreviousBalance
          );
        } else {
          await updateCryptoBalance(
            brandUsername,
            activeWallet,
            cryptoBalance[activeWallet],
            previousCryptoBalance[activeWallet]
          );
        }
      }

      // if (txTypeAtt1 === 'result'){
      //   await new Promise((r) => setTimeout(r, 1200))
      // }

      //start: update player balance websocket
      console.log(brandUsername);
      const response = await getWsConnectionId(brandUsername);
      if (response.userWebsocket.wsConnectionId === undefined) {
        //wsConnectionId not found
      } else {
        //hit websocket to update

        const wsMessage = {
          brandUsername: payload.brandUsername,
          activeWallet: payload.activeWallet,
          walletBalance: {
            MAIN: {
              currentBalance,
              currencyName: 'MAIN',
              type: 'FIAT'
            },
            BONUS: {
              currentBalance,
              currencyName: 'BONUS',
              type: 'FIAT'              
            },
            BTC: {
              currentBalance: cryptoBalance["BTC"],
              currencyName: 'BTC',
              type: 'CRYPTO'          
            },
            ETH: {
              currentBalance: cryptoBalance["ETH"],
              currencyName: 'ETH',
              type: 'CRYPTO'              
            },
            DOGE: {
              currentBalance: cryptoBalance["DOGE"],
              currencyName: 'DOGE',
              type: 'CRYPTO'
            },
            BSC: {
              currentBalance: cryptoBalance["BSC"],
              currencyName: 'BSC',
              type: 'CRYPTO'
            },
            SHIB: {
              currentBalance: cryptoBalance["SHIB"],
               currencyName: 'SHIB',
              type: 'CRYPTO'             
            },
            USDT: {
              currentBalance: cryptoBalance["USDT"],
              currencyName: 'USDT',
              type: 'CRYPTO'             
            },
            IDRT: {
              currentBalance: cryptoBalance["IDRT"],
              currencyName: 'IDRT',
              type: 'CRYPTO'             
            },
            BIDR: {
              currentBalance: cryptoBalance["BIDR"],
              currencyName: 'BIDR',
              type: 'CRYPTO'             
            },
          }
        };

        await sendWebsocketMessage(
          response.userWebsocket.wsConnectionId,
          JSON.stringify(wsMessage)
        );
      } // end: update player balance websocket
    }
    // } else {
    //   debug("*** Not playerWallet Table, skipped! ***");
    // }

    // do an upsert so it doesn't matter if it is the initial version or not
    //await updateLicence(id, points, postcode, version);
  }
}

async function processRecords(records) {
  await Promise.all(
    records.map(async (record) => {
      // Kinesis data is base64 encoded so decode here
      const payload = Buffer.from(record.data, "base64");

      // payload is the actual ion binary record published by QLDB to the stream
      const ionRecord = load(payload);
      debug("ini ionRecord: " + ionRecord);
      const a = JSON.stringify(ionRecord);
      const b = JSON.parse(a);

      // Only process records where the record type is REVISION_DETAILS
      //   if (ionRecord.recordType !== REVISION_DETAILS) {
      //     debug(
      //       `Skipping record of type ${dumpPrettyText(ionRecord.recordType)}`
      //     );
      //   } else {
      debug(`Ion Record: ${dumpPrettyText(b)}`);
      await processIon(b);
      //   }
    })
  );
}

module.exports.handler = async (event) => {
  console.log(event);
  try {
    await Promise.all(
      event.Records.map(async (kinesisRecord) => {
        const records = await promiseDeaggregate(kinesisRecord.kinesis);
        await processRecords(records);
      })
    );
  } catch (err) {
    Promise.reject(`Kinesis Consumer Error: ${err}`);
  }
};
