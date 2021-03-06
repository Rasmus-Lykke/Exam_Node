const router = require("express").Router();
const crypto = require("crypto");
const multer = require('multer');
const Comment = require('../models/Comment.js')
const Picture = require('../models/Picture.js');
const User = require('../models/User.js');

// Variable containing a list with all the information for each picture
var obj = {
    pictures: []
};
let pictureId = "";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'pictures/');
    },
    filename: (req, file, cb) => {
        const mimetypeArray = file.mimetype.split("/");
        if (mimetypeArray[0] === "image") {
            const extension = mimetypeArray[mimetypeArray.length - 1];
            const fileName = crypto.randomBytes(18).toString("hex");

            cb(null, fileName + "." + extension);
        } else {
            cb("Error: File is not a picture")
        };
    }
});

const upload = multer({
    storage: storage
});

const picturesPerPage = 12;
router.get("/pictures", (req, res) => {
    const page = Number(req.query.page) ? Number(req.query.page) : 1;
    const start = (page - 1) * picturesPerPage;
    const end = start + picturesPerPage;

    return res.send({
        response: obj.pictures.slice(start, end)
    });
});

router.get("/pictures/:pictureId", async (req, res) => {
    
    const allComments = await Comment.query()
        .select('comment', 'username')
        .join('users', 'users.id', "=", "comments.user_id")
        .where({filename: req.params.pictureId});

    pictureId = req.params.pictureId;

    return res.send({
        response: obj.pictures.find(picture => picture.fileName === pictureId),
        comments: allComments
    });
});


router.post("/pictures", upload.single('uploadedpicture'), async (req, res) => {
    let userId = await User.query().select('id').where('email', req.session.user[0].email);
    
    const picture = {
        title: req.body.title.trim(),
        description: req.body.description,
        fileName: req.file.filename,
        createdAt: new Date(),
        category: req.body.category,
        userId: userId[0].id
    };

    // Server validation of the uploaded image in information typed by the user. 
    const titleMaxLength = 128;
    if (picture.title.length === 0 || picture.title.length > titleMaxLength) {
        return res.status(400).send({
            response: `Error: title length is ${picture.title.length} but must be more than 0 or less than ${titleMaxLength}`
        });
    };

    const descriptionMaxLength = 2048;
    if (picture.description.length > descriptionMaxLength) {
        return res.status(400).send({
            response: `Error: description length is ${picture.description.length} but must be less than ${descriptionMaxLength}`
        })
    };

    // 5MB
    const fileSizeLimit = 40000000;
    if (req.file.size > fileSizeLimit) {
        fileValid = false
        return res.status(400).send({
            response: `Error: pictures size is ${req.file.size} but must be less than ${fileSizeLimit}`
        })
    };

    obj.pictures.push(picture);
    saveToDB(picture)

    return res.redirect("/");
});

router.post("/newcomment", async (req, res) => {
    let userId = await User.query().select('id').where('email', req.session.user[0].email);
    
    const comment = {
        comment: req.body.comment.trim(),
        filename: pictureId,
        userId: userId[0].id
    };

    saveCommentToDB(comment);

    return res.redirect("/player/" + pictureId);
});

async function saveCommentToDB(comment) {
    await Comment.query().insert(comment);
}

async function saveToDB(picture) {
    await Picture.query().insert(picture);
}

module.exports = {
    router: router,
    readFromDB: async function () {
        obj.pictures = await Picture.query().select("title", "file_name", "description", "category", "user_id");
    }
};