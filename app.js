
var express = require('express');
var http = require('http');
var path = require('path');
require('dotenv').config();

var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var static = require('serve-static');
// var errorHandler = require('errorHandler');
// var expressErrorHandler = require('express-error-handler');
var expressSession = require('express-session');

var mysql = require('mysql');
var multer = require('multer');
//var fs = require('fs');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var flash = require('connect-flash');
//const promiseMysql = require('promise-mysql');

var pool = mysql.createPool({
    //connectionLimit: 10,
    host: 'capstone-project.cojwntxe9hru.ap-northeast-2.rds.amazonaws.com',
    user: 'user2',
    port: 3306,
    password: 'PASS',
    database: 'capstone',
    debug: false
});

var app = express();

app.set('port', process.env.PORT || 3000);
app.use(bodyParser.json({ type: 'application/json' }));
app.use(bodyParser.urlencoded({ extended: true }));

app.all('/*', function (req, res, next) { //이미지 권한문제의 핵심 나중에 서버쪽 사람들한테 이걸 붙이라고 해라!!!!!!!!!!!!!//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
console.log('뷰 엔진이 ejs로 설정되었습니다.');

app.use(cookieParser());
app.use(expressSession({
    secret: 'me key',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

passport.use('local-login', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, function (req, email, password, done) {
    console.log('passport의 local-login 호출됨 :' + email + ', ' + password);
    pool.getConnection(function (err, conn) {

        var exec = conn.query("select * from users where email=? and password=?", [email, password], function (err, user) {
            if (err) {
                console.log('로그인에러 : ' + err);
            }
            console.log('exec : ' + exec.sql);
            console.log('user : ');
            console.dir(user);
            conn.release();
            if (!user) {
                console.log('계정, 비번 일치 x');
                return done(null, false, req.flash('loginMessage', '로그인실패'));
            }
            console.log('일치하는 계정 확인');
            return done(null, user);
        });
    });
}
));

passport.use('local-signup', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, function (req, email, password, done) {
    console.log('passport의 local-signup호출됨 : ' + email + ', ' + password);
    pool.getConnection(function (err, conn) {

        var data = { email: email, password: password, name: name };
        console.log('data : '); console.dir(data);
        var exec = conn.query("insert into users set ?", data, function (err, result) {
            console.log('회원가입 err : ' + err);
            console.log('exec : ' + exec.sql);
            console.log('회원가입결과 : ');
            console.dir(result);
            conn.release();
            if (result) {
                console.log('회원가입성공');
                return done(null, user);
            } else {
                return done(null, false, req.flash('signupMessage', '회원가입실패'));
            }
        });
    });
}));

passport.serializeUser(function (user, done) {
    console.log('serializeUser() 호출됨.');
    console.dir(user);
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    console.log('deserializeUser() 호출됨');
    console.dir(user);
    done(null, user);
});

var router = express.Router();

router.route('/').get(function (req, res) {
    res.render('home.ejs');
});

router.route('/login').get(function (req, res) {
    res.render('login.ejs');
});

router.route('/signup').get(function (req, res) {
    res.render('signup.ejs');
});

// router.route('/addproduct').get(function (req, res) {
//     res.render('addproduct.ejs');
// });

router.route('/addproduct').get(function (req, res) {
    res.render('addproduct2.ejs');
});

router.route('/addshoes').get(function (req, res) {
    res.render('addShoes.ejs');
});

router.route('/logout').get(function (req, res) {
    res.render('home.ejs');
});

router.route('/order').get(function (req, res) {
    res.render('order.ejs');
});

router.route('/login').post(passport.authenticate('local-login', {
    successRedirect: '/products',
    failureRedirect: '/login',
    failureFlash: true
}));

router.route('/signup').post(passport.authenticate('local-signup ', {
    successRedirect: '/products',
    failureRedirect: '/signup',
    failureFlash: true
}));

//로그인 인증 처리
/*
router.route('/login').post(function (req, res) {

    var userid = req.body.userid || req.query.userid;
    var password = req.body.password || req.query.password;

    console.log('로그인파라미터 :' + userid + ', ' + password);

    pool.getConnection(function (err, conn) {
        if (err) {
            console.log('err1 : ' + err);
        }
        var exec = conn.query("select * from users where email=? and password= ?", [userid, password], function (err, row) {
            console.log('err2 : ' + err);
            console.log(exec.sql);
            conn.release();
            console.log(row);
            if (row.length > 0) {
                console.log('아이디 패스워드 일치하는 사용자 찾음');
                console.dir(row);
                var uid = row[0].id;
                console.log('uid :' + uid);
                res.writeHead('200', { 'Content-Type': 'text/html;charset=utf8' });
                //res.write('<h1>로그인 성공</h1>');
                //res.write(userid + '님 환영합니다.');
                //res.write('<br><a href="/login">다시로그인</a>');
                res.write('<form id="auto_login" action="/products" method="post">');
                res.write('<input type="hidden" value=' + uid + ' name="uid">');
                //res.write('<input type="submit" value="쇼핑시작하기">');
                res.write('</form>');
                res.write('<script type="text/javascript"> this.document.getElementById("auto_login").submit(); </script>');
                res.end();
            } else {
                res.writeHead('200', { 'Content-Type': 'text/html;charset=utf8' });
                res.write('<h1>로그인 실패 <h1>');
                res.write('<h3>아이디, 비밀번호를 다시 확인 하세요.');
                res.write('<br><a href="/login">다시로그인</a>');
                res.end();
            }
        });
    });
});
*/


//회원가입 처리
/*
router.route('/signup').post(function (req, res) {

    var userid = req.body.userid || req.query.userid;
    var password = req.body.password || req.query.password;
    var name = req.body.name;
    var data;
    console.log('회원가입파라미터' + userid + ',' + password + ',' + name);

    pool.getConnection(function (err, conn) {
        if (err) {
            console.log('err1 : ' + err);
        }
        data = { email: userid, password: password, name: name };
        var exec2 = conn.query('insert into users set ?', data, function (err, result) {
            if (err) {
                console.log('err2 : ' + err);
            }
            console.log(exec2.sql);
            conn.release();
            if (result) {
                console.log('회원가입결과객체:');
                console.log(result);
                res.writeHead('200', { 'Content-Type': 'text/html;charset=utf8' });
                res.write('<h2>회원가입성공!</h2>');
                res.write('<h3>' + name + '님 환영합니다!<h3>');
                res.write('<br><a href="/">홈화면바로가기</a>');
                res.end();
            }
        });
    });
});
*/

//상품목록조회
router.route('/products').get(function (req, res) {

    console.log('req.user : ');
    console.log(req.user);
    //console.log(req.body.test);

    pool.getConnection(function (err, conn) {
        var exec = conn.query("select * from products", function (err, productList) {
            var array = productList.reverse();
            var reversed_products = array;
            console.log(reversed_products);
            console.log('exec :' + exec.sql);
            //conn.release();
            var exec1 = conn.query("select * from imgByColors", function (err, imgs) {
                console.log('exec1 : ' + exec1.sql);
                conn.release();

                console.dir(imgs);
                res.send({ productList: reversed_products, imgs: imgs });
                //res.render('products.ejs', { list: list }); 
            });
        });
    });
});

var AWS = require('aws-sdk');

var multerS3 = require('multer-s3');

AWS.config.update({
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    region: 'ap-northeast-2',
});
//AWS.config.loadFromPath(__dirname + "/config/awsconfig.json");
console.log(__dirname);
var upload = multer({
    storage: multerS3({
        s3: new AWS.S3(),
        bucket: 'swcap02',
        key: function (req, file, cb) {
            // var extension = path.extname(file.originalname);
            // var basename = path.basename(file.originalname, extension);
            // cb(null, 'product/' + basename + '-' + Date.now().toString() + extension);
            cb(null, `product/${Date.now()}${path.basename(file.originalname)}`);
        },
        acl: 'public-read-write'
    })
});


//상품등록하기 버전2
router.post('/addproduct', upload.array('photo', 8), function (req, res, next) {

    var productname = req.body.productname;
    var price = req.body.price;
    var categoryId = req.body.categoryId;
    var createdAt = new Date();
    var gender = req.body.gender;
    var seller = '상민옷';
    var color = req.body.color;
    var colorCnt = 0;
    console.log('color : ');
    console.log(color);
    console.log('색상가지수 : ');
    console.log(color.length);
    for (var i = 0; i < color.length; i++) {
        if (color[i] != '') {
            colorCnt++;
        }
    }
    console.log('진짜색상가지수 : ');
    console.log(colorCnt);

    if (req.body.categoryId == 1 || req.body.categoryId == 2) { //1.상하의 추가일때 

        var S = req.body.S;
        var M = req.body.M;
        var L = req.body.L;
        var XL = req.body.XL;

        console.log('S : ');
        console.log(S);

        console.log('M : ');
        console.log(M);

        console.log('L : ');
        console.log(L);

        console.log('XL : ');
        console.log(XL);

        console.log("files : ");
        console.dir(req.files);
        console.log("file 갯수 : " + req.files.length);
        console.log('대표이미지 : ');
        console.log(req.files[0].location);
        console.log('상품설명이미지 : ');
        console.log(req.files[1].location);

        var pid;

        pool.getConnection(function (err, conn) {
            var data;

            if (err) {
                console.log('디비 연결 에러');
                conn.release();
            }
            data = [seller, productname, price, categoryId, gender, req.files[0].location, req.files[1].location, createdAt];
            var exec0 = conn.query("insert into products(seller, pname, price, categoryId, gender, img, description, createdAt) VALUES(?,?,?,?,?,?,?,?)", data, function (err, result) {
                if (err) {
                    console.log('err0 : ');
                    console.log(err);
                    conn.release();
                }
                console.log('exec0 : ' + exec0.sql);
                if (result) {
                    console.log('products_result : ');
                    console.dir(result);
                    pid = result.insertId;
                }
                var data2 = new Array();
                var k = 0;
                for (var i = 0; i < colorCnt; i++) {
                    for (var j = 0; j < 4; j++) {

                        if ((j == 0)) {
                            if((S[i]!=0) || (S[i]!='')){
                                data2[k] = { productId: pid, color: color[i], size: 'S', cnt: S[i] };
                                k++;
                            }
                        }
                        if ((j == 1)) {
                            if((M[i]!=0) || (M[i]!='')){
                                data2[k] = { productId: pid, color: color[i], size: 'M', cnt: M[i] };
                                k++;
                            }
                        }
                        if ((j == 2)) {
                            if((L[i]!=0) || (L[i]!='')){
                                data2[k] = { productId: pid, color: color[i], size: 'L', cnt: L[i] };
                                k++;
                            }
                        }
                        if ((j == 3) && XL[i] != 0) {
                            if((XL[i]!=0) || (XL[i]!=0)){
                                data2[k] = { productId: pid, color: color[i], size: 'XL', cnt: XL[i] };
                                k++;
                            }
                        }
                    }
                }
                console.log('data2 : ');
                console.log(data2);

                for (var i = 0; i < data2.length; i++) {
                    var exec2 = conn.query("insert into productInfo set ?", data2[i], function (err, added_result) {
                        console.log('exec2 : ' + exec2.sql);
                        if (err) {
                            console.log('err2 : ');
                            console.dir(err);
                            conn.release();
                        }
                        if (added_result) {
                            console.log('prductInfo_result : ');
                            console.dir(added_result);
                        }
                    });
                }

                var data3 = new Array();
                var d = 0;
                for (var i = 0; i < colorCnt; i++) {
                    data3[d] = { productId: pid, img: req.files[i + 2].location, color: color[i] };
                    d++;
                }
                console.log('data3 : ');
                console.log(data3);

                for (var i = 0; i < d; i++) {
                    var exec3 = conn.query('insert into imgByColors set ?', data3[i], function (err, added_result) {
                        console.log('exec3 : ' + exec3.sql);
                        if (err) {
                            console.log('err3 : ');
                            console.dir(err);
                            conn.release();
                        }
                        if (added_result) {
                            console.log('imgByColor_result : ');
                            console.log(added_result);
                            //res.writeHead('200', { 'Content-Type': 'text/html;charset=utf8' });
                            //conn.release();
                        }
                    });
                }
                conn.release();
                res.end('<h2>ADD PRODUCT SUCCESS</h2>');
            });//exec0
            //conn.release();
        });//pool1
    }//if상하의

    if (req.body.categoryId == 3) {//패션잡화인경우
        
        var cnt = req.body.cnt;

        pool.getConnection(function (err, conn) {
            var pid;
            var data;
            var data2 = new Array();
            var data3 = new Array();

            data = { seller:seller, pname: productname, price: price, categoryId: categoryId, createdAt: new Date(), gender: gender, img: req.files[0].location, description: req.files[1].location };

            var exec0 = conn.query("insert into products set ?", data, function (err, inserted) {
                if (err) {
                    console.log('err0 : ');
                    console.log(err);
                    conn.release();
                }
                console.log('exec0 : ' + exec0.sql);
                if (inserted) {
                    console.log('inserted : ');
                    console.dir(inserted);
                    pid = inserted.insertId;
                    console.log(pid);
                }

                var k = 0;
                for (var i = 0; i < colorCnt; i++) {

                    data2[k] = { productId: pid, color: color[i], size: 'F', cnt: cnt[k] };
                    k++;

                }
                console.log('data2 : ');
                console.log(data2);

                for (var i = 0; i < data2.length; i++) {
                    var exec1 = conn.query('insert into productInfo set ?', [data2[i]], function (err, inserted) {
                        console.log('inserted ' + i + ' : ');
                        console.dir(inserted);
                    });
                }//exec1

                var d = 0;
                for (var i = 0; i < colorCnt; i++) {
                    data3[d] = { productId: pid, img: req.files[i + 2].location, color: color[i] };
                    d++;
                }
                console.log('data3 : ');
                console.log(data3);

                for (var i = 0; i < d; i++) {
                    var exec2 = conn.query('insert into imgByColors set ?', data3[i], function (err, added_result) {
                        console.log('exec2 : ' + exec2.sql);
                        if (err) {
                            console.log('err3 : ');
                            console.dir(err);
                            conn.release();
                        }
                        if (added_result) {
                            console.log('imgByColor_result : ');
                            console.log(added_result);
                            //res.writeHead('200', { 'Content-Type': 'text/html;charset=utf8' });
                        }
                    });
                }//exec2
                conn.release();
                res.end('<h2>ADD PRODUCT SUCCESS</h2>');
            });//exec0
        });//pool
        
    }

    if (req.body.categoryId == 4) {//신발일 경우 

        var size = req.body.size;
        var cnt = req.body.cnt;
        var newCnt = []; //cnt에서 ''를 제거한 배열

        var sizeCnt = 0;
        console.log('size : ');
        console.log(size);
        console.log(size.length);
        for (var i = 0; i < size.length; i++) {
            if (size[i] != '') {
                sizeCnt++;
            }
        }
        console.log(sizeCnt);

        for(var i=0; i<cnt.length; i++){
            if(cnt[i] != ''){
                newCnt.push(cnt[i]);
            }
        }
        console.log(newCnt);

        pool.getConnection(function (err, conn) {
            var pid;
            var data;
            var data2 = new Array();
            var data3 = new Array();

            data = { seller:seller, pname: productname, price: price, categoryId: categoryId, createdAt: new Date(), gender: gender, img: req.files[0].location, description: req.files[1].location };

            var exec0 = conn.query("insert into products set ?", data, function (err, inserted) {
                if (err) {
                    console.log('err0 : ');
                    console.log(err);
                    conn.release();
                }
                console.log('exec0 : ' + exec0.sql);
                if (inserted) {
                    console.log('inserted : ');
                    console.dir(inserted);
                    pid = inserted.insertId;
                    console.log(pid);
                }

                var k = 0;
                for (var i = 0; i < colorCnt; i++) {
                    for (var j = 0; j < sizeCnt; j++) {
                        data2[k] = { productId: pid, color: color[i], size: size[j], cnt: newCnt[k] };
                        k++;
                    }
                }
                console.log('data2 : ');
                console.log(data2);

                for (var i = 0; i < data2.length; i++) {
                    var exec1 = conn.query('insert into productInfo set ?', [data2[i]], function (err, inserted) {
                        console.log('inserted ' + i + ' : ');
                        console.dir(inserted);
                    });
                }//exec1

                var d = 0;
                for (var i = 0; i < colorCnt; i++) {
                    data3[d] = { productId: pid, img: req.files[i + 2].location, color: color[i] };
                    d++;
                }
                console.log('data3 : ');
                console.log(data3);

                for (var i = 0; i < d; i++) {
                    var exec2 = conn.query('insert into imgByColors set ?', data3[i], function (err, added_result) {
                        console.log('exec2 : ' + exec2.sql);
                        if (err) {
                            console.log('err3 : ');
                            console.dir(err);
                            conn.release();
                        }
                        if (added_result) {
                            console.log('imgByColor_result : ');
                            console.log(added_result);
                            //res.writeHead('200', { 'Content-Type': 'text/html;charset=utf8' });
                        }
                    });
                }//exec2
                conn.release();
                res.end('<h2>ADD PRODUCT SUCCESS</h2>');
            });//exec0
        });//pool
    }//if(신발)
});//route.post


//툴바에서 장바구니에 담기
router.route('/toolbarAdd').post(function (req, res) {
    var imgurl = req.body.imgurl; //색상별이미지url
    //var imgurl = 'https://swcap02.s3.ap-northeast-2.amazonaws.com/product/1588584971988%ED%94%8C%EB%9D%BC%EC%9D%B41.PNG';
    //var uid = req.user[0].id;
    uid = 3;
    console.log('imgUrl : ');
    console.dir(imgurl);
    //  console.log('req.body : ');
    //  console.dir(req.body);

    pool.getConnection(function (err, conn) {
        if (err) {
            console.log('연결err : ' + err);
            conn.release();
        }
        var exec = conn.query('select * from imgByColors where img = ?', [imgurl], function (err, row) {
            var productid;
            var color;
            var pname;
            var thumbnail;
            console.log('exec : ' + exec.sql);
            if (err) {
                console.log('err : ' + err);
                conn.release();
            }
            console.log("row : ");
            console.dir(row);
            productid = row[0].productId;
            color = row[0].color;
            console.log('productid :' + productid + ', ' + 'color : ' + color);

            var exec1 = conn.query('select * from products where id =?', [productid], function (err, result) {
                if (err) {
                    console.log('err2 : ' + err);
                    conn.release();
                }
                console.log('exec1 : ' + exec1.sql);
                console.log('result : ');
                console.dir(result);
                pname = result[0].pname;
                thumbnail = result[0].img;
                console.log('pname : ' + pname + ', ' + 'thumbnail' + thumbnail);

                var data = { pname: pname, cnt: 1, userId: uid, productId: productid, img: thumbnail, color: color };
                var exec2 = conn.query('insert into carts set ?', data, function (err, result2) {
                    conn.release();
                    if (err) {
                        console.log('err3 : ' + err);
                        conn.release();
                    }
                    console.log('exec2 : ' + exec2.sql);
                    console.log('result2 : ');
                    console.dir(result2);
                });
            });
        });
    });
    res.end('success');
});


//장바구니담기
router.route('/basket').post(function (req, res) {

    var pid = req.body.productid;
    var color = req.body.color;
    var size = req.body.size;
    var uid = req.user[0].id;
    var cnt = req.body.cnt;

    console.log('장바구니에 담을 상품:' + pid);
    console.log('현재 유저 정보 :' + uid);
    console.log('담을 상품 개수 : ' + cnt);
    console.log('색상, 사이즈 : ' + color, size);

    pool.getConnection(function (err, conn) {
        var cid;
        var data;
        var pname;
        var img;
        var exec0 = conn.query('select * from products where id =?', [pid], function (err, selected_product) {
            console.log('exec0 : ' + exec0.sql);
            console.log('selected_product : ');
            console.dir(selected_product);
            pname = selected_product[0].pname;
            img = selected_product[0].img;

            data = { userId: uid, productId: pid, cnt: cnt, img: img, pname: pname, color: color, size: size };

            var exec2 = conn.query('insert into carts set ?', data, function (err, added_result) {
                if (err) {
                    console.dir(err);
                }
                console.log('실행sql :' + exec2.sql);
                conn.release();
                if (added_result) {
                    console.dir(added_result);
                    res.send('cart add success!');
                    //     console.log('장바구니담기성공!');
                    //     res.writeHead('200', { 'Content-Type': 'text/html;charset=utf8' });
                    //     res.write('<form id="auto_basket" action="/mycart" method="get">');
                    //     res.write('<input type="hidden" value=' + uid + ' name="uid">');
                    //     res.write('</form>');
                    //     res.write('<script type="text/javascript"> this.document.getElementById("auto_basket").submit(); </script>');
                    //     res.end();
                }
            });
        });
    });
});


function getCartByUserId(uid) {
    return new Promise((resolve, reject) => {
        pool.getConnection(function (err, conn) {

            let pidArr = new Array();
            let uniquePidArr = new Array();

            conn.query("select * from carts where userId = ?", uid, function (err, cartsByUid) {

                //conn.release();
                if (cartsByUid.length > 0) {
                    console.log('장바구니 목록 : ');
                    console.dir(cartsByUid);

                    for (let i = 0; i < cartsByUid.length; i++) {
                        pidArr[i] = cartsByUid[i].productId;
                    }
                    console.log('pidArr : ');
                    console.log(pidArr);
                    uniquePidArr = Array.from(new Set(pidArr)); //pidArr배열에서 중복을 제거한 배열 uniquePidArr
                    console.log('중복제거배열 : ');
                    console.log(uniquePidArr);
                    conn.release();
                    resolve({ uniquePidArr: uniquePidArr, cartsByUid: cartsByUid });
                }
            });
        });
    });
}

function getProInfoByPidQuery(productid) {
    return new Promise((resolve, reject) => {
        pool.getConnection(function (err, conn) {
            conn.query("select * from productInfo where productId=?", [productid],
                function (err, selected_productInfoes) {
                    conn.release();
                    resolve(selected_productInfoes);
                }
            );
        });
    });
}

function getProductByPidQuery(productid) {
    return new Promise((resolve, reject) => {
        pool.getConnection(function (err, conn) {
            conn.query('select * from products where id = ?', [productid], function (err, pro) {
                conn.release();
                resolve(pro);
            });
        });
    });
}

function getProInfoByPid(productids) {
    return new Promise((resolve, reject) => {
        pool.getConnection(async function (err, conn) {

            let result2 = [];
            let result3 = [];

            for (let j = 0; j < productids.length; j++) {
                let selected_productInfoes = await getProInfoByPidQuery(productids[j]);
                console.log('selected_productInfoes : ');
                console.dir(selected_productInfoes);
                if (selected_productInfoes.length > 0) {
                    for (let k = 0; k < selected_productInfoes.length; k++) {
                        result2.push(selected_productInfoes[k]);
                    }
                }

                let product = await getProductByPidQuery(productids[j]);
                console.log('product : ');
                console.dir(product);
                result3.push(product);

            }
            conn.release();
            resolve({ result2: result2, result3: result3 });
        });
    });
}

//장바구니조회
router.route('/mycart').get(async (req, res) => {
    //var uid = req.user[0].id;
    let uid = 3;
    try {
        let result1 = await getCartByUserId(uid);
        console.log('result1 : ');
        console.dir(result1);
        console.log('result1.uniquePidArr : ');
        console.log(result1.uniquePidArr);
        console.log('result1.cartsByUid : ');
        console.dir(result1.cartsByUid);

        let result2n3 = await getProInfoByPid(result1.uniquePidArr);
        console.log('results2n3 : ');
        console.dir(result2n3);

        res.json({ cartsByUid: result1.cartsByUid, result2n3: result2n3 });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'error발생' });
    }

});


//장바구니 수정
router.route('/updateCart').post(function (req, res) {
    //var uid = req.user[0].id;
    var cnt = req.body.cnt;
    var color = req.body.color;
    var size = req.body.size;
    var uid = 3;
    var cartId = req.body.cartId;
    pool.getConnection(function (err, conn) {
        if (err) {
            console.log('연결err :');
            console.log(err);
        }
        var exec0 = conn.query("update carts set cnt=?, color=?, size=? where id = ?", [cnt, color, size, cartId], function (err, modified) {
            if (err) {
                console.log('수정err');
                console.log(err);
            }
            if (modified) {
                console.log('modified : ');
                console.dir(modified);
                // var exec1 = conn.query("select * from carts where userId=?",[uid], function(err, rows){
                //     console.log('장바구니정보 : ');
                //     console.dir(rows);
                //     conn.release();
                //     res.send({rows: rows});
                // });
                res.send('장바구니 수정 성공');
            }

        });
    });
});

//장바구니 삭제 
router.route('/deleteCart').post(function (err, conn) {
    var uid = req.user[0].id;
    var cartId = req.body.cid;

    pool.getConnection(function (req, res) {
        var exec0 = conn.query('delete from carts where id = ?', [cartId], function (err, deleted) {
            if (deleted) {
                console.log(deleted);
            }
            conn.release();
            res.send('delete cart suceess');
        });
    });
});

//바로구매 //pname, price, seller, img
router.route('/paydirect').post(function (req, res) {
    var pid = req.body.productId;

    pool.getConnection(function (err, conn) {

        var exec = conn.query("select * from `products` where `id` IN" + "(" + pid + ")", function (err, productsByPids) {
            console.log('exec : ' + exec.sql);
            if (productsByPids) {
                console.log('productsByPids : ');
                console.log(productsByPids);
            }
        });
        conn.release();
        res.send({ productsByPids: productsByPids });
    });
});


//검색
router.route('/search').post(function (req, res) {
    var keyword = req.body.keyword;
    //var uid = req.user[0].id;
    console.log('검색키워드, uid : ' + keyword + ', ' + uid);
    pool.getConnection(function (err, conn) {
        var exec = conn.query('select * from products where pname like ?', ["%" + keyword + "%"], function (err, searched_products) {
            if (err) {
                console.log(err);
            }
            console.log(exec.sql);
            conn.release();
            if (searched_products) {
                console.log('검색결과 : ');
                console.dir(searched_products);
                res.render('products.ejs', { searched_products: searched_products });
            }
        });
    });
});

//카테고리별 조회
router.route('/productList/:categoryId').get(function (req, res) {
    // var uid = req.user[0].id;
    // console.log('uid : ' + uid);
    categoryId = req.params.categoryId;
    var productRows = [];
    var imgArr = [];
    pool.getConnection(function (err, conn) {
        var pid = [];
        //var imgArr = [];
        var exec = conn.query('select * from products where categoryId= ?', [categoryId], function (err, productsByCid) {
            if (err) {
                console.log(err);
            }
            console.log(exec.sql);
            if (productsByCid) {
                console.log('카테고리에 따른 제품들 : ');
                console.dir(productsByCid);
                productRows = productsByCid.reverse();

                for (var i = 0; i < productsByCid.length; i++) {
                    pid[i] = productsByCid[i].id;
                }
                console.log('pid : ');
                console.log(pid);

                var exec1 = conn.query("select * from `imgByColors` where `productId` IN" + "(" + pid + ")", function (err, imgs) {
                    if (err) {
                        console.log('sql에러');
                        console.log(err);
                    }
                    console.log('exec1 : ');
                    console.log(exec1.sql);
                    console.log('imgs : ');
                    console.log(imgs);
                    if (imgs.length > 0) {
                        for (let i = 0; i < imgs.length; i++) {
                            imgArr.push(imgs[i]);
                        }
                        conn.release();
                        console.log('imgArr : ');
                        console.log(imgArr);
                        res.send({ productRows: productRows, imgArr: imgArr });
                    }
                    else {
                        res.send({ productRows: productRows, imgArr: [] });
                    }

                });
            }
        });

    });
});

//하의조회
// router.route('/bottom').post(function (req, res) {
//     var uid = req.user[0].id;
//     console.log('uid : ' + uid);
//     pool.getConnection(function (err, conn) {
//         var exec = conn.query('select * from products where categoryId=2', function (err, rows) {
//             if (err) {
//                 console.log(err);
//             }
//             console.log(exec.sql);
//             conn.release();
//             if (rows) {
//                 console.log('하의제품들 : ');
//                 console.dir(rows);
//                 res.render('bottom.ejs', { rows: rows, uid, uid });
//             }
//         });
//     });
// });

//상의검색
router.route('/searchTop').post(function (req, res) {
    var uid = req.user[0].id;
    var keyword = req.body.keyword;
    console.log('uid : ' + uid);
    pool.getConnection(function (err, conn) {
        var exec = conn.query('select * from products where categoryId=1 and pname like ?', ["%" + keyword + "%"], function (err, rows) {
            if (err) {
                console.log(err);
            }
            console.log(exec.sql);
            conn.release();
            if (rows) {
                console.log('상의검색결과 : ');
                console.dir(rows);
                res.render('top.ejs', { rows: rows, uid: uid });
            }
        });
    });
});

//하의검색
router.route('/searchBottom').post(function (req, res) {
    var uid = req.user[0].id;
    var keyword = req.body.keyword;
    console.log('uid : ' + uid);
    pool.getConnection(function (err, conn) {
        var exec = conn.query('select * from products where categoryId=2 and pname like ?', ["%" + keyword + "%"], function (err, rows) {
            if (err) {
                console.log(err);
            }
            conn.release();
            if (rows) {
                console.log('하의검색결과 : ');
                console.dir(rows);
                res.render('bottom.ejs', { rows: rows, uid: uid });
            }
        });
    });
});

//상품상세보기
router.route('/product/:id').get(function (req, res) {
    var productid = req.params.id;
    var uid = 1; // 임시로 uid1넣은거니까 나중에수정!!!!!!!!!!

    console.log('선택한 상품 :' + productid);
    console.log('현재 유저 정보 :' + uid);
    pool.getConnection(function (err, conn) {
        var exec = conn.query("select * from products where id = ?", productid,
            function (err, row) {
                var selected_product = row;
                console.log('selected_product : ');
                console.log('실행sql :' + exec.sql);
                var exec2 = conn.query("select * from productInfo where productId =?", productid, function (err, detail) {
                    console.log('detail : ');
                    console.log(detail);
                    var exec3 = conn.query("select * from reviews where productId =?", productid, function (err, reviews) {
                        console.log('exec3 : ' + exec3.sql);

                        if (reviews) { //해당상품에대한 리뷰가 있는 경우
                            console.log('reviews : ');
                            console.dir(row + reviews);

                            var exec4 = conn.query("select * from imgByColors where productId =?", productid, function (err, colors) {
                                console.log('exec4 : ' + exec4.sql);
                                conn.release();
                                res.send({ selected_product: selected_product, detail: detail, reviews: reviews.reverse(), colors: colors });
                                //res.render('product.ejs',{ selected_product: selected_product, detail: detail, reviews: reviews, colors: colors });
                            });

                        } else { //해당상품에대한 리뷰가 없는 경우
                            console.log('리뷰없음');
                            console.dir(row);
                            //res.render('product.ejs', { result: selected_product, uid: uid });
                            var exec5 = conn.query("select * from imgByColors where productId =?", productid, function (err, colors) {
                                console.log('exec5 : ' + exec5.sql);
                                conn.release();
                                res.send({ selected_product: selected_product, detail: detail, reviews: [], colors: colors });
                                //res.render({ result: selected_product, detail: detail, reviews: [], colors: colors });
                            });
                        }
                    });
                });
            }
        );
    });
});


//리뷰작성
router.post('/review', upload.array('photo', 3), function (req, res, next) {

    var productId = req.body.productid;
    var content = req.body.content;
    //var uid = req.user[0].id;
    var uid = 3;
    var username = req.user[0].name;
    console.log('file :');
    console.dir(req.files);

    console.log('요청 파라미터 : ,' + productId + ', ' + content);

    var filename = req.files[0].location;
    console.log('filename1 : ' + filename);

    pool.getConnection(function (err, conn) {

        var data;
        console.log('리뷰작성');

        data = { content: content, productId: productId, userId: uid, user_email: username, img: filename, img2: req.files[1].location, img3: req.files[2].location };
        var exec2 = conn.query('insert into reviews set ?', data, function (err, addresult) {
            if (err) {
                conn.release();
                console.log('err2 : ' + err);
            }
            console.log(exec2.sql);
            if (addresult) {
                console.log('리뷰등록결과:');
                console.dir(addresult);
                conn.release();
                res.send('review add success');
            }
        });

        // var exec3 = conn.query("select * from products where id = ?", productId,
        //     function (err, row) {
        //         var selected_product = row;
        //         console.log('selected_product : ');
        //         console.dir(row);
        //         console.log('실행sql :' + exec3.sql);
        //         var exec4 = conn.query("select * from reviews where productId =?", productId, function (err, reviews) {
        //             console.log('exec4 : ' + exec4.sql);
        //             conn.release();
        //             if (!reviews) {
        //                 console.log('리뷰없음');
        //                 res.render('product.ejs', { selected_product: selected_product, reviews: [] });
        //             }
        //             if (reviews) { //해당상품에대한 리뷰가 있는 경우
        //                 console.log('리뷰있음');
        //                 console.log('reviews : ');
        //                 console.dir(reviews);

        //                 res.render('product.ejs', { selected_product: selected_product, reviews: reviews });
        //             }
        //         });
        //     }
        // );
    });
});

//리뷰에 답변달기 
router.route('/comment').post(function (req, res, next) {

    var writer = req.user[0].name;
    var content = req.body.content;
    var reviewId = req.body.reviewId;

    pool.getConnection(function (err, conn) {
        var data = { writer: writer, content: content, reviewId: reviewId };
        var exec = conn.query('insert into comments set ?', data, function (err, add_result) {
            console.log('exec :' + exec.sql);
            if (err) {
                conn.release();
                console.log('err : ' + err);
            }
            if (add_result) {
                console.log('comment_result : ');
                console.dir(add_result);
                conn.release();
                res.send('commnet add success');
            }
        });

        // var exec3 = conn.query("select * from products where id = ?", productId,
        //     function (err, row) {
        //         var selected_product = row;
        //         console.log('selected_product : ');
        //         console.dir(row);
        //         console.log('실행sql :' + exec3.sql);
        //         var exec4 = conn.query("select * from reviews where productId =?", productId, function (err, reviews) {
        //             console.log('exec4 : ' + exec4.sql);

        //             if (!reviews) {
        //                 console.log('리뷰없음');
        //                 res.render('product.ejs', { selected_product: selected_product, reviews: [] });
        //             }
        //             if (reviews) { //해당상품에대한 리뷰가 있는 경우
        //                 console.log('리뷰있음');
        //                 console.log('reviews : ');
        //                 console.dir(reviews);
        //                 var exec5 = conn.query('select * from comments where reviewId=?', reviewId, function (err, comments) {
        //                     conn.release();
        //                     console.log('exec5 : ' + exec5.sql);
        //                     if (!comments) {
        //                         console.log('답글없음');
        //                         res.render('comments.ejs', { selected_product: selected_product, reviews: reviews, comments: [] });
        //                     }

        //                     if (comments) {
        //                         console.log('comments : ');
        //                         console.dir(comments);
        //                         res.render('comments.ejs', { selected_product: selected_product, reviews: reviews, comments: comments });
        //                     }
        //                 });
        //             }
        //         });
        //     }
        //);
    });
});

//리뷰펼쳐보기
router.route('/openReview').post(function (req, res) {
    var reviewId = req.body.reviewId;
    var uid = req.user[0].id;
    var productId = req.body.productid;

    console.log('open review : ' + reviewId + ', ' + uid);

    pool.getConnection(function (err, conn) {

        var exec4 = conn.query("select * from reviews where id =?", reviewId, function (err, reviews) {
            console.log('exec4 : ' + exec4.sql);

            if (!reviews) {
                console.log('리뷰없음');
                res.render('product.ejs', { reviews: reviews });
            }
            if (reviews) { //해당상품에대한 리뷰가 있는 경우
                console.log('리뷰있음');
                console.log('review : ');
                console.dir(review);
                var exec5 = conn.query('select * from comments where reviewId=?', reviewId, function (err, comments) {
                    conn.release();
                    console.log('exec5 : ' + exec5.sql);
                    if (!comments) {
                        console.log('답글없음');
                        res.render('comments.ejs', { reviews: reviews, comments: [] });
                    }

                    if (comments) {
                        console.log('comments : ');
                        console.dir(comments);
                        res.render('comments.ejs', { reviews: reviews, comments: comments });
                    }
                });
            }
        });
    });
});

//올린상품조회
router.route('/lookupAddedProductList').get(function (req, res) {

    var uid = req.user[0].id;
    var seller = req.user[0].shopname;

    pool.getConnection(function (err, conn) {
        var exec = conn.query("select * from products where seller=?", [seller], function (err, products) {
            console.log(products);
            conn.release();
            res.send({ products: products });
        });
    });
});

//올린상품상세조회
router.route('/lookupAddedProduct').post(function (req, res) {

    var pid = req.body.productId;

    pool.getConnection(function (err, conn) {
        var exec = conn.query("select * from products where id=?", [pid], function (err, product) {
            var exec1 = conn.query("select * from productInfo where productId=?", [pid], function (err, pinfoes) {
                var exec2 = conn.query("select * from imgByColors where productId=?", [pid], function (err, colors) {
                    res.send({ product: product, pinfoes: pinfoes, colors: colors });
                });
            });
        });
    });
});

//올린상품수정(재고)
router.route('/updateProductCnt').post(function (req, res) {

    var productInfo = req.body.productInfo;
    console.log('받은 상품 정보 : ');
    console.dir(productInfo);

    var pid = productInfo.productId;
    var color = productInfo.color;
    var size = productInfo.size;
    var cnt = productInfo.cnt;

    pool.getConnection(function (err, conn) {
        var exec = conn.query("update productInfo set cnt=? where id=?", [cnt, pid], function (err, updated) {
            if (updated) {
                console.log('updated');
                res.send('update complete');
            }
        });
    });
});



//올린상품삭제
router.route('/deleteProduct').post(function (req, res) {

    var pid = req.body.productId;

    pool.getConnection(function (err, conn) {
        var exec = conn.query("delete from productInfo where productId=?", [pid], function (err, deleted) {
            if (deleted) {
                console.log(deleted);
            }
            var exec1 = conn.query("delete from products where id=?", [pid], function (err, deleted2) {
                if (deleted2) {
                    console.log(deleted2);
                }
                var exec2 = conn.query("delete from imgByColors where productId=?", [pid], function (err, deleted3) {
                    if (deleted3) {
                        console.log(deleted3);
                        conn.release();
                        res.send('delete success');
                    }
                });
            });
        });
    });
});


//제휴조회
router.route('/plat_aliance').get(function (req, res) {

    var alianced = [];
    var notAlianced = [];

    pool.getConnection(function (err, conn) {
        var exec = conn.query("select * from shopadmin", function (err, shopadmins) {

            for (var i = 0; i < shopadmins.length; i++) {
                if (shopadmins[i].alianced == 1) {
                    alianced.push(shopadmins[i]);
                }
                if (shopadmins[i].alianced == 0) {
                    notAlianced.push(shopadmins[i]);
                }
            }

            console.log('alianced : ');
            console.dir(alianced);

            console.log('notAlianced : ');
            console.dir(notAlianced);

            conn.release();
            res.send({ alianced: alianced, notAlianced: notAlianced });
        });
    });
});

//제휴승인
router.route('/accept_aliance').post(function (req, res) {
    var shopadminId = req.body.shopadminId;
    console.log('제휴승인아이디 : ');
    console.log(shopadminId);

    pool.getConnection(function (err, conn) {
        var exec = conn.query("update shopadmin set alianced=1 where id=?", [shopadminId], function (err, updated) {
            console.log(exec.sql);
            if (updated) {
                console.log('updated : ');
                console.dir(updated);
            }
            conn.release();
            res.send('suceess aliance');
        });
    });
});

//제휴취소 
router.route('/delete_aliance').post(function (req, res) {

    var shopadminId = req.body.shopadminId;
    console.log('끊을 아이디 : ');
    console.log(shopadminId);

    pool.getConnection(function (err, conn) {
        var exec = conn.query("delete from shopadmin where id=?", [shopadminId], function (err, deleted) {
            console.log(exec.sql);
            if (deleted) {
                console.log('deleted : ');
                console.dir(deleted);
            }

            //conn.release();
            res.send('delete aliance');
        });
    });
});


function getPidsAndCnts(shopname) {
    return new Promise((resolve, reject) => {
        pool.getConnection(async function (err, conn) {
            let myPidArr = [];
            let myCntArr = [];

            conn.query('select productId, cnt from orderDetails INNER JOIN products ON orderDetails.productId = products.id and products.seller=?', [shopname], function (err, pidsAndCnts) {
                if (pidsAndCnts.length > 0) {
                    console.log('pidsAndCnts : ');
                    console.dir(pidsAndCnts);
                    console.log(pidsAndCnts.length);

                    for (let i = 0; i < pidsAndCnts.length; i++) {
                        myPidArr.push(pidsAndCnts[i].productId);
                        myCntArr.push(pidsAndCnts[i].cnt);
                    }
                    console.log(myCntArr);
                    console.log(myPidArr);
                }
                conn.release();
                resolve({ myCntArr: myCntArr, myPidArr: myPidArr });
            });
        });
    });
}

function getCidByPid(pid) {
    return new Promise((resolve, reject) => {
        pool.getConnection(function (err, conn) {
            conn.query('select categoryId from products where id = ?', [pid], function (err, cid) {
                conn.release();
                if (cid) {
                    resolve(cid);
                }
            });
        });
    });
}

function getCidsByPids(myPidArr, myCntArr) {
    return new Promise((resolve, reject) => {
        pool.getConnection(async function (err, conn) {
            var temp = 0;
            var CatgoArr = []; //[0]:상의 [1]:하의 [2]:악세서리 [3]:신발 
            CatgoArr[0] = 0;
            CatgoArr[1] = 0;
            CatgoArr[2] = 0;
            CatgoArr[3] = 0;
            let cid;

            for (let i = 0; i < myPidArr.length; i++) {
                cid = await getCidByPid(myPidArr[i]);
                console.log("cid : ");
                console.dir(cid);
                console.log(cid[0].categoryId);
                //console.log(cid[i].categoryId);

                if (cid[0].categoryId == 1) {
                    temp = CatgoArr[0];
                    CatgoArr[0] = temp + myCntArr[i];
                    continue;
                }
                if (cid[0].categoryId == 2) {
                    temp = CatgoArr[1];
                    CatgoArr[1] = temp + myCntArr[i];
                    continue;
                }
                if (cid[0].categoryId == 3) {
                    temp = CatgoArr[2];
                    CatgoArr[2] = temp + myCntArr[i];
                    continue;
                }
                if (cid[0].categoryId == 4) {
                    temp = CatgoArr[3];
                    CatgoArr[3] = temp + myCntArr[i];
                    continue;
                }
            }
            conn.release();
            resolve({ CatgoArr: CatgoArr });
        });
    });
}

//1.해당쇼핑몰의 카테고리별로 팔린 수량 조회 
router.route('/cntByCategory').get(async function (req, res) {

    //var uid = req.user.id;
    var uid = 15;
    //var shopname = req.user.name;
    var shopname = '프롬비기닝';

    try {
        let result1 = await getPidsAndCnts(shopname);
        console.log('result1 : ');
        console.dir(result1);
        let result2 = await getCidsByPids(result1.myPidArr, result1.myCntArr);
        console.log('result2 : ');
        console.dir(result2);

        res.json(result2);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'error발생' });
    }
});

