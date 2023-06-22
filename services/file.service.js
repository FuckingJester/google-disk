const fs = require('fs')
const File = require('../models/file.model.js')
const config = require('config')

class FileService {
    createDir(req, file) {
        const filePath = `${req.filepath}\\${file.user}\\${file.path}`
        return new Promise(((resolve, reject) => {
            try {
                if (!fs.existsSync(filePath)) {
                    fs.mkdirSync(filePath)
                    return resolve({message: 'File was created'})
                } else {
                    return reject({message: "File already exist"})
                }
            } catch (e) {
                return reject({message: 'File error'})
            }
        }))
    }
    
    deleteFile(req, file) {
        const path = `${req.filepath}\\${file.user}\\${file.path}`
        if(file.type === 'dir'){
            fs.rmdirSync(path)
        } else {
            fs.unlinkSync(path)
        }
    }
}


module.exports = new FileService()