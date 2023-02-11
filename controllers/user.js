const connection = require('../utils/connection')
const transportConfig = require('../utils/smtpTransportConfigs')
const getCode = require('../utils/getVerificationCode')
const bcrypt = require('bcrypt')
const fs = require('fs')
const path = require('path')
const execute = require('../utils/query')
const jwt = require('jsonwebtoken')


exports.pushUserNotification = async (req,res) =>{
    const {id} = req.params
    const {title,body,date} = req.body

    let pushQuery = `insert into notifications (userId,title,body,timestamp) values ('${id}','${title}','${body}','${date}')`
    
    try{
        await execute(pushQuery)
        res.sendStatus(200)
    }catch{
        res.sendStatus(500)
    }
}


exports.getUserNotifications = async (req,res) =>{
    const { id } = req.params
    try{
        let notifications = await execute(`select * from notifications where userId='${id}'`)
        return res.status(200).json(notifications)
    }catch{
        return res.status(500).json([])
    }
}

exports.deleteUserNotification = async (req,res) =>{
    const {id} = req.params
    try{
        await execute(`delete from notifications where id='${id}'`)
        res.sendStatus(200)
    }catch{
        res.sendStatus(500)
    }
}

exports.getUserToken = async (req,res) =>{
    let result = (await execute(`select device_token from user where id='${req.params.id}'`))[0]
    res.status(200).json(result['device_token'])
}


exports.removeUserToken = async (req,res) =>{
    const {id} = req.params
    let removeUserTokenQuery = `update user set device_token=NULL where id='${id}'`

    try{
        await execute(removeUserTokenQuery)
        return res.sendStatus(200)        
    }catch{
        return res.sendStatus(500)
    }
}

exports.getUserReports = async (req,res) =>{
    let reports = await execute(`select * from reports where patient_id='${req.params.id}'`)
    res.status(200).json(reports)
}

exports.updateUserToken = async (req,res) =>{
    const {id} = req.params
    const {device_token} = req.body

    let updateUserTokenQuery = `update user set device_token='${device_token}' where id='${id}'`

    try{
        await execute(updateUserTokenQuery)
        return res.sendStatus(200)        
    }catch{
        return res.sendStatus(500)
    }
}

exports.updateUserPassword = async (req,res) =>{
    const {password,newPassword} = req.body;
    const {id} = req.params

    try{
        let originalPassword = (await execute(`select password from user where id=${id}`))[0];
        let matched = await bcrypt.compare(password,originalPassword.password);
        if(matched){
            await bcrypt.hash(newPassword,10).then(async (hashedPassword) =>{
                const updatePasswordQuery = `UPDATE user SET password='${hashedPassword}' WHERE id='${id}'`
                await execute(updatePasswordQuery);
                res.sendStatus(200);
            })
        }else{
            return res.sendStatus(500)
        }
    }catch(error){
        return res.sendStatus(500)
    }
}


exports.getUsers=(req,res)=>{ 
    const getUsersQuery = "SELECT * FROM user"
    connection.query(getUsersQuery,(queryError,queryResult) =>{
        if(queryError) return res.status(500).json(queryError.message)
        return res.status(200).json({
            data:queryResult
        })
    })
}

exports.getUser=(req,res)=>{ 
    const {id} = req.params
    let userDataQuery = `SELECT * FROM user WHERE id='${id}'`
    connection.query(userDataQuery,(queryError,user) =>{
        if(queryError) return res.status(500).json(queryError.message)
        const {firstname,lastname,gender,email,phone,image} = user[0]

        return res.status(200).json({...user[0],password:null})
    })
}

async function parseImageNameWithId(imageName,id){
    let ext = path.extname(imageName);
    return `${id}${ext}`;
}


