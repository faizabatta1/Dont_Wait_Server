const connection = require('../utils/connection')

module.exports = codeQuery =>{
    return new Promise((resolve,reject) =>{
        connection.query(codeQuery,(codeError,codeObject) =>{
            if(codeError) return reject(error)
            return resolve(codeObject[0].code)
        })
    })
}