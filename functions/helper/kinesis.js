const { KinesisClient, GetRecordsCommand } = require("@aws-sdk/client-kinesis");
const kinesis = new KinesisClient();

const kinesisSendMessage = async (payload) => {
    let result;
    let params = {
        Data: Buffer.from(JSON.stringify(payload)),
        PartitionKey: 'midasPK',
        StreamName: 'MidasWalletQldbStreamDynamodb-dev',
    }

    try {
        const command = new GetRecordsCommand(params);

        result = await kinesis.send(command);

        console.log(`kinesis result: ${JSON.stringify(result)}`);

        return result;
    } catch (err) {
        Promise.reject(`kinesis err: ${err}`);
    }
};

module.exports = {
    kinesisSendMessage
}