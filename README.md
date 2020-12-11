# total-expert-node

A functional wrapper to communicate with v1 of the [Total Expert](https://totalexpert.com/) REST API.

## Contents

* [Authentication](#-Authentication)
* [Interacting With Entities](#-interacting-with-entities)
* [Available Entities](#-available-entities)
* [Working with other Endpoints](#-interacting-with-other-endpoints)
* [Contributing](#-contributing)

## Getting Started
```
npm install total-expert-node
```

Import and include your client ID and client secret:
```ts
import TotalExpert from 'total-expert-node';

const totalExpert = new TotalExpert({
  clientId: '<YOUR-CLIENT-ID>',
  clientSecret: '<YOUR-CLIENT-SECRET>',
});

(async () => {
  const loans = await totalExpert.loans.getMany();
  console.log(loans);
})();
```

## 🔒 Authentication

Your instance of `TotalExpert` needs a token stored in it before it will be able to access protected resources from the API. It will attempt to exchange the provided `clientId` and `clientSecret` for a token (using the `client_credentials` flow) by calling it's `totalExpert.auth.authenticate()` method before fetching a protected resouce under two conditions:

1. It currently does not have a token stored in the instance.
2. The last call it made received a `401` response.

In the event of case #2, it will request a new token and then automatically (unless configured not to) retry the request that received a `401`.

By default, the authentication flow will only allow one inflight promise for a token at a time. This means that multiple closely timed or simultaneous calls from the authentication flow will only make one API call and will all resolve to the same token value.

### What If I Already Have a Token?

You can initialize your instance of `TotalExpert` with a bearer token:

```ts
import TotalExpert from 'total-expert-node';

const totalExpert = new TotalExpert({
  accessToken: '<YOUR_TOKEN>',
  // ...your id, secret and other config values
});
```
It will use this token until it receives a `401` and then will go through the authentication flow outlined above.

### Can I Create Multiple Instances?

At this time, `total-expert-node` is a singleton and can only have one instance. Follow [this issue](https://github.com/peoplesmortgage/total-expert-node/issues/4) for details.

### Can I Change The Authentication Flow?

You can initialize your instance with an asynchronous `onAuthenticate` function. This function will be invoked instead of the standard authentication function and will be provided your instance's [Authentication instance](#authentication-methods) (the same object available at `new TotalExpert().auth`) so you'll have access to all of its methods.

For example:

```ts
import TotalExpert, { TotalExpertAuth } from 'total-expert-node';
import someCustomAction from './someCustomAction';

const onAuthenticate = async (auth: TotalExpertAuth): Promise<void> => {
  const token = await someCustomAction();
  if (token) {
    auth.setAccessToken(token);
    return;
  }
  await auth.authenticate();
};

const totalExpert = new TotalExpert({
  onAuthenticate,
  clientId: '<YOUR-CLIENT-ID>',
  clientSecret: '<YOUR-CLIENT-SECRET>',
});
```

Leaving `onAuthenticate` empty is functionally the same as:

```ts
import TotalExpert, { TotalExpertAuth } from 'total-expert-node';

const totalExpert = new TotalExpert({
  onAuthenticate: async (auth: TotalExpertAuth) => auth.authenticate(),
  clientId: '<YOUR-CLIENT-ID>',
  clientSecret: '<YOUR-CLIENT-SECRET>',
});
```

### Can I Use My Test Environment Credentials?

You can include an `environment` key in the object given to the constructor to target which Total Expert environment you would like to use. If omitted, will default to production.

```ts
import TotalExpert from 'total-expert-node';

const totalExpert = new TotalExpert({
  environment: 'https://my-test-environment.totalexpert.net',
  // ...your id, secret and other config values
});
```

### Authentication Methods

The following methods are available on the Authentication class which can be accessed at the `.auth` property of your instance of `TotalExpert`.

#### setAccessToken()

Sets your instance's `accessToken` property to the value provided. This will be stored until a `401` response is received when requesting a protected resource.

```ts
totalExpert.auth.setAccessToken('some-new-token-value');
```

Parameters:
* token: `string | null` Can be set to `null` to effectively 'log out'.

This method does not have a return value.


#### getAccessToken()

Retrieves your instance's currently stored access token.

```ts
const myToken: string | null = totalExpert.auth.getAccessToken();
```

Returns `string` or `null` (whatever the value of your access token is).

#### authenticate()

Will exchange the provided client ID and client secret for an access token and store it to the instance.

```ts
await totalExpert.auth.authenticate();
```

This method returns a promise that does not resolve to any value.

#### tokenFromAuthCode()

Exchanges an authorization code for a token using the instance's client ID and secret.

```ts
const response = await totalExpert.auth.tokenFromAuthCode('auth-code-value', 'https://my-redirect-url.com');
const tokenData = await response.json();
```

Parameters:
* code: `string`
* redirect_uri: `string`

Returns the [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) of the authorization code exchange provided from the API.

#### refreshToken()

Exchanges a refresh token for an access token using the instance's client ID and client secret.

```ts
const response = await totalExpert.auth.refreshToken('my-refresh-token');
const tokenData = await response.json();
```

Parameters:
* refresh_token: `string`

Returns the [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) of the refresh token exchange provided from the API.

## 📖 Interacting With Entities

All of the functions that interact with Total Expert entities are instances of one of the following classes. Each one is determined by what endpoints are available from the API.

### PartialService

#### get()

Retrieve a specific item by its Total Expert ID.
```ts
await totalExpert.loans.get('<unique-loan-id>');
```
Parameters:
* TotalExpertId: `string | number`;

Returns a promise that resolves to the entity type requested.

#### getMany()

Retrieve a set of entities. The API follows a pagination-style pattern, and can be provided optional page offset and number-per-page arguments.

```ts
await totalExpert.loans.getMany(1, 20);
```

Parameters:
* offset?: `number` defaults to `0`
* results?: `number` defaults to `10`

Returns a promise that resolves to the JSON response from the API.

#### create()

Create an entity of the type (in the example below, a loan) this method is called from.

```ts
await totalExpert.loans.create({
  // ...the information to create the loan from.
})
```

Parameters:
* data: `varied` The type is determined by the entity type being created.

Returns a promise that resolves to the JSON response from the API.

### FullService

All entities of this type have the methods included in a [PartialService](#PartialService), as well as the following.

#### update()

Update an entity.

```ts
await totalExpert.loans.update('<unique-loan-id>', {
  // ...the information to update the loan with
})
```

Parameters:
* id: `string | number`
* data: `varied` The type is determined by the entity type being updated.

Returns a promise that resolves to the JSON response form the API.

#### delete()

Delete an entity by its ID.

```ts
await totalExpert.loans.delete('<unique-loan-id>');
```

Parameters:
* id: `string | number`

Returns a promise that does not resolve to any value.

### AdminFullService

Any entity of this type has all the functionality of a [FullService](#FullService) and a `createAsAdmin()` method as well.

In the case where an entity has two different creation methods (one for a standard user, and one for an admin user), the entity will include the admin creation method. 

This is functionally the same as the `create()` method, however will expect a type that is more strict. Typically it expects an `owner` key included, as the owner is not implied when using admin credentials. The difference is only in typing, so these two methods behave identically in JavaScript, but can be used for more declarative code if desired.

#### createAsAdmin()

Used to add a record of the this type. Takes a different type than the standard `create()` method, but otherwise functions the same.

```ts
await totalExpert.loans.createAsAdmin({
  // ...the information to create the loan from.
})
```

Parameters:
* data: `varied` The type is determined by the entity type being created.

Returns a promise that resolves to the JSON response from the API.

## 🏦 Available Entities

Currently the following keys and their corresponding entities are available:

* Campaign Activity at `.campaignActivity` of type [FullService](#FullService)
* Campaigns at `.campaigns` of type [PartialService](#PartialService)
* Contacts at `.contacts` of type [AdminFullService](#AdminFullService)
* Contact Groups at `.contactGroups` of type [AdminFullService](#AdminFullService)
* Contact Notes at `.contactNotes` of type [AdminFullService](#AdminFullService)
* Insights at `.insights` of type [PartialService](#PartialService)
* Loans at `.loans` of type [AdminFullService](#AdminFullService)

## 🌐 Interacting with Other Endpoints

If the entity or endpoint is not declared above, (please consider opening a PR to add it!) you can interact with any Total Expert API endpoint using your instance's `.fetch` method. All of the declared calls are essentially just wrappers around this method for type enforcing and convenience. This is essentially a wrapper around [node-fetch](https://www.npmjs.com/package/node-fetch) that follows the [fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) except for three key differences:

1. It will automatically include the needed headers to authenticate with the API for you, and will authenticate (or call your `onAuthenticate` function) initially and on expired tokens.
2. The first argument must be a relative path to the `environment` provided to your instance. If none are provided, the default production url for the Total Expert API is used.
3. There is an optional third boolean argument that can be set to prevent the automatic retry should the first call fail due to authentication.

For example:

```ts
import TotalExpert, { GetManyResponse, TotalExpertContact } from 'total-expert-node';

const totalExpert = new TotalExpert({
  // ...your client ID, client secret, and any constructor config values
});

// calling the getMany method here:
const contactsFromDeclared = await totalExpert.contacts.getMany(1, 25);

// will do the same thing as calling the fetch method and providing the types:
const contactsResponse = await totalExpert.fetch('/v1/contacts?page[number]=1&page[size]=25');
const contactsFromFetch: GetManyResponse<TotalExpertContact> = await contactsResponse.json();

// you can hit any endpoint:
const getTeam = await totalExpert.fetch('/v1/teams/<TEAM-ID>');

// and include request options if needed:
const newTeam = await totalExpert.fetch('/v1/teams', {
  method: 'POST',
  body: JSON.stringify({
    team_name: 'My New Cool Team',
    managers: [
      { username: 'jsmith' },
    ],
  }),
});
```

## 🏆 Contributing

PRs are always welcome. Please ensure that all tests pass and coverage does not decrease (unless otherwise specified) before opening your PR. Currently, there are many declared entities that have no or incomplete types, so any contribution there would be very welcome.
