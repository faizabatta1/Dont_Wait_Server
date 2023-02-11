const express = require('express')
const execute = require('../utils/query')
const router = express.Router()
const transportConfig = require('../utils/smtpTransportConfigs')

router.get('/centres',async (req,res)=>{
    try{
        let centres = await execute("select * from centre")

        return res.render('pages/centres',{
            centres:centres
        })
    }catch(err){
        return res.status(500).json(err.message)
    }
})

router.get('/users',async (req,res) =>{
    let users = await execute("select * from user")

    res.render('pages/users',{
        users:users
    })
})

router.post('/users/:id/delete',async(req,res,next) =>{
    try{
        await execute(`delete from user where id='${req.params.id}'`)
        res.redirect('/admin/users')
    }catch(deleteError){
        res.json("something went wrong: " + deleteError.message)
    }
})
router.post('/centres/:id/delete',async(req,res,next) =>{
    try{
        await execute(`delete from centre where id='${req.params.id}'`)
        res.redirect('/admin/centres')
    }catch(deleteError){
        res.json("something went wrong: " + deleteError.message)
    }
})

router.get('/add',async (req,res) =>{
    let centres = await execute("select * from checkpoint");

    res.render('pages/add',{
        centres:centres
    })
})

router.post('/checkpoint',async (req,res) =>{
    const {data} = req.body

    await execute(`insert into checkpoint (data) values ('${JSON.stringify(data)}')`).then(result =>{    
        return res.sendStatus(200)
    }).catch(() =>{
        return res.sendStatus(500)

    })
})

router.delete('/checkpoint/:id/remove',async (req,res) =>{
    await execute(`delete from checkpoint where id=${+(req.params.id)}`)

    let centres = await execute('select * from checkpoint')
    res.render('pages/add',{
        centres: centres
    })
})


router.post('/request/mail',async (req,res) =>{
    const { email } = req.query
    const { messageDetails } = req.body

    await transportConfig.sendMail({
        from: `don't wait <dontwaitfir@gmail.com>`, 
        to: `${email}`,
        subject: "about your centre request",
        text: messageDetails, 
        html: `<b>${messageDetails}</b>`,
    });

    res.end()
})

router.get('/centres/:id/delete',async (req,res) =>{
    await execute(`delete from centre where id='${req.params.id}'`)
    let centres = await execute('select * from centre')
    res.render('pages/index',{
        centres:centres
    })
})

router.get('/index',async (req,res) =>{
    
    let centres = await execute('select * from centre');

    res.render('pages/index',{
        centres:centres
    })
})

router.get('/login',(req,res) =>{
    res.render('pages/login')
})

router.get('/logout',(req,res) =>{
    res.cookie('logged',false)
    res.redirect('/')
})

router.post('/login',(req,res) =>{
    const {email,password} = req.body
    if(email == "sfhtebatta@gmail.com" && password == "123456"){
        res.cookie('logged',true)
        res.redirect('/')
    }else{
        res.render('pages/login')
    }
})

module.exports = router;