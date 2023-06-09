const express = require('express');
const router = express.Router();
const axios = require("axios")
const verifyAuthentication = require("./utils").verifyAuthentication
var bagit = require('../bagit/bagit')
const bagFolder = 'bagit/bags'
const dataFolder = 'data'
var fs = require("fs");
let loggedIn={}

let auth_location = process.env.AUTH_SERVER
let archive_location = process.env.ARCH_SERVER
let storage_location = process.env.STORE_SERVER

  
router.get("/sidebar",verifyAuthentication,(req, res, next) =>{
  let promises = []
  promises.push(axios.get(archive_location+"/acess/profile/subscriptions/"+req.user.username))
  promises.push(axios.get(archive_location+"/acess/profile/publisher/"+req.user.username))
  Promise.all(promises).then((results)=>{
    res.status(200).jsonp({subchannels:results[0].data,pubchannels:results[1].data}).end()
  })
})

router.get('/',verifyAuthentication,(req, res, next) =>{
  let promises = []
  promises.push(axios.get(archive_location+"/acess/profile/subscriptions/"+req.user.username))
  promises.push(axios.get(archive_location+"/acess/profile/publisher/"+req.user.username))
  promises.push(axios.get(archive_location+"/acess/posts/user/"+req.user.username))
  promises.push(axios.get(archive_location+"/acess/dates/user/"+req.user.username))
  Promise.all(promises).then((results)=>{
    res.render('dashboard',{
            user:req.user,
            subchannels:results[0].data,
            pubchannels:results[1].data,
            anns: results[2].data,
            dates:results[3].data         
          });
  })
});

router.get("/searchbar/:keywords",verifyAuthentication,(req,res,next)=>{
  axios.get(archive_location+"/acess/channel/search?keywords="+req.params.keywords).then(results=>{
      res.status(200).jsonp(results.data).end()
  })
});

router.get("/search",verifyAuthentication,(req,res,next)=>{
  axios.get(archive_location+"/acess/channel/search?keywords="+req.query.keywords).then(results=>{
    res.render("channel_list",{user:req.user,channels:results.data})
  })
});


/// Login and Register Pages
router.get("/auth/google",(req,res,next)=>{
    axios.get(auth_location+"/auth/google/callback"+req.url.replace("/auth/google","")).then(response=>{    
    if (response.data.success){
        axios.post(archive_location+"/ingest/newaccount",{"email":response.data.email, "name":response.data.first_name +  " " + response.data.last_name}).then(()=>{
          loggedIn[response.data.token]=1
          res.cookie("token",response.data.token)
          res.redirect("/")
      }).catch(err=>{
          loggedIn[response.data.token]=1
          res.cookie("token",response.data.token)
          res.redirect("/")
      })
    }
    else{
      res.redirect("/login")
    }
  });
})

router.get("/forgotPass",(req,res,next)=>{
  res.render("recoverPassword")
});

router.get("/login",(req,res,next)=>{
  res.render("login",{failed:false})
});

router.get("/register",(req,res,next)=>{
  res.render("register")
});

router.post("/login",(req,res,next)=>{
  axios.post(auth_location+"/login",req.body).then(resp=>{
    if (resp.data.success){
      loggedIn[resp.data.token]=1
      res.cookie("token",resp.data.token)
      res.redirect("/")
    }
    else{
      // should have some kind of warning that login failled for some reason
      res.render("login",{failed:true})
    }
  }).catch((err)=>{

    res.render("login",{failed:true})
  })
});

router.post("/register",(req,res,next)=>{
  axios.post(auth_location+"/register",req.body).then(resp=>{
    //respond to client
    if (resp.data.success){
      loggedIn[resp.data.token]=1
      res.cookie("token",resp.data.token)
      axios.post(archive_location+"/ingest/newaccount",{"email":req.body.email, "name":req.body.first_name +  " " + req.body.last_name}).then(()=>{
        res.redirect("/")
      }).catch(err=>console.log(err))
      
    }
    else{
      // should have some kind of warning that login failled for some reason
      res.redirect("/register")
    }
  }).catch((err)=>{
      console.log(err)
      res.redirect("/register")
  })
});

router.get("/logout",verifyAuthentication,(req,res,next)=>{
  delete loggedIn[req.cookies.token]
  res.clearCookie("token");
  res.redirect("login")
})

/// Forms
router.get("/createChannel",verifyAuthentication,(req,res,next)=>{
  
  res.render("createChn_form",{user:req.user,defaultV:{},edit:false})
})

router.post("/createChannel",verifyAuthentication,(req,res,next)=>{
  req.body.publishers=[req.user.username]
  if (req.body.banner===undefined || req.body.banner==="") req.body.banner="https://media.discordapp.net/attachments/733843321671385160/1124079817843818697/image.png?width=1440&height=155"
  console.log(req.body)
  axios.post(archive_location+"/ingest/newchannel",{channel:req.body}).then((response)=>{
    res.redirect("/channel/"+response.data._id)
  }).catch(err=>{res.redirect("/")})
})

module.exports = router;