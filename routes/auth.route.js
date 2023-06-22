const Router = require('express')
const config = require('config')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const {check, validationResult} = require ('express-validator')
const User = require('./../models/user.model.js')
const File = require('./../models/file.model.js')
const fileService = require('../services/file.service.js') 
const authMiddleware = require('./../middleware/auth.middleware.js')
const router = new Router()

router.post('/registration',
    [
        check('email', "Uncorrect email").isEmail(),
        check('password', 'Password should be longer than 6').isLength({min:6})
    ],
    async (req, res) => {
        try {
            console.log(req.body)
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return res.status(400).json({message: "Uncorrect request", errors})
            }

            const {email, password} = req.body;

            const candidate = await User.findOne({email})

            if(candidate) {
                return res.status(400).json({message: `User with email ${email} already exist`})
            }
            const hashPassword = await bcrypt.hash(password, 4)
            const user = new User({email, password: hashPassword})
            await user.save()
            await fileService.createDir(req, new File({user : user.id, name : ''}))
            return res.json({message: "User was created"})

        } catch (e) {
            alert(e)
            res.send({message: "Something went wrong"})
        }
})

router.post('/login', 
    async (req,res) => {
        try {
            const {email,password} = req.body
            const user = await User.findOne({email})

            if (!user){
                return res.status(404).json({message : 'User is not found'})
            }

            const validPass = bcrypt.compareSync(password, user.password)
            if(!validPass){
                return res.status(400).json({message : 'Password is incorrect'})
            }

            const token = jwt.sign({id : user.id}, config.get('secretKey'),{expiresIn : '1h'})
            return res.json({
                token,
                user : {
                    id : user.id,
                    email : user.email,
                    diskSpace : user.diskSpace,
                    usedSpace : user.usedSpace,
                    avatar : user.avatar,
                }
            })
        } catch (e) {
            console.log(e)
            res.send({message : 'Something went wrong'})
        }
    })
router.get('/auth',authMiddleware,
async (req,res) => {
    try {
        const user = await User.findOne({_id : req.user.id})
        const token = jwt.sign({id : user.id}, config.get('secretKey'),{expiresIn : '1h'})
        return res.json({
            token,
            user : {
                id : user.id,
                email : user.email,
                diskSpace : user.diskSpace,
                usedSpace : user.usedSpace,
                avatar : user.avatar,
            }
        })
    } catch (e) {
        console.log(e)
        res.send({message : 'Something went wrong'})
    }
})  
module.exports = router 