# user-authentication-jwt

## User Authentication with JsonWebTokens✨✨

JsonWebTokens or JWT is used for authentication and sessions. Like sessions JWT can be used to create user-roles, scopes, sessions similar to traditinal sessions🦾🦾.

### What seperates JWT from Sessions??

Simply, JWT is stateless meaning that sever do not have to save any information about the user client making the whole authentication system stateless.
With sessions there is a continous lookup in the server and also the database(in some cases), which means that once the server restarts we lose all our user credentials. Storing the user session information in database is an  viable option since database persists. Due to this constant lookup in database the response time increases significantly. Leading to a stateful and slower system which needs this continues lookup for functioning.

JWT makes the process easier by creating tokens. Tokens are composed of three parts header(head), payload(body) and singature(sign). This combination of hashed string is then passed to the client which then gets sent with each request and the server verifies this hash string. This process eliminated the process of continous lookup and improve response time significantly. 

More about JWT at 👉https://jwt.io/