exports.addUser = async (req,res) =>{
    let {firstname,lastname,email,phone,gender,password,id,imageName,base64Image} = req.body
    let file = Buffer.from(base64Image,"base64")
    let readableImageName = await parseImageNameWithId(imageName,id)
    fs.writeFileSync(path.resolve(__dirname, `../public/assets/${readableImageName}`),file,"utf-8")

    let imageUrl = `http://10.0.2.2:3000/assets/${readableImageName}`
    firstname = firstname.replace(/'/g,"\\'")
    lastname = lastname.replace(/'/g,"\\'")
   
    

    bcrypt.hash(password,10).then(hashedPassword =>{
        const sql = `INSERT INTO user (firstname,lastname,id,gender,email,password,phone,image)
         VALUES ('${firstname}','${lastname}','${id}','${gender}','${email}','${hashedPassword}','${phone}','${imageUrl}')`
        connection.query(sql,async (queryError,result) =>{
            if(queryError){
                return res.status(500).json({
                    success:false,
                    message:queryError.message
                })
            }
    
            jwt.sign({id:id},process.env.JSON_WEB_TOKEN,async (err,token) =>{
                await transportConfig.sendMail({
                    from: `don't wait <dontwaitfir@gmail.com>`, 
                    to: `${email}`,
                    subject: "account activation",
                    text: "please follow this link to activatee your to activate yout account", 
                    html: `please follow this link to activatee your to activate yout account <br> <a href='http://localhost:3000/account/confirmation?token=${token}'>http://localhost:3000/account/confirmation?token=${token}</a>`,
                })
            })
    
            return res.status(201).json({
                success:true
            })
        })
    })
}

exports.updateUser = async (req,res)=>{
    let {firstName,lastName,email,phone,id,image64,imageName} = req.body

    const originalUser = `SELECT * FROM user WHERE id='${id}'`
    
    let imageUrl;

    connection.query(originalUser,async (ouErr,original) =>{
        if(ouErr) return res.status(500).json({
            success:false,
            message:ouErr.message
        })

        let user = original[0]
        firstName = firstName == '' ? user.firstname : firstName
        lastName = lastName == '' ? user.lastname : lastName    
        email = email == '' ? user.email : email
        phone = phone == '' ? user.phone : phone

        let file
        if(image64 == null || imageName == ''){
            imageUrl = user.image
        }else{
            let readableImageName = await parseImageNameWithId(imageName,id)
    
            file = Buffer.from(image64,"base64")
            fs.writeFileSync(path.resolve(__dirname, `../public/assets/${readableImageName}`),file,"utf-8")
            imageUrl = `http://10.0.2.2:3000/assets/${readableImageName}`
        }

        let updateUserQuery = `UPDATE user SET firstname='${firstName}', lastname='${lastName}', email='${email}', phone='${phone}', image='${imageUrl}' WHERE id='${id}'`

        connection.query(updateUserQuery,(error,result) =>{
            if(error) return res.status(500).json({
                success:false,
                message:error.message
            })
            return res.status(301).json({success:true})
        })
    })
}

exports.login = (req,res) =>{
   const {id,password} = req.body;
   const getHashedPassword = `SELECT * FROM user WHERE id='${id}'`

   connection.query(getHashedPassword,(queryError,passwordResult) =>{
    if(queryError){
        return res.status(500).json({
            success:false,
            message:queryError.message
        })
    }

    if(passwordResult.length == 0){
        res.status(404).json({
            success:false,
            message:"404 error no user were found!"
        })
    }else{
        bcrypt.compare(password,passwordResult[0].password).then(isMatched =>{
            if(isMatched){
                if(passwordResult[0].confirmed){
                    return res.status(200).json({
                        success:isMatched,
                        userData:passwordResult[0]
                    })
                }else{
                    return res.status(401).json({
                        success:false,
                        message:'email is not confirmed yet'
                    })
                }
            }else{
                return res.status(401).json({
                    success:false,
                    message:'credentials not match'
                })
            }
        }).catch(() => {
            return res.status(500).json({
                success:false,
                message:'internal sever error'
            })
        })
    }
})
}

