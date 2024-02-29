# What is it?

A simplified OAuth 2.0 flow implementation from scratch without hitting `npm install`.

This is a part of my [_**"Building stuff in Vanilla NodeJS without installing any external packages"**_](https://x.com/sahil_singh37/status/1759523537402868217?s=20) challenge where I try to build non-trivial stuff using raw NodeJS, nothing else.

## Why does this exist?

This challenge is to encourage depth and problem solving in programmers, rather than picking someone else's package and using it mechanically.

You can check out my twitter post below or read the Medium article I wrote to learn more.

[Twitter post](https://x.com/sahil_singh37/status/1759523537402868217?s=20)

Article: [Copy-Paste Programming: Building on Sand](https://medium.com/@sahil.work10/copy-paste-programming-building-on-sand-5722f4b71bc6)

## Scope

The idea was not to make a production-ready OAuth substitute but to replicate the abstract flow as a learning exercise.

It replicates core OAuth concepts and actors like:

- Authorization Server
- Resource Server
- Agent/Client APIs

## Features

- Authorization Server: Handles authentication & authorization
- Resource Server: Serves protected user resources
- Agent/Client: Requests user data on user's behalf
- Access_token: Agents use to access protected resources
- Permissions: Users grants to Agents/Clients with respect to their resources

## How it works

### Access Request & Authorization

The process starts with the agent or client requesting access. Agent also brings in a unique agentUid to create a stateful session.
The user authenticates and authorizes the access request.

A new [_JWT equivalent access_token_](https://github.com/sahilsGit/myOwnJWT) is created with authorized permissions embedded within the payload.

### Access Resource APIs

The agent uses this temporary access token to hit protected resource endpoints.
The verifyToken middleware decodes the JWT equivalent token and verifies the token's authenticity.

The database is queried, and a response is then returned based on the permissions available.

### Change Session Permissions

Authenticated users can change the permissions given to agents at any time. All the authenticated users need to do is hit the changePermissions endpoint.

Updated permissions get embedded in the new access token thereafter.
Unexpired old tokens will still remain valid until expiration unless invalidated manually.
