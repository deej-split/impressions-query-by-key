# Impressions Query By Key

Ever needed to know immediately what impressions a customer had recently received? Even if you capture impressions, is it slow and awkward to search them?  No more!

In short, a service that allows HTTP GET query to retrieve all impressions for a specific Split key.

```
https://<lambda function url>/<split_key>
```

... returns a JSON list of abridged impressions for that split key.

```json
[
    {
        "treatment": "on",
        "split": "next_step",
        "time": 1659231532349,
        "key": "dmartin-dogs"
    },
    {
        "treatment": "red",
        "split": "multivariant_demo",
        "time": 1659233452345,
        "key": "dmartin-dogs"
    },
    {
        "treatment": "on",
        "split": "next_step",
        "time": 1659231531796,
        "key": "dmartin-dogs"
    },
    ...
]
```

# UPDATE

I have provided an index.html as sample "front end".  The page presents a search box for key to query. You can sort by column and search results.  

You must substitute the URL of your lambda function in order to use it:

```javascript
async function getSearchResults(query) {
   const url = 'https://<lambda function url>/' + query;
```

## How does it work?

*digest* is a lambda impressions webhook POST.  It writes impressions in batches of twenty-five to a backing DynamoDB table.  You register it with the Split Impressions Webhook.

*search* uses a global secondary index to pull all the impressions for a specific split key, then return them in JSON form as a response.  It is a GET function URL, its only paramter the Split key you want to query.

Impressions are automatically deleted from the DynamoDB table using its Time to Live (TTL) feature on the *ttl* column of the table, which is in seconds since the epoch (not the usual Split milliseconds since epoch).  You can control the TTL by editing the *digest* lambda script; the script stamps impressions with a TTL when they are loaded to DynamoDB.  Impressions older than the ttl are automatically deleted from the impressions table.

## Installation

The lambdas must be set up with permission to DynamoDB, and a suitable DynamoDB table must be created for the backing store, with Global Secondary Index on key.  Screenshots are included with this repository.  TTL must be set up on the *ttl* attribute of the DynamoDB table.

## Known Issues

When first creating the database and installing its Global Secondary Index, the search lambda may get errors:

```
ValidationException: Cannot read from backfilling global secondary index: key-index
```

These errors should resolve within a few minutes.

DynamoDB returns up to 1MB of data with a single query.  This should be hundreds, or nearly a thousand impressions.  I have not tested the response when more impressions are returned, but I expect it to be a truncated result (maybe with no indication it was truncated).  

david.martin@split.io



## ROUGH DRAFT OF INSTRUCTIONS

```
git clone https://github.com/splitio/impressions-query-by-key.git
```

### ADVANCED
If you want to change the 7 day default time to live on impressions, you can edit the digest/index.js to change the default as suits you.

```javascript
const ttl = nowInSeconds + (60 * 60 * 24 * 7);
```
Change 7 to 14 for a fourteen day rentention, etc.

## Creating the Lambda ZIPs

In each sub-directory (digest and search):

```
npm install
zip -r digest.zip *
```

Or search.zip in the search subdirectory.  This should create a zip file with index.js and a richly defined node_modules/ subdirectory.  Most of the dependency code is on the aws-sdk, necessary to use DynamoDB.

## AWS 

From AWS, create new lambdas, one for digest and one for search.

Upload the zip you created above from the Code section of the lambda config.

- Give the Lambdas DynamoDB permission
- Give the Lambdas function URLs

Digest gets a POST function.  Search gets a GET function. You probably also want to enable CORS support, and maybe accept all headers, with a *

Digest lambdas POST function URL is the webhook URL to install in Split.  Split impressions webhook.

## DynamoDB table...

 - *DIGEST_IMPRESSIONS* is the expected name
 - *ID* as partition key, *key* as sort key
 - From Indexes tab, create a new Global Secondary Index. *key* as partition key, *key-index* as index name.
 - From Additional settings, turn on TTL with *ttl* as attribute name

Generate some impressions by exercising a split.  Use Live Tail to check the impressions are received by Split.  Use Cloud Watch to see your digest lambda is writing the impressions to DynamoDB table.  Call your search lambda with one of the keys you saw received to verify you are a success.

  
## Questions?

david.martin@split.io
