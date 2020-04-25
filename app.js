var express = require('express');
var http = require('http');
var path = require('path');

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

var pool = mysql.createPool({
    connectionLimit: 10,
    host: 'capstone-project.cojwntxe9hru.ap-northeast-2.rds.amazonaws.com',
    user: 'user2',
    port: 3306,
    password: 'PASS',
    database: 'capstone',
    debug: false
});

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
console.log('뷰 엔진이 ejs로 설정되었습니다.');

app.set('port', process.env.PORT || 3000);
app.use(bodyParser.json({ type: 'application/json' }));
app.use(bodyParser.urlencoded({ extended: true }));

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
        // if (err) {
        //     console.log('커넥션err1 : ' + err);
        //     if (conn) {
        //         conn.release();
        //     }
        // }
        var exec = conn.query("select * from users where email=? and password=?", [email, password], function (err, user) {
            if(err){
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
        // if (err) {
        //     console.log('커넥션err2 : ' + err);
        //     if (conn) {
        //         conn.release();
        //     }
        // }
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

router.route('/addproduct').get(function (req, res) {
    res.render('addproduct.ejs');
});

router.route('/logout').get(function (req, res) {
    res.render('home.ejs');
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

    pool.getConnection(function (err, conn) {
        var exec = conn.query("select * from products", function (err, list) {
            console.log(exec.sql);
            conn.release();
            if (list.length > 0) {
                console.dir(list);
                res.render('products.ejs', { list: list });
            }
        });
    });
});

var AWS = require('aws-sdk');
var multerS3 = require('multer-s3');
AWS.config.loadFromPath(__dirname + "/config/awsconfig.json");
console.log(__dirname);
var upload = multer({
    storage: multerS3({
        s3: new AWS.S3(),
        bucket: 'swcap02',
        key: function (req, file, cb) {
            var extension = path.extname(file.originalname);
            var basename = path.basename(file.originalname, extension);
            cb(null, 'product/' + basename + '-' + Date.now().toString() + extension);
        },
        acl: 'public-read-write'
    })
});
//상품 등록 하기 
router.post('/addproduct', upload.array('photo', 8), function (req, res, next) {

    var productname = req.body.productname;
    //var seller = req.user[0].name;
    var price = req.body.price;
    var categoryId = req.body.categoryId;
    var createdAt = req.body.createdAt;
    var gender = req.body.gender;
    console.log('요청 파라미터 : ' + productname + ', ' + price + ', ' + categoryId + ', ' + createdAt);

    // console.log('file :');
    // console.dir(req.files);
    // console.log('파일길이 : '+req.files.length);
    // var filename = req.files[0].location; //대표이미지(섬네일)
    // console.log('filename1 : ' + filename);
    // var filename2 = req.files[1].location; //description이미지
    // console.log('filename2 : ' + filename2);
    
    var colors = req.body.color;
    var size = req.body.size;
    var cnt = req.body.cnt;
    var rowLen = colors.length * size.length;

    console.log('colors : ');
    console.dir(colors);

    console.log('size : ');
    console.dir(size);

    var resized = new Array();
    var j=0;
    for(var i=2;i<req.files.length;i++){
        resized[j] = req.files[i].location;
        console.log('resized'+i+':');
        console.log(resized[i]);
        j++; 
    }
    
    pool.getConnection(function (err, conn) {
        var pid;
        var data;
        var Infodata = new Array();

        var exec1 = conn.query('select * from products', function (err, rows) {
            if (err) {
                console.log('err1 : ' + err);
                conn.release();
            }
            console.log(exec1.sql);
            console.dir(rows);
            if (rows.length > 0) {
                pid = rows.length + 1;
                console.log('pid : ' + pid);
                data = { id: pid, seller: seller, pname: productname, price: price, description: filename2, categoryId: categoryId, img: filename, createdAt: createdAt, gender:gender };
            } else {
                pid = 1;
                console.log('pid1:' + pid);
                data = { id: pid, seller: seller, pname: productname, price: price, description: filename2, categoryId: categoryId, img: filename, createdAt: createdAt, gender:gender };
            }
            var exec2 = conn.query('insert into products set ?', data, function (err, result) {
                if (err) {
                    console.log('err2 : ' + err);
                    conn.release();
                }
                console.log(exec2.sql);
                if (result) {
                    console.log('상품등록결과:' + result);
                    //res.render('addresult.ejs', { data: data });
                }
            });
            
            var i = 0;
            for(var c=0; c<colors.length; c++){
                for(var s=0; s<size.length; s++){
                    Infodata[i] = {productId : pid, color : colors[c], size : size[s], resizedImg : resized[c]};
                    i++;
                }
            }
            for(var j=0; j<i; j++){
                var exec3 = conn.query('insert into productInfo set ?', Infodata[j], function(err, result){
                    if(err){
                        console.log('err3 : '+err);
                    }
                    console.log(exe3.sql);
                    if(result){
                        console.log('상품등록결과2:' + result);
                        res.render('addresult.ejs', { data: data});
                    }
                });
            }
        });

    }); 
});

//장바구니담기
router.route('/basket').post(function (req, res) {
    
    var pid = req.body.productid;
    var productname = req.body.productname;
    var img = req.body.img;
    var uid = req.user[0].id;
    var cnt = req.body.cnt;
    console.log('장바구니에 담을 상품이름 :' + productname);
    console.log('장바구니에 담을 상품이미지 : ' + img);
    console.log('장바구니에 담을 상품:' + pid);
    console.log('현재 유저 정보 :' + uid);
    console.log('담을 상품 개수 : ' + cnt);
    pool.getConnection(function (err, conn) {
        var cid;
        var data;
        var exec1 = conn.query('select * from carts', function (err, rows) {
            console.log('실행sql :' + exec1.sql);
            console.dir(rows);
            if (rows.length > 0) {
                cid = rows.length + 1;
                console.log('cid0:' + cid);
                data = { id: cid, userId: uid, productId: pid, pname: productname, cnt: cnt, img: img };
            }
            else {
                cid = 1;
                console.log('cid1:' + cid);
                data = { id: cid, userId: uid, productId: pid, pname: productname, cnt: cnt, img: img };
            }
            var exec2 = conn.query('insert into carts set ?', data, function (err, row) {
                if (err) {
                    console.dir(err);
                }
                console.log('실행sql :' + exec2.sql);
                conn.release();
                if (row) {
                    console.dir(row);
                    console.log('장바구니담기성공!');
                    res.writeHead('200', { 'Content-Type': 'text/html;charset=utf8' });
                    //res.write('<h1>장바구니담기성공!</h1>');
                    res.write('<form id="auto_basket" action="/mycart" method="post">');
                    res.write('<input type="hidden" value=' + uid + ' name="uid">');
                    //res.write('<input type="submit" value="다시쇼핑하러가기">');
                    res.write('</form>');
                    res.write('<script type="text/javascript"> this.document.getElementById("auto_basket").submit(); </script>');
                    res.end();
                }
            });
        });

    });
});

//장바구니 조회
router.route('/mycart').post(function (req, res) {
    var uid = req.user[0].id;
    pool.getConnection(function (err, conn) {
        var exec = conn.query("select * from carts where userId = ?", uid, function (err, rows) {
            console.log(exec.sql);
            conn.release();
            if (rows.length > 0) {
                console.dir(rows);
                res.render('mycart.ejs', { data: rows, uid: uid });
            } else {
                res.writeHead('200', { 'Content-Type': 'text/html;charset=utf8' });
                res.write('<h1>장바구니에 담긴 물건이 없습니다.</h1>');
                res.end();
            }
        });
    });
});

//검색
router.route('/search').post(function (req, res) {
    var keyword = req.body.keyword;
    var uid = req.user[0].id;
    console.log('검색키워드, uid : ' + keyword + ', ' + uid);
    pool.getConnection(function (err, conn) {
        var exec = conn.query('select * from products where pname like ?', ["%" + keyword + "%"], function (err, list) {
            if (err) {
                console.log(err);
            }
            console.log(exec.sql);
            conn.release();
            if (list) {
                console.log('검색결과 : ');
                console.dir(list);
                res.render('products.ejs', { list: list, uid: uid });
            }
        });
    });
});

//상의조회
router.route('/top').post(function (req, res) {
    var uid = req.user[0].id;
    console.log('uid : ' + uid);
    pool.getConnection(function (err, conn) {
        var exec = conn.query('select * from products where categoryId=1', function (err, rows) {
            if (err) {
                console.log(err);
            }
            console.log(exec.sql);
            conn.release();
            if (rows) {
                console.log('상의제품들 : ');
                console.dir(rows);
                res.render('top.ejs', { rows: rows, uid, uid });
            }
        });
    });
});

//하의조회
router.route('/bottom').post(function (req, res) {
    var uid = req.user[0].id;
    console.log('uid : ' + uid);
    pool.getConnection(function (err, conn) {
        var exec = conn.query('select * from products where categoryId=2', function (err, rows) {
            if (err) {
                console.log(err);
            }
            console.log(exec.sql);
            conn.release();
            if (rows) {
                console.log('하의제품들 : ');
                console.dir(rows);
                res.render('bottom.ejs', { rows: rows, uid, uid });
            }
        });
    });
});

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

//상품정보보기
router.route('/product').post(function (req, res) {
    var productid = req.body.productid;
    var uid = req.user[0].id;
    console.log('선택한 상품 :' + productid);
    console.log('현재 유저 정보 :' + uid);
    pool.getConnection(function (err, conn) {
        var exec = conn.query("select * from products where id = ?", productid,
            function (err, row) {
                var selected_product = row;
                console.log('selected_product : ');
                console.dir(row);
                console.log('실행sql :' + exec.sql);
                var exec2 = conn.query("select * from reviews where productId =?", productid, function (err, rows) {
                    console.log('exec2 : ' + exec2.sql);
                    conn.release();
                    if (rows) { //해당상품에대한 리뷰가 있는 경우
                        console.log('reviews : ');
                        console.dir(rows);

                        res.render('product.ejs', { result: selected_product, uid: uid, rows: rows });
                    } else { //해당상품에대한 리뷰가 없는 경우
                        console.log('리뷰없음');
                        res.render('product.ejs', { result: selected_product, uid: uid });
                    }
                });
            }
        );
    });
});

//리뷰작성
router.post('/review', upload.array('photo', 3), function (req, res, next) {

    var productId = req.body.productid;
    var content = req.body.content;
    var uid = req.user[0].id;
    console.log('file :');
    console.dir(req.files);

    console.log('요청 파라미터 : ,' + productId + ', ' + content);

    var filename = req.files[0].location;
    console.log('filename1 : ' + filename);

    pool.getConnection(function (err, conn) {
        var username;
        var data;
        console.log('리뷰작성');
        var exec1 = conn.query('select * from users where id=?', uid, function (err, user) {
            if (err) {
                console.log('err : ' + err);
            }
            console.log(exec1.sql);
            console.log('user : ');
            console.dir(user);
            if (user) {
                username = user[0].email;
                console.log('username : ' + username);
            }
            data = { content: content, productId: productId, userId: uid, user_email: username, img: filename };
            var exec2 = conn.query('insert into reviews set ?', data, function (err, addresult) {
                if (err) {
                    console.log('err2 : ' + err);
                }
                console.log(exec2.sql);
                if (addresult) {
                    console.log('리뷰등록결과:');
                    console.dir(addresult);
                }
            });
        });

        var exec3 = conn.query("select * from products where id = ?", productId,
            function (err, row) {
                var selected_product = row;
                console.log('selected_product : ');
                console.dir(row);
                console.log('실행sql :' + exec3.sql);
                var exec4 = conn.query("select * from reviews where productId =?", productId, function (err, rows) {
                    console.log('exec4 : ' + exec4.sql);
                    conn.release();
                    if (!rows) {
                        console.log('리뷰없음');
                        res.render('product.ejs', { result: selected_product, uid: uid });
                    }
                    if (rows) { //해당상품에대한 리뷰가 있는 경우
                        console.log('리뷰있음');
                        console.log('reviews : ');
                        console.dir(rows);

                        res.render('product.ejs', { result: selected_product, uid: uid, rows: rows });
                    }
                });
            }
        );
    });
});

//리뷰에 답변달기 
router.route('/comment').post(function (req, res, next) {
    var writer = req.body.writer;
    var content = req.body.content;
    var reviewId = req.body.reviewId;
    var uid = req.user[0].id;
    var productId = req.body.productid;

    pool.getConnection(function (err, conn) {
        var data = { writer: writer, content: content, reviewId: reviewId };
        var exec = conn.query('insert into comments set ?', data, function (err, result) {
            console.log('exec :' + exec.sql);
            if (err) {
                console.log('err : ' + err);
            }
            if (result) {
                console.log('comment_result : ');
                console.dir(result);
            }
        });

        var exec3 = conn.query("select * from products where id = ?", productId,
            function (err, row) {
                var selected_product = row;
                console.log('selected_product : ');
                console.dir(row);
                console.log('실행sql :' + exec3.sql);
                var exec4 = conn.query("select * from reviews where productId =?", productId, function (err, rows) {
                    console.log('exec4 : ' + exec4.sql);
                    conn.release();
                    if (!rows) {
                        console.log('리뷰없음');
                        res.render('product.ejs', { result: selected_product, uid: uid });
                    }
                    if (rows) { //해당상품에대한 리뷰가 있는 경우
                        console.log('리뷰있음');
                        console.log('reviews : ');
                        console.dir(rows);
                        var exec5 = conn.query('select * from comments where reviewId=?', reviewId, function (err, comments) {
                            console.log('exec5 : ' + exec5.sql);
                            if (!comments) {
                                console.log('답글없음');
                                res.render('comments.ejs', { result: selected_product, uid: uid, rows: rows });
                            }

                            if (comments) {
                                console.log('comments : ');
                                console.dir(comments);
                                res.render('comments.ejs', { result: selected_product, uid: uid, rows: rows, comments: comments });
                            }
                        });
                    }
                });
            }
        );
    });
});

router.route('/openReview').post(function (req, res) {
    var reviewId = req.body.reviewId;
    var uid = req.user[0].id;
    var productId = req.body.productid;
    console.log('open review : ' + reviewId + ', ' + uid + ', ' + productId);

    pool.getConnection(function (err, conn) {

        var exec3 = conn.query("select * from products where id = ?", productId,
            function (err, row) {
                var selected_product = row;
                console.log('selected_product : ');
                console.dir(row);
                console.log('실행sql :' + exec3.sql);
                var exec4 = conn.query("select * from reviews where productId =?", productId, function (err, rows) {
                    console.log('exec4 : ' + exec4.sql);
                    conn.release();
                    if (!rows) {
                        console.log('리뷰없음');
                        res.render('product.ejs', { result: selected_product, uid: uid });
                    }
                    if (rows) { //해당상품에대한 리뷰가 있는 경우
                        console.log('리뷰있음');
                        console.log('reviews : ');
                        console.dir(rows);
                        var exec5 = conn.query('select * from comments where reviewId=?', reviewId, function (err, comments) {
                            console.log('exec5 : ' + exec5.sql);
                            if (!comments) {
                                console.log('답글없음');
                                res.render('comments.ejs', { result: selected_product, uid: uid, rows: rows });
                            }

                            if (comments) {
                                console.log('comments : ');
                                console.dir(comments);
                                res.render('comments.ejs', { result: selected_product, uid: uid, rows: rows, comments: comments });
                            }
                        });
                    }
                });
            }
        );
    });
});

app.use('/', router);

http.createServer(app).listen(app.get('port'), function () {
    console.log('서버가 시작되었습니다. 포트: ' + app.get('port'));
});
