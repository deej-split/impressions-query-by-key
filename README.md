# Impressions Query By Key

Ever needed to know immediately what impressions a customer had recently received? Even if you capture impressions, is it slow and awkward to search them?  No more!

In short, a service that allows HTTP GET query to retrieve all impressions for a specific Split key.

https://<lambda function url>/<split_key>

... returns a JSON list of abridged impressions for that split key.

## How does it work?

*digest* is a lambda impressions webhook POST.  It writes impressions in batches of twenty-five to a backing DynamoDB table.  You register it with the Split Impressions Webhook.

*search* uses a global secondary index to pull all the impressions for a specific split key, then return them in JSON form as a response.  It is a GET function URL, its only paramter the Split key you want to query.

Impressions are automatically deleted from the DynamoDB table using its Time to Live (TTL) feature on the *ttl* column of the table, which is in seconds since the epoch (not the usual Split milliseconds since epoch).  You can control the TTL by editing the *digest* lambda script; the script stamps impressions with a TTL when they are loaded to DynamoDB.  Impressions older than the ttl are automatically deleted from the impressions table.

[[Configuring TTL][https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/time-to-live-ttl-before-you-start.html]

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

