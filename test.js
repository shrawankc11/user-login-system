const jwt = require('jsonwebtoken')


const token1 = jwt.sign({ name: "shrawan" }, "secret")

// const token2 = jwt.sign({ name: "shreeya" }, 'secret')

const token3 = jwt.sign({ name: "shrawan" }, 'secret')

// console.log(token1)

console.log(token1 === token3)

const verify = jwt.verify(token3, 'secret')
const verify2 = jwt.verify(token1, 'secret')
console.log(verify2)
console.log(verify)


const bcrypt = require('bcrypt')


async function doSmth() {
    const hash = await bcrypt.hash('myplaintext', 10)
    console.log(hash)

    const compare = await bcrypt.compare('myplaintext', hash)

    console.log(compare)
}

// doSmth()
