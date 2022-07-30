const AWS = require('aws-sdk');
AWS.config.update({region: 'us-west-2'});

exports.handler = async (event) => {
    console.log(event);
    if(event.rawPath.length < 2) {
        const response = {
            statusCode: 400,
            body: {'error':'missing query parameter /<key>'}
        };
        return response;
    }
    // everything after the slash is key
    const key = event.rawPath.substring(1);
    console.log(key);

    const ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

    // var params = {
    //   KeyConditionExpression: '#theKey = :splitKey',
    //   ExpressionAttributeNames: {
    //       '#theKey': 'key',
    //       '#theSplit': 'split',
    //       '#theTime': 'time'
    //   },
    //   ExpressionAttributeValues: {
    //     ':splitKey': {S: key}
    //   },
    //   ProjectionExpression: '#theKey, #theSplit, treatment, #theTime',
    //   TableName: 'DIGEST_IMPRESSIONS'
    // };
    var params = 
    {
        TableName : 'DIGEST_IMPRESSIONS',
        IndexName: 'key-index',
        KeyConditionExpression: '#theKey = :splitKey',
        ExpressionAttributeNames: {
            '#theKey': 'key'
        },
        ExpressionAttributeValues:{
            ':splitKey': { 'S' : key } 
        }
    };    
    console.log(params);

    let results = [];
    await ddb.query(params, function(err, data) {
        if (err) {
            console.log(err);
            const response = {
                statusCode: 500,
                body: {'error': err}
            }
            return response;
        } else {
            data.Items.forEach(function(element, index, array) {
                if(element.key && element.key.S === key) {
                    results.push(
                        {
                            key: element.key.S, 
                            split: element.split.S, 
                            treatment: element.treatment.S,
                            time: parseInt(element.time.N)
                        });
                }
            });
        }
    }).promise();

    const response = {
        statusCode: 200,
        body: results
    };
    return response;
};

