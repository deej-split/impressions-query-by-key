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
    let code = 200;

    let promise = new Promise((resolve, reject) => {
      ddb.query(params, function(err, data) {
        if(err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });

    let databaseItems = [];

    let lastEvaluatedKey;
    await promise.then(data => {
      code = 200;
      lastEvaluatedKey = data.LastEvaluatedKey;
      databaseItems = [...data.Items];
    }).catch(error => {
      code = 500;
      results = error;
    })
    // console.log(databaseItems);

    // scan maxes out at 1MB of data. continue scanning if there is more data to read
    console.log('query for more? ' + (typeof lastEvaluatedKey !== 'undefined'));
    while (typeof lastEvaluatedKey !== 'undefined') {
      console.log('Querying for more...');
        const params = 
        {
            TableName : 'DIGEST_IMPRESSIONS',
            IndexName: 'key-index',
            KeyConditionExpression: '#theKey = :splitKey',
            ExpressionAttributeNames: {
                '#theKey': 'key'
            },
            ExpressionAttributeValues:{
                ':splitKey': { 'S' : key } 
            },
            ExclusiveStartKey: lastEvaluatedKey
        };   

      let promise = new Promise((resolve, reject) => {
        ddb.query(params, function(err, data) {
          if(err) {
            reject(err);
          } else {
            resolve(data);
          }          
        });
      });

      await promise.then(data =>  {
        code = 200;
        databaseItems = [...databaseItems, ...data.Items];
        lastEvaluatedKey = data.LastEvaluatedKey;
      }).catch(error => {
        code = 500;
        results = error;
      });
    }

    for(const item of databaseItems) {
        // console.log(item);
        results.push(
            {
                key: item.key.S, 
                split: item.split.S, 
                treatment: item.treatment.S,
                time: parseInt(item.time.N)
            }); 
    }

    const response = {
        statusCode: code,
        body: results
    };
    return response;
};

