const mysql= require("mysql");
const connection = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:"",
    database:"dontwait",
})


module.exports = connection;