const zlib = require("zlib");
const {gzip, ungzip} = require('node-gzip');
const AWS = require('aws-sdk');
AWS.config.update({region: 'us-west-2'});

exports.handler = async (event) => {
    console.log(event);
    let body = event.body;
    if(event.isBase64Encoded) {
        console.log('decoding base64');
        body = Buffer.from(body, 'base64');
    }

    const unzipped = await ungzip(body);
    console.log('unzipped: ' + unzipped);

    const json = JSON.parse(unzipped);
    console.log(JSON.stringify(json, null, 2));

    const ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

    const startTimeInMillis = new Date().getTime();
    let putRequests = [];
    for(const impression of json) {
        let item = {};
        Object.keys(impression).forEach((key) => {
        let value = impression[key];
            if(value === null) {
                value = '';
            }
            if(key === 'time') {
                item[key] = {'N' : '' + value};
            } else if (key === 'splitVersionNumber') {
                item[key] = {'N' : '' + value};
            } else {
                item[key] = {'S' : value};
            }
        });
        item['ID'] = {'S' : uuidv4() };
        const now = new Date().getTime();
        const nowInSeconds = Math.round(now / 1000);
        const ttl = nowInSeconds + (60 * 60 * 24 * 7);
	    item['ttl'] = {'N' : '' + ttl }; 

        putRequests.push({PutRequest: {Item: item}});
    }

    let pageSize = 25;
    let i = 0;
    let pages = [];
    let q = [];
    for( ; i < putRequests.length; i++) {
        q.push(putRequests[i]);
        if(i % pageSize == 0) {
            pages.push(q);
            q = [];
        }
    }
    pages.push(q);

    for(const page of pages) {
        const params = {
            RequestItems: {
                'DIGEST_IMPRESSIONS': page
            }
        }

        console.log('preparing to batch ' + page.length + ' impressions to ddb');
        // console.log('putRequest is ' + getSizeInBytes(page) / 1024 + 'kb');
        await ddb.batchWriteItem(params, function(err, data) {
            if (err) {
               console.log(err);
            }
        }).promise();
    }

    console.log('wrote ' + json.length + ' impressions to ddb in ' + (new Date().getTime() - startTimeInMillis) + 'ms');

    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Digest!'),
    };
    return response;
};

function getSizeInBytes(obj) {
    let str = null;
    if (typeof obj === 'string') {
        // If obj is a string, then use it
        str = obj;
    } else {
        // Else, make obj into a string
        str = JSON.stringify(obj);
    }
    // Get the length of the Uint8Array
    const bytes = new TextEncoder().encode(str).length;
    return bytes;
}

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
