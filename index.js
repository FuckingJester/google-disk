const express = require("express");
require('dotenv').config()
const config = require("config")
const mongoose = require('mongoose');
const fileUpload = require('express-fileupload');
const authRouter = require('./routes/auth.route.js')
const fileRouter = require('./routes/file.route.js')
const corsMiddleware = require('./middleware/cors.middleware.js')
const filePathMiddleware = require('./middleware/filePath.middleware.js')
const path = require('path')
const app = express();
const PORT = process.env.PORT || 5000;
const MONGO = config.get('db')

console.log(MONGO)

app.use(fileUpload({}))
app.use(corsMiddleware)
app.use(filePathMiddleware(path.resolve(__dirname, 'files')))
app.use(express.json())
app.use('/api/auth',authRouter)
app.use('/api/files',fileRouter)


const start = async () => {
  try {
      await mongoose.connect(MONGO, {
          useNewUrlParser:true,
          useUnifiedTopology:true
      })

      app.listen(PORT, () => {
          console.log('Server started on port ', PORT)
      })
  } catch (e) {
      console.log(e)
  }
}
start()
