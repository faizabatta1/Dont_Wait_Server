require('dotenv').config();

const express = require("express");
const app = express();
const path = require('path')
const cors = require('cors')
const userRouter = require('./routes/user');
const verifyRouter = require('./routes/verify')
const centreRouter = require('./routes/centre')
const bodyParser= require('body-parser')
const homeRouter = require('./routes/home')
const dashboard = require('./routes/admin');
const jwt = require('jsonwebtoken')
const connection = require("./utils/connection");
const cookieParser = require('cookie-parser');
const execute = require("./utils/query");

connection.connect(err =>{
    if(err) console.log(err.message);
});
connection.on('error',function(err){
    if(err.code == 'PROTOCOL_CONNECTION_LOST'){
        connection.connect(err =>{
            if(err) console.log(err.message);
        })
    }
})

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}));
app.use(cookieParser())
app.use(express.static(path.resolve(__dirname,'public')))
app.set('view engine','ejs')
app.use(cors())

const PORT = 3000;



app.use('/api',homeRouter)
app.use('/users',userRouter);
app.use('/login/verify',verifyRouter)
app.use('/admin',dashboard)

app.get('/',(req,res) =>{

    if(req.cookies.logged == 'false'){
       res.redirect('/admin/login')
    }else{

        res.render('home',{
            welcomeMessage:"welcome admin.."
        })
    }
})

app.get('/account/confirmation',async (req,res) =>{
    let token = req.query.token
    jwt.verify(token,process.env.JSON_WEB_TOKEN,async (err,result) =>{
        if(result){
            await execute(`update user set confirmed=1 where id='${result.id}'`)
            res.end('your email is confirmed you can go back to the application and re-login.')
        }
    })
})

app.use(centreRouter)
app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));

