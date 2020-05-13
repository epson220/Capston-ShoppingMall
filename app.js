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
    connectionLimit: 10,
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
                if (products.length > 0) {
                    console.dir(products);
                    res.send({ productList: reversed_products, imgs: imgs });
                    //res.render('products.ejs', { list: list });
                }
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
    var createdAt = req.body.createdAt;
    var gender = req.body.gender;
    //var seller = req.user[0].shopname; <==나중에 products에 넣을 값

    var color = req.body.color;
    var S = req.body.S;
    var M = req.body.M;
    var L = req.body.L;
    var XL = req.body.XL;
    var colorCnt = 0;

    console.log('color : ');
    console.log(color);
    console.log('색상가지수 : ');
    console.log(color.length);
    for(var i=0;i<color.length;i++){
        if(color[i]!=''){
            colorCnt++;
        }
    }
    console.log('진짜색상가지수 : ');
    console.log(colorCnt);
    
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

    pool.getConnection(function (err, conn) {
        var pid;
        var data;
        var data2 = new Array();
        var data3 = new Array();

        if (err) {
            console.log('디비 연결 에러');
            conn.release();
        }
        data = { pname: productname, price: price, categoryId: categoryId, createdAt: createdAt, gender: gender, img: req.files[0].location, description: req.files[1].location };
        var exec0 = conn.query('insert into products set ?', data, function (err, result) {
            if (err) {
                console.log('err0 : ');
                console.log(err);
                conn.release();
            }
            console.log('exec0 : ' + exec0.sql);
            if (result) {
                console.log('products_result : ');
                console.dir(result);
            }
        });

        var exec1 = conn.query('select id from products', function (err, pids) {
            if (err) {
                console.log('err1 : ');
                console.log(err);
                conn.release();
            }
            console.log('exec1 : ' + exec1.sql);
            console.log('pids : ');
            console.dir(pids);
            if (pids.length > 0) {
                pid = pids.length;
                console.log('pid : ' + pid);
            } else {
                pid = 1;
                console.log('pid : ' + pid);
            }

            var k = 0;
            for (var i = 0; i < colorCnt; i++) {
                for (var j = 0; j < 4; j++) {

                    if ((j == 0)) {
                        data2[k] = { productId: pid, color: color[i], size: 'S', cnt: S[i] };
                    }
                    if ((j == 1)) {
                        data2[k] = { productId: pid, color: color[i], size: 'M', cnt: M[i] };
                    }
                    if ((j == 2)) {
                        data2[k] = { productId: pid, color: color[i], size: 'L', cnt: L[i] };
                    }
                    if ((j == 3)) {
                        data2[k] = { productId: pid, color: color[i], size: 'XL', cnt: XL[i] };
                    }
                    k++;
                }
            }
            console.log('data2 : ');
            console.log(data2);

            for (var i = 0; i < k; i++) {
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
                        res.end('<h2>ADD PRODUCT SUCCESS</h2>');
                    }
                });
            }

        });//exec1

    });//pool.getConnection

});//route.post


//툴바에서 장바구니에 담기
router.route('/toolbarAdd').get(function (req, res) {
    //var imgurl = req.body.imgurl; //색상별이미지url
    var imgurl = 'https://swcap02.s3.ap-northeast-2.amazonaws.com/product/1588584971988%ED%94%8C%EB%9D%BC%EC%9D%B41.PNG';
    //var uid = req.user[0].id;
    uid = 3;
    console.log('imgUrl : ');
    console.dir(imgurl);
    // console.log('req.body : ');
    // console.dir(req.body);

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
            var exec1 = conn.query('select * from carts', function (err, carts) {
                console.log('실행sql :' + exec1.sql);
                console.dir(carts);
                if (carts.length > 0) {
                    cid = carts.length + 1;
                    console.log('cid0:' + cid);
                    data = { id: cid, userId: uid, productId: pid, cnt: cnt, img: img, pname: pname, color: color, size: size };
                }
                else {
                    cid = 1;
                    console.log('cid1:' + cid);
                    data = { id: cid, userId: uid, productId: pid, pname: pname, cnt: cnt, img: img, color: color, size: size };
                }
                var exec2 = conn.query('insert into carts set ?', data, function (err, added_result) {
                    if (err) {
                        console.dir(err);
                    }
                    console.log('실행sql :' + exec2.sql);
                    conn.release();
                    if (added_result) {
                        console.dir(added_result);
                        console.log('장바구니담기성공!');
                        res.writeHead('200', { 'Content-Type': 'text/html;charset=utf8' });
                        //res.write('<h1>장바구니담기성공!</h1>');
                        res.write('<form id="auto_basket" action="/mycart" method="get">');
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
                    resolve(selected_productInfoes);
                }
            );
        });
    });
}

