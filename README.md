# userAuth

## UserAuthentication with JsonWebTokens

JsonWebTokens or JWT are used for authentication and sessions. Like sessions JWT can be used to create user-roles, scopes, sessions just like traditinal sessions.

### What seperates JWT from sessions??

Simply, JWT are stateless meaning that sever does not save any information about user which makes the whol authentication system stateless.
With sessions we had to check the server for user infomation and process with the help of information provided by the server, which meant that once the server restarts we lose all our user credentials, leading to a stateful system which needs this continues lookup for functioning.

JWT eliminates all this process by making tokens. Tokens are composed of three parts header(head), payload(body) and singature(sign, tail). This combination of hashed string is then passed to the client which then gets send with each request and the server verifies the string and provides a response in proper manner.

