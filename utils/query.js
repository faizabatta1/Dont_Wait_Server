const connection = require('./connection')

const execute = async (query) =>{
    return new Promise((resolve,reject) =>{
        connection.query(query,(err,result) =>{
            if(err) reject(err)
            else{
                resolve(result)
            }
        })
    })
}

module.exports = execute