function getProInfoByPid(productids) {
    return new Promise((resolve, reject) => {
        pool.getConnection(async function (err, conn) {

            let result2 = [];
            for (let j = 0; j < productids.length; j++) {
                let selected_productInfoes = await getProInfoByPidQuery(productids[j]);
                console.log('selected_productInfoes : ');
                console.dir(selected_productInfoes);
                if (selected_productInfoes.length > 0) {
                    for (let k = 0; k < selected_productInfoes.length; k++) {
                        result2.push(selected_productInfoes[k]);
                    }
                }
            }
            conn.release();
            resolve({ result2: result2 });
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

        let result2 = await getProInfoByPid(result1.uniquePidArr);
        console.log('results2 : '); 
        console.dir(result2);
        
        res.json({ cartsByUid : result1.cartsByUid, result2 : result2 });
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
        var exec0 = conn.query("update carts set cnt=?, color=?, size=? where id = ?",[cnt, color, size, cartId], function(err, modified){
            if(err){
                console.log('수정err');
                console.log(err);
            }
            if(modified){
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

                var exec1 = conn.query("select * from `imgByColors` where `productId` IN" + "("+pid+")", function (err, imgs) {
                    if(err){
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
                        res.send({productRows:productRows, imgArr: imgArr });
                    }
                    else{
                        res.send({productRows:productRows, imgArr:[]});
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

//상품정보보기
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
                                res.send({ selected_product: selected_product, detail: detail, reviews: reviews, colors: colors });
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
            data = { content: content, productId: productId, userId: uid, user_email: username, img: filename,  img2:req.files[1].location, img3:req.files[2].location};
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
                var exec4 = conn.query("select * from reviews where productId =?", productId, function (err, reviews) {
                    console.log('exec4 : ' + exec4.sql);
                    conn.release();
                    if (!reviews) {
                        console.log('리뷰없음');
                        res.render('product.ejs', { selected_product: selected_product, reviews:[] });
                    }
                    if (reviews) { //해당상품에대한 리뷰가 있는 경우
                        console.log('리뷰있음');
                        console.log('reviews : ');
                        console.dir(reviews);

                        res.render('product.ejs', { selected_product: selected_product, reviews: reviews });
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
        var exec = conn.query('insert into comments set ?', data, function (err, add_result) {
            console.log('exec :' + exec.sql);
            if (err) {
                console.log('err : ' + err);
            }
            if (add_result) {
                console.log('comment_result : ');
                console.dir(add_result);
            }
        });

        var exec3 = conn.query("select * from products where id = ?", productId,
            function (err, row) {
                var selected_product = row;
                console.log('selected_product : ');
                console.dir(row);
                console.log('실행sql :' + exec3.sql);
                var exec4 = conn.query("select * from reviews where productId =?", productId, function (err, reviews) {
                    console.log('exec4 : ' + exec4.sql);
                    
                    if (!reviews) {
                        console.log('리뷰없음');
                        res.render('product.ejs', { selected_product: selected_product, reviews:[] });
                    }
                    if (reviews) { //해당상품에대한 리뷰가 있는 경우
                        console.log('리뷰있음');
                        console.log('reviews : ');
                        console.dir(reviews);
                        var exec5 = conn.query('select * from comments where reviewId=?', reviewId, function (err, comments) {
                            conn.release();
                            console.log('exec5 : ' + exec5.sql);
                            if (!comments) {
                                console.log('답글없음');
                                res.render('comments.ejs', { selected_product: selected_product, reviews: reviews, comments:[] });
                            }

                            if (comments) {
                                console.log('comments : ');
                                console.dir(comments);
                                res.render('comments.ejs', { selected_product: selected_product, reviews: reviews, comments: comments });
                            }
                        });
                    }
                });
            }
        );
    });
});



//리뷰펼쳐보기
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
                var exec4 = conn.query("select * from reviews where productId =?", productId, function (err, reviews) {
                    console.log('exec4 : ' + exec4.sql);
                    
                    if (!reviews) {
                        console.log('리뷰없음');
                        res.render('product.ejs', { selected_product: selected_product, reviews:reviews });
                    }
                    if (reviews) { //해당상품에대한 리뷰가 있는 경우
                        console.log('리뷰있음');
                        console.log('reviews : ');
                        console.dir(reviews);
                        var exec5 = conn.query('select * from comments where reviewId=?', reviewId, function (err, comments) {
                            conn.release();
                            console.log('exec5 : ' + exec5.sql);
                            if (!comments) {
                                console.log('답글없음');
                                res.render('comments.ejs', { selected_product: selected_product, reviews: reviews, comments:[] });
                            }

                            if (comments) {
                                console.log('comments : ');
                                console.dir(comments);
                                res.render('comments.ejs', { selected_product: selected_product, reviews: reviews, comments: comments });
                            }
                        });
                    }
                });
            }
        );
    });
});

//올린상품조회




//제휴조회
router.route('/plat_aliance').get(function(req, res){
    
    pool.getConnection(function(err, conn){
        var exec = conn.query("select * from shopadmin", function(err, shopadmins){
            console.log('shopadmins : ');
            console.dir(shopadmins);
            res.send({shopadmins:shopadmins});
        });
    });
});

//제휴승인
router.route('/accept_aliance').post(function(req, res){
    var shopadminId = req.body.shopadminId;

    pool.getConnection(function(err, conn){
        var exec = conn.query("update shopadmin set aliance=1 where id=?",[shopadminId], function(err, updated){
            console.log(exec.sql);
            if(updated){
                console.log('updated : ');
                console.dir(updated);
            }
            conn.release();
            res.send('suceess aliance');
        });
    });
});

//제휴취소 
router.route('/delete_aliacne').post(function(req, res){
    
    var shopadminId = req.body.shopadminId;

    pool.getConnection(function(err, conn){
        var exec = conn.query("delete from shopadmin where id=?",[shopadminId], function(err, deleted){
            console.log(exec.sql);
            if(deleted){
                console.log('deleted : ');
                console.dir(deleted);
            }
            conn.release();
            res.send('delete aliance');
        });
    });
});


app.use('/', router);

http.createServer(app).listen(app.get('port'), function () {
    console.log('서버가 시작되었습니다. 포트: ' + app.get('port'));
});
