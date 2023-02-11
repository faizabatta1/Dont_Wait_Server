const connection = require('../utils/connection')
const transportConfig = require('../utils/smtpTransportConfigs')
const getCode = require('../utils/getVerificationCode')
const bcrypt = require('bcrypt')

exports.createVerificationCode = (req,res) =>{
    const email = req.body.email
    let code = String(Math.floor(1000 + Math.random() * 9000))
    let checkForGmail = `SELECT * FROM verification_codes WHERE email='${email}'`
    let updateGmailCode = `UPDATE verification_codes SET code='${code}' WHERE email='${email}'`
    let addCode = `INSERT INTO verification_codes VALUES ('${email}','${code}')`;

    connection.query(checkForGmail,(err,emailResult) =>{
        if(err) console.log(err)
        if(emailResult.length > 0){
            connection.query(updateGmailCode,(updateResult,updateError) =>{})
        }else{
            connection.query(addCode,(queryError,queryResult) =>{
                if(queryError) console.log(queryError)
            })
        }
    })

    res.status(200).json({
        success:true
    })
}


exports.sendVerifyCode = async (req,res) =>{
    const email = req.headers['email']
    const getCodeQuery = `SELECT code FROM verification_codes WHERE email='${email}'`
    
    try{
        let code = await getCode(getCodeQuery)

        await transportConfig.sendMail({
            from: `don't wait <dontwaitfir@gmail.com>`, 
            to: `${email}`,
            subject: "verify your password",
            text: `your verification code is ${code}`, 
            html: `<b>your verification code is ${code}</b>`,
        });
        res.status(200).json({
            success: true,
            code:code
        })
    }catch(transportError){
        res.status(500).json({
            success: false,
            error:transportError.message
        })
    }
}

exports.compareCodes = async (req,res) =>{
    const { email,code } = req.body
    const getCodeQuery = `SELECT code FROM verification_codes WHERE email='${email}'`
    
    try{
        let realCode = await getCode(getCodeQuery)
        if(code === realCode){
            res.status(200).json({
                success:true,
                message:"they are the same"
            })
        }else{
            res.status(400).json({
                success:false,
                message:"the code you have entered is not correct!",
            })
        }
    }catch(fetchCodeError){
        res.status(400).json({
            success:false,
            message:"something went wrong",
            error: fetchCodeError.message
        })
    }
    
}

exports.resetPassword = (req,res) =>{
    const {newPassword,email} = req.body
    bcrypt.hash(newPassword,10).then(hashedPassword =>{
            
        const updatePasswordQuery = `UPDATE user SET password='${hashedPassword}' WHERE email='${email}'`
        connection.query(updatePasswordQuery,(updateError,updateResult) =>{
            if(updateError) console.log(updateError)
            return res.status(301).json({
                success:true,
                message:"password updated successfully"
            })
        })
    })
}
