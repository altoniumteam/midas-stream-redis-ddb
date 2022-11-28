import { DynamoDB } from "aws-sdk";
const docClient = new DynamoDB.DocumentClient();


export async function updateBalance(
  brandUsername,
  previousBalance,
  currentBalance,
  bonusCurrentBalance,
  bonusPreviousBalance
) {
  let params = {
    TableName: "midasUser",
    // this is your DynamoDB Table
    Key: {
      brandUsername: "",
      //find the itemId in the table that you pull from the event
    },
    UpdateExpression: "set previousBalance = :a, currentBalance = :b, bonusCurrentBalance = :c, bonusPreviousBalance = :d",
    // This expression is what updates the item attribute
    ExpressionAttributeValues: {
      ":a": 0,
      ":b": 0,
      ":c": 0,
      ":d": 0
      //create an Expression Attribute Value to pass in the expression above
    },
    ReturnValues: "UPDATED_NEW",
    // Return the newly updated values
  };
  params.Key.brandUsername = brandUsername;
  params.ExpressionAttributeValues[":a"] = previousBalance;
  params.ExpressionAttributeValues[":b"] = currentBalance;
  params.ExpressionAttributeValues[":c"] = bonusCurrentBalance;
  params.ExpressionAttributeValues[":d"] = bonusPreviousBalance;
  try {
    await docClient.update(params).promise();
    console.log('update sukses')
  } catch (err) {
    return err;
  }
}

export async function updateCryptoBalance(
  brandUsername,
  currency,
  currentBalance,
  previousBalance,
  currencyTarget,
  targetCurrentBalance,
  targetPreviousBalance,
  type
) {
  let params;
  console.log('currentBalance: ', currentBalance)
  console.log('previousBalance: ', previousBalance)
  if (type == 'swap') {
  let params = {
    TableName: "midasUser",
    // this is your DynamoDB Table
    Key: {
      brandUsername: "",
      //find the itemId in the table that you pull from the event
    },
    UpdateExpression: `set cryptoBalance.${currency}.currentBalance = :a, cryptoBalance.${currency}.previousBalance = :b, cryptoBalance.${currencyTarget}.currentBalance = :c, cryptoBalance.${currencyTarget}.previousBalance = :d`,
    // This expression is what updates the item attribute
    ExpressionAttributeValues: {
      ":a": 0,
      ":b": 0,
      ":c": 0,
      ":d": 0
      //create an Expression Attribute Value to pass in the expression above
    },
    ReturnValues: "UPDATED_NEW",
    // Return the newly updated values
  };
    params.Key.brandUsername = brandUsername;
    params.ExpressionAttributeValues[":a"] = currentBalance;
    params.ExpressionAttributeValues[":b"] = previousBalance;
    params.ExpressionAttributeValues[":c"] = targetCurrentBalance;
    params.ExpressionAttributeValues[":d"] = targetPreviousBalance;

  } else {
    params = {
      TableName: "midasUser",
      // this is your DynamoDB Table
      Key: {
        brandUsername: "",
        //find the itemId in the table that you pull from the event
      },
      UpdateExpression: `set cryptoBalance.${currency}.currentBalance = :a, cryptoBalance.${currency}.previousBalance = :b`,
      // This expression is what updates the item attribute
      ExpressionAttributeValues: {
        ":a": 0,
        ":b": 0,
        //create an Expression Attribute Value to pass in the expression above
      },
      ReturnValues: "UPDATED_NEW",
      // Return the newly updated values
    };
    params.Key.brandUsername = brandUsername;
    params.ExpressionAttributeValues[":a"] = currentBalance;
    params.ExpressionAttributeValues[":b"] = previousBalance;
  }

  try {
    await docClient.update(params).promise();
    console.log('update crypto sukses')
  } catch (err) {
    return err;
  }
}

export async function insertOne(
  brandUsername, 
  brandId,
  username,
  currentBalance,
  previousBalance,
  bonusCurrentBalance,
  bonusPreviousBalance,
  bonusAdjustAmount,
  adjustAmount,
  txType,
  txTypeAtt1,
  txTypeAtt2,
  txTypeAtt3,
  gameId,
  providerId,
  reference,
  roundDetails,
  roundId,
  gpTimestamp,
  createdAt,
  usedPromo,
  jackpotId
) {
  const params = {
    TableName: 'midasWager',
    Item: {
      brandUsername,
      createdAt,
      brandId,
      username,
      currentBalance,
      previousBalance,
      adjustAmount,
      bonusCurrentBalance,
      bonusPreviousBalance,
      bonusAdjustAmount,
      usedPromo,
      jackpotId,
      txType,
      txTypeAtt1,
      txTypeAtt2,
      txTypeAtt3,
      metadata: {
        gameId,
        providerId,
        reference,
        roundDetails,
        roundId,
        gpTimestamp
      }
    },
    ConditionExpression: "attribute_not_exists(brandUsername)"
  }

  console.log('ENTERING DDB PUT COMMAND: ' + params)

  try {
    const result = await docClient.put(params).promise();
    console.log('DDB DATA: ' + result);
    return result;
  } catch (err) {
    console.log('DDB INSERT ERR: ' + err)
    return err;
  }
}

export async function getWsConnectionId(
  brandUsername
){
    const params = {
      TableName: "midasUser",
      Key: {
        brandUsername: brandUsername,
      },
      ProjectionExpression: "userWebsocket.wsConnectionId",
    };
    console.log("Get User Param: ", params);
  
    try {
      const data = await docClient.get(params).promise();
      console.log("getWsConnectionId result ", data);
      return data.Item;
    } catch (err) {
      return err;
    }


}