const connection = require('../utils/connection')
const bcrypt = require('bcrypt')
const data = require('../testTimes.json')
const execute = require('../utils/query')
const path = require('path')
const fs = require('fs')
const transportConfig = require('../utils/smtpTransportConfigs')


async function parseImageNameWithId(imageName,id){
    let ext = path.extname(imageName);
    return `${id}${ext}`;
}

exports.addNewCentre = async (req,res) =>{
    const {tests,branches,email,placename,description,password,phone,open_time,close_time,image_name,id,base64Image,location} = req.body

    
    try{
        let file = Buffer.from(base64Image,"base64")
        let readableImageName = await parseImageNameWithId(image_name,id)
        fs.writeFileSync(path.resolve(__dirname, `../public/assets/${readableImageName}`),file,"utf-8")

        let imageUrl = `http://10.0.2.2:3000/assets/${readableImageName}`

        bcrypt.hash(password,10).then(hashedPassword =>{
            const sql = `INSERT INTO centre (location,description,placename,id,email,phone,password,medicalTests,branches,openTime,closeTime,image) 
            VALUES ('${JSON.stringify(location)}','${description}','${placename}','${id}','${email}','${phone}','${hashedPassword}','${tests}','${branches}','${open_time}','${close_time}','${imageUrl}');`
            connection.query(sql,(queryError,result) =>{
                if(queryError){
                    return res.status(500).json({
                        success:false,
                        message:queryError.message
                    })
                }
        
                return res.status(201).json({
                    success:true,
                    message: "a new was user succussfully created",
                    data: result
                })
        
                
            })
        })
    }catch(err){
        return res.status(500).json({
            success:false,
            message:err.message
        })
    }
}



exports.getCentres = (req,res) =>{
    let centresQuery = "SELECT * FROM centre"
    connection.query(centresQuery,(err,centres) =>{
        if(err) return res.status(500).json(err.message)
        return res.status(200).json(centres)
    })
}


exports.loginCentre = (req,res) =>{
    const {id,password} = req.body
    const loginQuery = `SELECT * FROM centre WHERE id='${id}'`

    connection.query(loginQuery,(queryError,result) =>{
        if(queryError) return res.status(500).json({
            success:false,
            message:queryError.message
        })
        
        let realPassword = result[0].password

        bcrypt.compare(password,realPassword).then(isMatched =>{
            return res.status(200).json({
                success:true,
                matched: isMatched,
                data:result[0]
            })
        })
    })
}

function compareTimes(openTime,closeTime,patientTime){


    let [openHours,openMinutes] = openTime.split('-')
    let [closeHours,closeMinutes] = closeTime.split('-')
    let [patientHours,patientMinutes] = patientTime.split('-')
    //for example close = 15-00 and pTime = 15:00 + testTime => 15:00 + 30 
    if(+openHours - +patientHours <= 0 && +closeHours - +patientHours >= 0){
        return true;
    }
    return false;
}

async function checkTotalTestsTime(centreId,date,testName,totalWorkTime){    
    try{
        let allExistingTests = `select test from reservations where centreId='${centreId}' and date='${date}' and test='${testName}'`
        let tests = await execute(allExistingTests)
        //test for only 2 tests of amin
        let totalTime = ((tests.length * +data[testName]) + +data[testName]) <= totalWorkTime //
        return totalTime
    }catch(error){
        return false;
    }
}

exports.reserveNewAppointment = async (req,res) =>{
    const {centreId,userId,typeOfTests,date,time,centre_name,patient_name} = req.body;
    const addTest = `insert into reservations (centreId,patientId,test,date,time,centre_name,patient_name) values ('${centreId}','${userId}','${typeOfTests}','${date}','${time}','${centre_name}','${patient_name}')`
    const isTestExistsQuery = `select * from reservations where date='${date}' and test='${typeOfTests}' and centreId='${centreId}' and patientId='${userId}'`
    const workHoursQuery = `select openTime,closeTime from centre where id='${centreId}'`

    try{
        // get test
        let tests = await execute(isTestExistsQuery)
        //task doesn't exist when tests.length = 0 or empty
        if(tests.length == 0){
            let {openTime,closeTime} = (await execute(workHoursQuery))[0]
            if(compareTimes(openTime,closeTime,time)){
                if(await checkTotalTestsTime(centreId,date,typeOfTests,(+closeTime.split('-')[0] - +openTime.split('-')[0]) * 60)){ // false
                    let result = await execute(addTest)
                    if(result){
                        //201 for created
                        return res.status(201).json({
                            success:true,
                            message:"new booking has been added successfully"
                        })
                    }else{
                        return res.status(500).json({
                            success:false,
                            message:"check the type of your booking data"
                        })
                    }
                }else{
                    return res.status(400).json({
                        success:false,
                        message:"try another date,centre is full"
                    })
                }
            }else{
                return res.status(400).json({
                    success:false,
                    message:"test time is out of centre workHours Range"
                })
            }
        }else{
            return res.status(400).json({
                success:false,
                message:"booking already exists"
            })
        }
    
    }catch(e){
        return res.status(500).json({
            success:false,
            message:e.message
        })        
    }
}