function getPnameByPid(pid) {
    return new Promise((resolve, reject) => {
        pool.getConnection(function (err, conn) {
            conn.query('select pname from products where id = ?', [pid], function (err, pname) {
                conn.release();
                resolve(pname);
            });
        });
    });
}

function getCidsAndPnamesByPids(pidArr) {
    return new Promise((resolve, reject) => {
        pool.getConnection(async function (err, conn) {
            let CatArr = [];
            let PnameArr = [];
            let cid;
            let pname;
            for (let i = 0; i < pidArr.length; i++) {
                cid = await getCidByPid(pidArr[i]);
                CatArr.push(cid);
                pname = await getPnameByPid(pidArr[i]);
                PnameArr.push(pname);
            }
            conn.release();
            resolve({ PnameArr, CatArr });
        });
    });
}

//해당쇼핑몰의 카테고리별 상품판매그래프
router.route('/salesByCategory').get(async function (req, res) {

    //var uid = req.user.id;
    var uid = 15;
    //var shopname = req.user.name;
    var shopname = '프롬비기닝';

    try {
        let pidsAndCnts = await getPidsAndCnts(shopname);
        console.dir(pidsAndCnts);
        let PnamesAndCids = await getCidsAndPnamesByPids(pidsAndCnts.myPidArr);
        console.dir(PnamesAndCids);

        console.dir(PnamesAndCids.PnameArr);
        console.dir(PnamesAndCids.CatArr);

        res.json({ pidsAndCnts: pidsAndCnts, PnamesAndCids: PnamesAndCids });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'error발생' });
    }
});

//해당쇼핑몰의 결제내역 최신순 조회 
router.route('/orderList').get(function (req, res) {

    //var uid = req.user.id;
    var uid = 15;
    //var shopname = req.user.name;
    var shopname = '프롬비기닝';

    pool.getConnection(function (err, conn) {

    });


});


app.use('/', router);

http.createServer(app).listen(app.get('port'), function () {
    console.log('서버가 시작되었습니다. 포트: ' + app.get('port'));
});
