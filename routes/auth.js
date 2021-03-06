const router = require('express').Router();

const User = require("../models/User.js");

// You need to copy the config.template.json file and fill out your own secret
let config = require('../config/config.json');

// Using bcrypt for encrypting and decrypting the passwords
const bcrypt = require('bcrypt');
const saltRounds = 12;


router.post('/signin', (req, res) => {

    console.log("Login started");

    const {
        email,
        password
    } = req.body;

    if (email.length > 0 && password.length > 0) {
        try {
            // Searching the database for a user with the email which was typed into the sign in form.
            User.query().select('email', "password").where('email', email).then(foundUser => {

                if (foundUser.length < 1) {
                    return res.status(500).send({
                        response: "User does not exists"
                    });
                } else {
                    // Decrypting the password found in the database and compares it with the password typed in into the form.
                    bcrypt.compare(password, foundUser[0].password).then(result => {
                        if (result == true) {
                            console.log("Login success")
                            req.session.regenerate(function(){
                                // Saves the user through express-sessions
                                req.session.user = foundUser;
                                res.redirect('/');
                            });

                        } else {
                            return res.send({
                                response: "The password did not match"
                            });
                        }
                    });
                }
            });
            
        } catch (error) {
            return res.send({
                response: "Something went wrong with the DB"
            });
        }

    } else {
        return res.send({
            response: "You did not fulfill the requirements"
        });
    }
});


router.post('/signup', (req, res) => {
    const {
        username,
        password,
        email
    } = req.body;

    // Makes sure that none of the variables are empty
    if (username && password && username) {
        // password validation
        if (password.length < 8) {
            return res.status(400).send({
                response: "Password must be 8 characters or longer"
            });
        } else {
            // Username validation. We do not want anyone with the same username
            try {
                // Searches the database for an existing user with same username.
                User.query().select('username').where('username', username).then(foundUsername => {
                    if (foundUsername.length > 0) {
                        return res.status(400).send({
                            response: "User already exists"
                        });
                    } else {
                        // Email validation. We do not want anyone with the same email
                        try {
                            // Searches the database for an existing user with same email.
                            User.query().select('email').where('email', email).then(foundUserEmail => {
                                if (foundUserEmail.length > 0) {
                                    return res.status(400).send({
                                        response: "Email already exists"
                                    });
                                } else {
                                    // Password encryption
                                    bcrypt.hash(password, saltRounds).then(hashedPassword => {
                                        // Saves the new user in the database with the input and encrypted password
                                        User.query().insert({
                                            username,
                                            email,
                                            password: hashedPassword

                                        }).then(createdUser => {
                                            return res.send({
                                                response: `The user ${createdUser.username} was created`
                                            });
                                        });
                                    });
                                }

                            });
                        } catch {
                            return res.status(500).send({
                                response: "Something went wrong with the DB"
                            });
                        }
                    }

                });
            } catch (error) {
                return res.status(500).send({
                    response: "Something went wrong with the DB"
                });
            }
        }
    } else {
        return res.status(400).send({
            response: "username or password missing"
        });
    }
});

router.get('/signout', (req, res) => {
    req.session.user = null;
    return res.redirect("/");
});

module.exports = router;