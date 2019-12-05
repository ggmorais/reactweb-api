const cors = require('cors')
const express = require('express')
const bodyParser = require('body-parser')
const fs = require('fs')
const path = require('path')
const multer = require('multer')
const MG = require('mongodb').MongoClient
const ObjectID = require('mongodb').ObjectID


const app = express()
const port = 3001

const upload = multer({dest: '/uploads/images'});
const router = express.Router();

// Express configurations
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false, parameterLimit: 1000000}))


// Url acessible folder
app.use('/public', express.static('public'))


// Database settings
const dbs = {
  host: 'mongodb+srv://root:gm14022001@mongo-db-cekcg.mongodb.net/test?retryWrites=true&w=majority',
  main: 'react',
  users: 'users',
  posts: 'posts'
}


// Init MongoDB
MG.connect(dbs.host, (err, database) => {
  if (err) throw err
  db = database.db(dbs.main)

  // Init server
  app.listen(port)
})

app.get('/connection', (req, res) => {
  res.send({status: 200})
})

app.get('/getCommentaries', (req, res) => {
  db.collection(dbs.posts).findOne({_id: ObjectID(req.query._id)}, (e, r) => {
    res.send(Array(r.commentaries)[0])
  })
})

app.post('/insertCommentary', (req, res) => {
  var userInfos = JSON.parse(req.body.userInfos)
  db.collection(dbs.posts).updateOne({
    _id: ObjectID(req.body._id)
  }, 
  {
    $push: { 
      commentaries: {
        _id: new ObjectID(),
        fullName: userInfos.firstName + ' ' + userInfos.lastName, 
        username: userInfos.username, body: req.body.body, 
        date: req.body.date
      } 
    }
  })

  res.send({done: true})
})

app.get('/getPosts', (req, res) => {
  db.collection(dbs.posts).find(req.query.find).limit(parseInt(req.query.limit)).sort({_id: -1}).toArray((e, r) => {
    // res.send({data: [{a: 123}, {b: 321}, {c: 444}]})
    res.send(r)
  })
})


app.post('/modifyUserImage', upload.single('image'), (req, res) => {
  try {
    if (req.file) {
      let fileName = req.body.username + '.png'
      let pathName = './public/user_images/' + fileName
      fs.rename(req.file.path, pathName, err => {
        if (err) res.send({err: err})
        db.collection(dbs.users).updateOne({username: req.body.username}, {$set: {image: fileName}})
      })
    } else {
      db.collection(dbs.users).updateOne({username: req.body.username}, {$set: {image: null}})
    }
    res.send({done: true})
  } catch (e) {
    res.send({err: e})
  }
})


app.post('/insertPost', upload.single('image'), (req, res) => {
  try {
    if (req.file) {
      var fileName = req.file.filename + '.png'
      var pathName = './public/post_images/' + fileName
      fs.rename(req.file.path, pathName, err => {
        if (err) res.send({err: err})
        db.collection(dbs.posts).insertOne({...req.body, image: fileName})
      })
    } else {
      db.collection(dbs.posts).insertOne({...req.body})
    }
    res.send({done: true})
  } catch (e) {
    res.send({err: e})
  }
})


app.post('/deletePost', (req, res) => {
  try {
    db.collection(dbs.posts).remove({_id: ObjectID(req.body._id)})
    res.send({done: true})
  } catch (e) {
    res.send({err: e})
  }
})

app.post('/getUsers', (req, res) => {
  db.collection(dbs.users).find(req.body).toArray((e, r) => {
    res.send({e, r})
  })
})

app.post('/insertUser', (req, res) => {
  db.collection(dbs.users).find({ $or: [{ email: req.body.email }, { username: req.body.username }] }).toArray((e, r) => {
    if (r.length > 0)
      res.send({ err: 'Email or username already in use.' })
    else
      db.collection(dbs.users).insertOne(req.body)
  })

})

app.post('/insertLikes', (req, res) => {
  // post id
  // username
  // like -1 ~ 1

  var {_id, type, username} = req.body;
  type = parseInt(type);
  console.log('type = ' + type)
  db.collection(dbs.posts).findOne({_id: ObjectID(_id)}, (e, r) => {
    if (type > 0) {
      db.collection(dbs.posts).updateOne(
        {_id: ObjectID(_id)},
        {$pull: {dislikeList: username}}
      );
      db.collection(dbs.posts).updateOne(
        {_id: ObjectID(_id)},
        {$addToSet: {likeList: username}}
      );
      console.log('Likeeeeeeee')
    }
    if (type < 0) {
      db.collection(dbs.posts).updateOne(
        {_id: ObjectID(_id)},
        {$pull: {likeList: username}}
      );
      db.collection(dbs.posts).updateOne(
        {_id: ObjectID(_id)},
        {$addToSet: {dislikeList: username}}
      );
    } else if (type === 0) {
      db.collection(dbs.posts).updateOne(
        {_id: ObjectID(_id)},
        {$pull: {likeList: username, dislikeList: username}}
      );
    }
  });

})


app.post('/login', (req, res) => {
  db.collection(dbs.users).find(req.body).toArray((e, r) => {
    res.send({e, r})
  })
})

