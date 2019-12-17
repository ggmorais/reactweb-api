const cors = require('cors')
const express = require('express')
const bodyParser = require('body-parser')
const fs = require('fs')
const path = require('path')
const multer = require('multer')
const MG = require('mongodb').MongoClient
const ObjectID = require('mongodb').ObjectID
const PORT = process.env.PORT || 5000

const app = express()


const upload = multer({dest: __dirname + '/uploads/images'});
const router = express.Router();

// Express configurations
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false, parameterLimit: 1000000}))


// URL acessible folder
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
  app.listen(PORT)
})

app.get('/connection', (req, res) => {
  res.send({status: 200})
})

app.get('/dirname', (req, res) => {
	res.send(__dirname)
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
  console.log('Receiving request');
  db.collection(dbs.posts).find(req.query.find).limit(parseInt(req.query.limit)).sort({_id: -1}).toArray((e, r) => {
    res.send(r);
  })
})


app.post('/modifyUserImage', upload.single('image'), (req, res) => {
  try {
    if (req.file) {
      let fileName = req.body.username + '.png'
      let pathName = __dirname + '/public/user_images/' + fileName
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

/**
 * @POST
 * @upload image
 * @str body
 * @str date
 */
app.post('/insertPost', upload.single('image'), (req, res) => {
  try {
    if (req.file) {
      var fileName = req.file.filename + '.png'
      var pathName = __dirname + '/public/post_images/' + fileName
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


/**
 * @POST
 * @int _id
 */
app.post('/deletePost', (req, res) => {
  try {
    db.collection(dbs.posts).remove({_id: ObjectID(req.body._id)})
    res.send({done: true})
  } catch (e) {
    res.send({err: e})
  }
})


/**
 * @POST
 * @any
 */
app.post('/getUsers', (req, res) => {
  db.collection(dbs.users).find(req.body).toArray((e, r) => {
    res.send({e, r})
  })
})


/**
 * @POST
 * @str username
 * @str email
 * @str password
 * @str firstName
 * @str lastName
 */
app.post('/insertUser', (req, res) => {
  console.log('inserindo user')
  db.collection(dbs.users).find({ $or: [{ email: req.body.email }, { username: req.body.username }] }).toArray((e, r) => {
    if (r.length > 0)
      res.send({ err: 'Email or username already in use.' })
    else {
      db.collection(dbs.users).insertOne(req.body)
      res.send({ done: true })
    }
  })

})


/**
 * @POST
 * @int id
 * @int type (-1 ~ 1)
 * @str username
 */
app.post('/insertLikes', (req, res) => {
  var { _id, type, username } = req.body;
  type = parseInt(type);
  db.collection(dbs.posts).findOne({_id: ObjectID(_id)}, (e, r) => {
    try {
      if (type > 0) {
        db.collection(dbs.posts).updateOne(
          {_id: ObjectID(_id)},
          {$pull: {dislikeList: username}}
        );
        db.collection(dbs.posts).updateOne(
          {_id: ObjectID(_id)},
          {$addToSet: {likeList: username}}
        );
  
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
      } 
      if (type === 0) {
        db.collection(dbs.posts).updateOne(
          {_id: ObjectID(_id)},
          {$pull: {likeList: username, dislikeList: username}}
        );
      }

      res.send({done: true});
    } catch(err) {
      res.send({done: false, err: err});
    }
    
  });
})



/**
 * @POST
 * @str username
 * @str password
 */
app.post('/login', (req, res) => {
  db.collection(dbs.users).find(req.body).toArray((e, r) => {
    res.send({e, r})
  })
})


