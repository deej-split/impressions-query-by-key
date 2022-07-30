# Impressions Query By Key

Ever needed to know immediately what impressions a customer had recently received? Even if you capture impressions, is it slow and awkward to search them?  No more!

In short, a service that allows HTTP GET query to retrieve all impressions for a specific Split key.

https://<lambda function url>/<split_key>

... returns a JSON list of abridged impressions for that split key.

## How does it work?

*digest* is a lambda impressions webhook.  It writes impressions in batches of twenty-five to a backing DynamoDB table.

*search* uses a global secondary index to pull all the impressions for a specific split key, they return them as JSON form as a response.

Impressions are automatically deleted from the DynamoDB table using its Time to Live (TTL) feature on the *time* column of the table, which is in seconds since the epoch (not the usual Split milliseconds since epoch).  Currently, the largest window supported is seven days.  Impressions older than seven days are automatically deleted from the impressions table.

[[Configuring TTL][https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/time-to-live-ttl-before-you-start.html]

## Installation

Currently, the author would have to do the installation.  The lambdas must be set up with permission to DynamoDB, and a suitable DynamoDB table must be created for the backing store, with Global Secondary Index on key.  TTL must be set up on the *time* attribute of the DynamoDB table.

Provisioning this for a customer should be easy though.

## Known Issues

When first creating the database and installing its Global Secondary Index, the search lambda may get errors:

```
ValidationException: Cannot read from backfilling global secondary index: key-index
```

These errors should resolve within a few minutes.

david.martin@split.io

