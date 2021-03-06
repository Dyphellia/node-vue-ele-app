// @login & register
const express = require("express")
const router = express.Router();
const bcrypt = require("bcryptjs");
const gravatar = require("gravatar");
const jwt = require("jsonwebtoken");
const passport = require("passport");

const keys = require("../../config/keys")
const User = require("../../models/User")

// $route GET api/users/test
// @desc 返回请求的json数据
// @access public
router.get("/test", (req, res) => {
    res.json({msg: "login works"})
})

// $route POST api/users/register
// @desc 返回请求的json数据
// @access public
router.post("/register", (req, res) => {
    // console.log(req.body);
    // 查询数据库是拥有邮箱（是否被注册）
    User.findOne({email: req.body.email})
        .then((user) => {
            if (user) {
                return res.status(400).json("邮箱已被注册！")
            } else {

                //使用gravatar设置头像，为默认头像
                const avatar = gravatar.url(req.body.email, {s: '200', r: 'pg', d: 'mm'});

                const newUser = new User({
                    name: req.body.name,
                    email: req.body.email,
                    avatar,
                    password: req.body.password,
                    identity: req.body.identity
                })
                //对密码进行加密
                bcrypt.genSalt(10, function (err, salt) {
                    bcrypt.hash(newUser.password, salt, (err, hash) => {
                        if (err) throw err

                        newUser.password = hash;

                        newUser.save()
                            .then(user => res.json(user))
                            .catch(err => console.log(err))
                    });
                });
            }
        })
})

// $route POST api/users/login
// @desc 返回token jwt passport
// @access public

router.post("/login", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    //查询数据库，匹配email
    User.findOne({email})
        .then(user => {
            if (!user) {
                return res.status(404).json("用户不存在")
            }

            //密码匹配
            bcrypt.compare(password, user.password)
                .then(isMatch => {
                    if (isMatch) {
                        const rule = {
                            id: user.id,
                            name: user.name,
                            avatar: user.avatar,
                            identity: user.identity
                        };
                        // jwt.sign("规则","加密名字","过期时间","箭头函数");
                        jwt.sign(rule, keys.secretOrKey, {expiresIn: 3600}, (err, token) => {
                            if (err) throw err;
                            res.json({
                                success: true,
                                token: 'Bearer ' + token
                                // token: token

                            })

                        })
                        // res.json({msg: "success"})
                    } else {
                        return res.status(404).json("密码错误")
                    }
                })
        });
})

// $route GET api/users/current
// @desc return current user
// @access Private

//请求验证token
router.get("/current", passport.authenticate('jwt', {session: false}), (req, res) => {
    res.json({
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        identity: req.user.identity
    })
})


module.exports = router;