exports.deleteAppointment = (req,res) =>{
    const {id} = req.body
    const deleteQuery = `delete from reservations where id='${id}'`
    execute(deleteQuery).then(result =>{
        return res.sendStatus(200)
    }).catch(err =>{
        return res.status(500).json({
            error:err.message
        })
    })
}

exports.updateAppointment = async (req,res) =>{
    let data = {id,date,time,test,centreId} = req.body.data
    const originalDataQuery = `SELECT * FROM reservations where id='${id}'`
    try{
        let appointment = (await execute(originalDataQuery))[0]
        for(const key in data){
            if(data[key] == '' || data[key] == undefined || data[key] == null) data[key] = appointment[key]
        }
        let {id,date,time,test,centreId} = data


        const workHoursQuery = `select openTime,closeTime from centre where id='${centreId}'`
        let {openTime,closeTime} = (await execute(workHoursQuery))[0]
        if(compareTimes(openTime,closeTime,time,test) && await checkTotalTestsTime(centreId,date,test)){
            const updateQuery = `update reservations set date='${date}', time='${time}', test='${test}' where id='${id}'`
            await execute(updateQuery).then(() =>{
                return res.sendStatus(200)
            })    
        }else{
            return res.sendStatus(400)
        }
        
    }catch(err){
        return res.status(500).json({
            error:err.message
        })
    }
}

exports.updateAppointmentStatus = async (req,res) =>{
    const { id } = req.params
    const { newStatus } = req.body

    try{
        await execute(`update reservations set status='${newStatus}' where id='${id}'`)
        return res.status(200).json("done")
    }catch(error){
        return res.status(500).json("error")
    }
}


exports.getAllUserAppointments = async (req,res) =>{
    try{
        let reservations = await execute(`select * from reservations where patientId='${req.params.id}'`)
        res.status(200).json(reservations)    
    }catch(err){
        return res.status(500).json([])
    }
}

exports.getAllCentreAppointments = async (req,res) =>{
    const {id} = req.params
    try{
        let reservations = await execute(`select * from reservations where centreId='${id}'`)
        return res.status(200).json(reservations)    
    }catch(err){
        return res.status(500).json([])
    }
}

exports.getCentre = async (req,res) =>{
    try{
        let centre = await execute(`select * from centre where id='${req.params.id}'`)
        return res.status(200).json(centre[0])
    }catch(err){
        return res.status(500).json({})
    }
}

exports.pushTestReport = async (req,res) =>{
const { patient_name,test_type,result,date,status,patient_id,centre_name,result_type,centre_id } = req.body

    try{
        await execute(`insert into reports (centre_id,result_type,patient_name,test_type,result,date,status,patient_id,centre_name)
         values ('${centre_id}','${result_type}','${patient_name}','${test_type}','${result}','${date}','${status}','${patient_id}','${centre_name}')`)
        return res.status(201).json("pushed")
    }catch(error){
        return res.status(500).json("failed to push")
    }
}

exports.pushFeedback = async (req,res) =>{
    const {centre_name,centre_id,patient_name,patient_id,rating,comment} = req.body
    let pushQuery = `insert into feedbacks (centre_name,centre_id,patient_name,patient_id,rating,comment) values
        ('${centre_name}','${centre_id}','${patient_name}','${patient_id}','${rating}','${comment}')`

    try{
        await execute(pushQuery)
        let result = (await execute(`select SUM(rating) sum,COUNT(rating) count from feedbacks where patient_id='${patient_id}' and centre_id='${centre_id}'`))[0]
        let newRatingScore = result.sum / result.count;
        await execute(`update centre set rating_score=${newRatingScore} where id='${centre_id}'`)
        return res.status(201).json({
            success:true
        })
    }catch(err){
        return res.status(500).json({
            success:false,
            message:err.message
        })
    }
}

exports.getFeedbacks = async (req,res) =>{
    console.log(req.params);
    const {id} = req.params
    try{
        let feedbacks = await execute(`select * from feedbacks where centre_id='${id}'`)
        console.log(feedbacks);
        return res.status(200).json(feedbacks)
    }catch(err){
        return res.status(500).json([])
    }
}