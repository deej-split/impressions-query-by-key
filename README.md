# Impressions Query By Key

Ever needed to know immediately what impressions a customer had recently received? Even if you capture impressions, is it slow and awkward to search them?  No more!

In short, a service that allows HTTP GET query to retrieve all impressions for a specific Split key.

https://<lambda function url>/<split_key>

... returns a JSON list of abridged impressions for that split key.

## How does it work?

*digest* is a lambda impressions webhook.  It writes impressions in batches of twenty-five to a backing DynamoDB table.

*search* uses a global secondary index to pull all the impressions for a specific split key, they return them as JSON form as a response.

## Installation

Currently, the author would have to do an installation.  The lambdas must be set up with permission to DynamoDB, and a suitable DynamoDB table must be created for the backing store, with Global Secondary Index on key.

Provisioning this for a customer should be easy though.

## Limitations

There is currently no attempt at aging out impressions.  The DynamoDB table will grow unbound.  This can be corrected in a future version if it proves necessary.

david.martin@split.io

