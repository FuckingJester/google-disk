const fileService = require('../services/file.service.js')
const fs = require('fs')
const config = require("config")
const User = require('../models/user.model.js')
const File = require('../models/file.model.js')

class FileController {
    async createDir(req, res) {
        try {
            const {name, type, parent} = req.body
            const file = new File({name, type, parent, user: req.user.id})
            const parentFile = await File.findOne({_id: parent})
            if(!parentFile) {
                file.path = name
                await fileService.createDir(req, file)
            } else {
                file.path = `${parentFile.path}\\${file.name}`
                await fileService.createDir(req, file)
                parentFile.childs.push(file._id)
                await parentFile.save()
            }
            await file.save()
            return res.json(file)
        } catch (e) {
            console.log(e)
            return res.status(400).json(e)
        }
    }

    async getFiles(req, res) {
        try {
            const {sort} = req.query
            let files
            switch (sort) {
                case 'name':
                    files = await File.find({user: req.user.id, parent: req.query.parent}).sort({name : 1})
                    break
                case 'type':
                    files = await File.find({user: req.user.id, parent: req.query.parent}).sort({type : 1})
                    break
                case 'date':
                    files = await File.find({user: req.user.id, parent: req.query.parent}).sort({date : 1})
                    break
                default: 
                    files = await File.find({user: req.user.id, parent: req.query.parent})
                    break
            }
            
            return res.json(files)

        } catch (e) {
            console.log(e)
            return res.status(500).json({message: "Can not get files"})
        }
    }
    async uploadFile(req, res) {
        try {
            const file = req.files.file

            const parent = await File.findOne({user: req.user.id, _id: req.body.parent})
            const user = await User.findOne({_id: req.user.id})

            if (user.usedSpace + file.size > user.diskSpace) {
                return res.status(400).json({message: 'There no space on the disk'})
            }

            user.usedSpace = user.usedSpace + file.size

            let path;
            if (parent) {
                path = `${req.filepath}\\${user._id}\\${parent.path}\\${file.name}`
            } else {
                path = `${req.filepath}\\${user._id}\\${file.name}`
            }

            if (fs.existsSync(path)) {
                return res.status(400).json({message: 'File already exist'})
            }
            file.mv(path)

            const type = file.name.split('.').pop()
            let filePath = file.name
            if (parent) {
                filePath = parent.path + "\\" + file.name
            }
            const dbFile = new File({
                name: file.name,
                type,
                size: file.size,
                path: filePath,
                parent: parent ? parent._id : null,
                user: user._id
            });

            await dbFile.save()
            await user.save()

            res.json(dbFile)
        } catch (e) {
            console.log(e)
            return res.status(500).json({message: "Upload error"})
        }
    }
    async downloadFile(req,res) {
        try {
            const file = await File.findOne({_id: req.query.id, user: req.user.id})
            const path = req.filePath + '\\' + req.user.id + '\\' + file.path + '\\' + file.name
            if (fs.existsSync(path)) {
                return res.download(path, file.name)
            }
            return res.status(400).json({message: "Download error"})
        } catch (e) {
            console.log(e)
            res.status(500).json({message: "Download error"})
        }
    }
    async deleteFile (req,res) {
        try {
            const file = await File.findOne({_id: req.query.id, user: req.user.id})
            if(!file){
                return res.status(400).json({message: "File not found"})
            }
           fileService.deleteFile(req, file)
           await file.deleteOne()
           return res.json({message: "File was delete"})
           
        } catch (e) {
            console.log(e)
            res.status(400).json({message: "Dir is not empty"})
        }
    }

    async searchFile(req, res){
        try {
            const searchName = req.query.search
            let files = await File.find({user : req.user.id})
            files = files.filter(file => file.name.includes(searchName))
            return res.json(files)
        } catch(e){
            console.log(e)
            res.status(400).json({message: "Search error"})
        }
    }
}

module.exports = new FileController()