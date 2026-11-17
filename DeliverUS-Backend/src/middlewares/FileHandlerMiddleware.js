import fs from 'fs'
import multer from 'multer'
import path from 'node:path'
import crypto from 'node:crypto'

const addFilenameToBody = (req, fieldNames) => {
  fieldNames.forEach(fieldName => {
    if (req.files?.[fieldName]) {
      req.body[fieldName] = path.posix.join(req.uploadFolder, req.files[fieldName][0].filename)
    } else if (req.file?.fieldname === fieldName) {
      req.body[fieldName] = path.posix.join(req.uploadFolder, req.file.filename)
    }
  })
}

const createMulter = (fieldNames, folder) => {
  const options = {
    limits: { fileSize: 2000000, files: fieldNames.length, fields: 30, fieldSize: 100000 },
    fileFilter: (req, file, cb) => {
      if (!['image/jpeg', 'image/png'].includes(file.mimetype)) return cb(new Error('Upload a PNG or JPEG image.'))
      cb(null, true)
    }
  }
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const destination = path.resolve(process.env.UPLOAD_ROOT || '.', folder)
      fs.mkdirSync(destination, { recursive: true })
      cb(null, destination)
    },
    filename: function (req, file, cb) {
      cb(null, crypto.randomUUID() + (file.mimetype === 'image/png' ? '.png' : '.jpg'))
    }
  })

  if (fieldNames.length === 1) {
    return multer({ storage, ...options }).single(fieldNames[0])
  } else {
    const fields = fieldNames.map(imageFieldName => ({ name: imageFieldName, maxCount: 1 }))
    return multer({ storage, ...options }).fields(fields)
  }
}

const handleFilesUpload = (fieldNames, folder) => (req, res, next) => {
  req.uploadFolder = folder
  const multerInstance = createMulter(fieldNames, folder)
  multerInstance(req, res, (err) => {
    if (err) {
      res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 422).send({ errors: [{ msg: 'Upload a PNG or JPEG image smaller than 2 MB.' }] })
    } else {
      addFilenameToBody(req, fieldNames)
      next()
    }
  })
}

export { handleFilesUpload }
