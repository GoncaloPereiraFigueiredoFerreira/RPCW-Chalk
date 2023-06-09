var express = require('express');
var router = express.Router();
var User = require("../../controllers/users")

// List of subscription
router.get("/subscriptions/:user", function (req,res){
    User.getUserSubscriptions(req.params.user).then(results=>{
        res.status(200).jsonp(results).end()
    }).catch((err)=>{
        console.log(err)
        res.status(200).end()
    })
})

router.get("/publisher/:user", function (req,res){
  User.getUserPublisher(req.params.user).then(results=>{
      res.status(200).jsonp(results).end()
  }).catch((err)=>{
      console.log(err)
      res.status(200).end()
  })
})



// Profile information
router.get("/info/:user", function (req,res){
    User.getUserInfo(req.params.user).then(result=>{
      res.status(200).jsonp(results).end()
    }).catch((err)=>{
      console.log(err)
      res.status(200).end()
  })
})





module.exports = router;