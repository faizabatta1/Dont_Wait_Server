const connection = require("../utils/connection")
const execute = require("../utils/query")

exports.getHealthNews = async (req,res) =>{
    // const axios = require("axios");

    // const options = {
    //   method: 'GET',
    //   url: 'https://heath-news.p.rapidapi.com/news',
    //   headers: {
    //     'X-RapidAPI-Key': 'bd3eb0a2a4mshc8c712187942acbp1ac7b7jsnd16cc7b0c658',
    //     'X-RapidAPI-Host': 'heath-news.p.rapidapi.com'
    //   }
    // };
    
    // axios.request(options).then(function (response) {
    //     res.send(response.data)
    // }).catch(function (error) {
    //     console.error(error);
    // });
    const query = "SELECT * FROM news"

    connection.query(query,(err,news) =>{
      if(err) return res.status(500).json([]);
      return res.status(200).json(news)
    })
    
}
exports.getDiseas= async(req,res)=>{
  const query = "SELECT * FROM disease"

  connection.query(query,(err,disease) =>{
    if(err) return res.status(500).json([]);
    return res.status(200).json(disease)
  })
}

/*exports.getLowCarbRecipes = async (req,res) =>{
  const axios = require("axios");

  const options = {
    method: 'GET',
    url: 'https://low-carb-recipes.p.rapidapi.com/random',
    headers: {
      'X-RapidAPI-Key': 'bd3eb0a2a4mshc8c712187942acbp1ac7b7jsnd16cc7b0c658',
      'X-RapidAPI-Host': 'low-carb-recipes.p.rapidapi.com'
    }
  };
  
  axios.request(options).then(function (response) {
    console.log(response.data);
  }).catch(function (error) {
    console.error(error);
  });
}*/


exports.determineUserType = async (req,res) =>{
  let {id} = req.params

  let user = await execute(`select * from user where id='${id}'`)
  let centre = await execute(`select * from centre where id='${id}'`)

  if(user.length > 0) return res.status(200).json("user")
  else if(centre.length > 0) return res.status(200).json("centre")
}