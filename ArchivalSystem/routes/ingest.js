var express = require('express');
var router = express.Router();
var Users = require("../controllers/users")
var Channels = require("../controllers/channel");
var Announcements = require('../controllers/announcements');
var Metadata = require('../controllers/metadata');
var Dates = require("../controllers/important_dates")


router.post("/uploadfile", function(req,res){
  return Metadata.addFileMetadata(req.body.file)
          .then((res_file) => { 
            console.log(res_file)
            Channels.addFile(req.body.channel,req.body.path,res_file._id)
              .then(() => { res.sendStatus(200) })
              .catch((err)=>{ console.log(err); res.sendStatus(500) })
          })
          .catch((err) => {console.log(err); res.sendStatus(500)})
})

// remove file
router.delete("/rmfile/:fileID", function(req, res){
  Metadata.deleteFileByID(req.params.fileID)
    .then((result) => { res.status(200).jsonp(result).end() })
    .catch((err) => { res.status(500).jsonp(err).end() })
})

// remove file from channel
router.put("/rmfile/:fileID", function(req, res){
  Channels.rmFile(req.body.channel, req.body.path, req.params.fileID)
    .then((result) => { res.status(200).jsonp(result).end() })
    .catch((err)=>{ console.log(err); res.sendStatus(500) })
})

router.delete("/rmdir/:chID", function(req, res){
  if ('dir' in req.query){
    let dir = req.query['dir'].substring(1, req.query['dir'].length - 1)
    Channels.removeDir(req.params.chID, dir)
      .then((result) => { res.status(200).jsonp(result).end() })
      .catch((err)=>{ console.log(err); res.sendStatus(500) })
  }
  else{
    res.sendStatus(404)
  }
})

router.post("/submitfile", function(req,res){
  return Metadata.addFileMetadata(req.body.file)
          .then((res_file) => {
            let idate = req.body.submission
            let file_submitted = {
              description: req.body.description,
              file: res_file._id,
              deliver_date: new Date().toISOString().substring(0,16),
              student: req.body.user
            }

            Dates.addSubmission(idate, file_submitted)
              .then((result) => { res.status(200).jsonp(result).end() })
              .catch((err)=>{ console.log(err); res.sendStatus(500) })
          })
          .catch((err) => {console.log(err); res.sendStatus(500)})
})

router.post("/newdate",function(req,res){
  return Dates.createImportantDate(req.body.date).then(()=>{
    res.sendStatus(200)
  }).catch((err)=>{
      //ver erro e responder em conformidade
      console.log(err)
      res.sendStatus(500)
  })
})

router.post("/newpost",function(req,res){
    //Should check if user is compatible with channel, and existance of channel and user
    return Announcements.createNewAnn(req.body.user,req.body.announcement).then(()=>{
      res.sendStatus(200)
    }).catch((err)=>{
        //ver erro e responder em conformidade
        console.log(err)
        res.sendStatus(500)
    })
})

router.post("/newcomment",function(req,res){
  return Announcements.addComment(req.body.user,req.body.announcement, req.body.content).then(()=>{
    res.sendStatus(200)
    }).catch((err)=>{
        //ver erro e responder em conformidade
        console.log(err)
        res.sendStatus(500)
    })
})


router.post("/addFile",function(req,res){
  console.log(req.body)
  return Channels.addFile(req.body.channel,req.body.path,req.body.file).then(()=>{
    res.sendStatus(200)
  }).catch((err)=>{
      //ver erro e responder em conformidade
      console.log(err)
      res.sendStatus(500)
  })
})




router.post("/newdir",function(req,res){
  return Channels.getChannelContents(req.body.channel)
    .then((channel) => {
      let alreadyExists = false

      for(let i in channel.contents){
        dir = channel.contents[i]
        if (dir.path === req.body.path){
          alreadyExists = true
          break
        }
      }
      
      if (alreadyExists){
        res.sendStatus(400)
      }
      else{
        return Channels.createDir(req.body.channel, req.body.path)
          .then(() => { res.sendStatus(200) })
          .catch((err) => { console.log(err); res.sendStatus(500) })
      }
    })
    .catch((err) => { console.log(err); res.sendStatus(500) })
})


router.post("/newchannel",function(req,res){
  return Channels.createNewChannel(req.body.channel)
    .then((result) => {
      Channels.createDir(result._id, '')
        .then((result2) => {
          Users.addPublisher(req.body.channel.publishers[0],result._id).
            then(()=>{
              res.status(200).jsonp(result).end()
            })
            .catch(err => { console.log(err); res.sendStatus(500) })
        .catch((err) => { console.log(err); res.sendStatus(500) })
        })
    })
    .catch((err)=> { console.log(err); res.sendStatus(500) })
})

router.post("/newaccount",function(req,res){
  return Users.createUser(req.body).then(()=>{
      res.sendStatus(200)

  }).catch((err)=>{
      console.log(err)
      //ver erro e responder em conformidade
      res.sendStatus(500)
  })
})

router.post("/addsubscription",function(req,res){
  let usr_email = req.body.user
  let channel = req.body.channel
  return Promise.all([Users.existsUser(usr_email),Channels.existsChannel(channel)]).then((results)=>{
    if (!results.includes(null)){
      return Promise.all(
        [
          Users.addSubscription(usr_email,channel),
          Channels.addSubscriptor(usr_email,channel)
        ]).then(()=>{
          res.sendStatus(200)
        }).catch((err)=>{
          console.log(err)
          //ver erro e responder em conformidade
          res.sendStatus(500)
      })
    } else {
      res.sendStatus(500)
    }
  })
})


router.post("/remsubscription",function(req,res){
  let usr_email = req.body.user
  let channel = req.body.channel
  return Promise.all([Users.existsUser(usr_email),Channels.existsChannel(channel)]).then((results)=>{
    if (!results.includes(null)){
      return Promise.all(
        [
          Users.remSubscription(usr_email,channel),
          Channels.remSubscriptor(usr_email,channel)
        ]).then(()=>{
          res.sendStatus(200)
        }).catch((err)=>{
          //ver erro e responder em conformidade
          res.sendStatus(500)
      })
    } else {
      res.sendStatus(500)
    }
  })
})


module.exports = router;