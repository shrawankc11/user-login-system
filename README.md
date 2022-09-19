# userAuth

## UserAuthentication with JsonWebTokens✨✨

JsonWebTokens or JWT is used for authentication and sessions. Like sessions JWT can be used to create user-roles, scopes, sessions similar to traditinal sessions🦾🦾.

### What seperates JWT from Sessions??

Simply, JWT are stateless meaning that sever does not save any information about user which makes the whole authentication system stateless.
With sessions there is a continous lookup in the server and also the DataBase(in some cases), for user infomation and process with the help of information provided by the server, which meant that once the server restarts we lose all our user credentials. Storing the user session information in DataBase is an  viable option since database persists. Due to this constant lookup in database the response time increases significantly. Leading to a stateful and slower system which needs this continues lookup for functioning.

JWT makes the process easier by creating tokens. Tokens are composed of three parts header(head), payload(body) and singature(sign). This combination of hashed string is then passed to the client which then gets sent with each request and the server verifies the string and provides a response in proper manner. This process eliminated the process of continous lookup and improve response time significantly. 

More about JWT at 👉https://jwt.io/
