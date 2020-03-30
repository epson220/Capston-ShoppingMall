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
var aws_sdk = require('aws-sdk');
var multer_s3 = require('multer-s3');

var pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'test',
    debug: false
});

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
console.log('뷰 엔진이 ejs로 설정되었습니다.');

app.set('port', process.env.PORT || 3000);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/public', static(path.join(__dirname, 'public')));
app.use('/uploads', static(path.join(__dirname, 'uploads')));
app.use(cookieParser());
app.use(expressSession({
    secret: 'me key',
    resave: true,
    saveUninitialized: true
}));

var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, 'uploads');
    },
    filename: function (req, file, callback) {
        var extension = path.extname(file.originalname);
        var basename = path.basename(file.originalname, extension);
        callback(null, basename + Date.now() + extension);
    }
});

var upload = multer({
    storage: storage,
    limits: {
        files: 10,
        fileSize: 1024 * 1024 * 1024
    }
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
})


//사용자인증(로그인)
var authUser = function (userid, password, callback) {
    console.log('authUser호출됨.');

    pool.getConnection(function (err, conn) {
        if (err) {
            if (conn) {
                conn.release();
            }
            callback(err, null);
            return;
        }

        var columns = ['user_num', 'userid', 'password'];
        var tablename = 'shoppingusers';

        var exec = conn.query("select ?? from ?? where userid=? and password =?", [columns, tablename, userid, password],
            function (err, row) {
                conn.release();
                console.log('실행대상 sql:' + exec.sql);
                if (row.length > 0) {
                    console.log('아이디 패스워드 일치하는 사용자 찾음');
                    callback(null, row);
                } else {
                    console.log('일치하는 사용자를 찾지 못함');
                    callback(null, null);
                }
            });
    });
}
router.route('/login').post(function (req, res) {
    console.log('/process/login 호출됨');

    var userid = req.body.userid || req.query.userid;
    var password = req.body.password || req.query.password;

    console.log('요청파라미터 :' + userid + ', ' + password);
    if (pool) {
        authUser(userid, password, function (err, row) {
            if (row) {
                var user_num = row[0].user_num;
                console.log('사용자 번호: ' + user_num);
                console.dir(row);
                req.session.user = {
                    userid: userid,
                    user_num: user_num,
                    authorized: true
                }
                res.writeHead('200', { 'Content-Type': 'text/html;charset=utf8' });
                res.write('<h1>로그인 성공</h1>');
                res.write(userid + '님 환영합니다.');
                res.write('<br><a href="/login">다시로그인</a>');
                res.write('<form action="/products" method="post">');
                res.write('<input type="hidden" value=' + user_num + ' name="user_num">');
                res.write('<input type="submit" value="상품구경하러가기">');
                res.write('</form>');
                res.end();
            }
        });
    }
});

//사용자추가(회원가입)
var addUser = function (email, password, callback) {
    console.log('addUser 호출됨.');

    pool.getConnection(function (err, conn) {
        if (err) {
            if (conn) {
                conn.release();
            }
            callback(err, null);
            return;
        }

        var data = { email: email, password: password };

        var exec = conn.query('insert into shoppingusers set ?', data, function (err, result) {
            conn.release();
            console.log('실행대상 SQL:' + exec.sql);

            if (err) {
                console.log('SQL 실행 시 오류 발생함.');
                console.dir(err);
                callback(err, null);
                return;
            }
            callback(null, result);
        });
    });
}
router.route('/signup').post(function (req, res) {
    console.log('/process/adduser 호출됨.');
    var paramEmail = req.body.email || req.query.id;
    var paramPassward = req.body.password || req.query.password;

    console.log('요청파라미터' + paramEmail + ',' + paramPassward);

    if (pool) {
        addUser(paramEmail, paramPassward, function (err, addedUser) {
            if (err) {
                console.error('사용자 추가 중 오류발생:' + err.stack);

                res.writeHead('200', { 'Content-Type': 'text/html;charset=utf8' });
                res.write('<h2>사용자추가중오류발생</h2>');
                res.write('<p>' + err.stack + '</p>');
                res.end();
                return;
            }

            if (addedUser) {
                console.dir(addedUser);
                res.writeHead('200', { 'Content-Type': 'text/html;charset=utf8' });
                res.write('<h2>사용자 추가 성공</h2>');
                res.write('<br><a href="/login">다시로그인</a>');
                res.write('<form action="/products" method="post">');
                res.write('<input type="hidden" value=' + paramEmail + '>');
                res.write('<input type="submit" value="상품구경하러가기">');
                res.write('</form>');
                res.end();
            } else {
                res.writeHead('200', { 'Content-Type': 'text/html;charset=utf8' });
                res.write('<h2>사용자 추가 실패</h2>');
                res.end();
            }
        });
    } else {
        res.writeHead('200', { 'Content-Type': 'text/html;charset=utf8' });
        res.write('<h2>데이터베이스연결실패<h2>');
        res.end();
    }
});
//상품목록조회
router.route('/products').post(function (req, res) {
    var user_num = req.body.user_num;
    console.log('사용자번호:' + user_num);
    if (req.session.user) {
        pool.getConnection(function (err, conn) {
            var exec = conn.query("select * from products", function (err, list) {
                conn.release();
                if (list.length > 0) {
                    console.dir(list);
                    res.render('products.ejs', { list: list, user_num: user_num });
                }
            });
        });
    } else {
        res.redirect('/views/login.ejs');
    }
});
//상품정보보기
router.route('/product').post(function (req, res) {
    var productid = req.body.productid;
    var user_num = req.body.user_num;
    console.log('선택한 상품 :' + productid);
    console.log('현재 유저 정보 :' + user_num);
    pool.getConnection(function (err, conn) {
        var exec = conn.query("select * from products where productid = ?", productid,
            function (err, row) {
                conn.release();
                console.log('실행sql :' + exec.sql);
                if (row.length > 0) {
                    console.dir(row);
                    res.render('product.ejs', { result: row, user_num: user_num });
                }
            }
        );
    });
});
//상품등록하기
router.route('/addproduct').post(upload.array('photo', 1), function (req, res) {
    var productname = req.body.productname;
    var files = req.files;
    var filename = files[0].filename;
    console.dir(req.files[0]);
    pool.getConnection(function (err, conn) {
        console.log(data);
        var a;
        var exec1 = conn.query('select coalesce(max(productid),0) from products', function (err, maxid) {
            a = maxid;
        });
        var data = { productname: productname, filename: filename, productid: a }
        var exec2 = conn.query('insert into products set ?', data, function (err, result) {
            conn.release();
            if (result) {
                console.dir(result);
                var data2 = { productname: productname, filename: "/uploads/" + filename };
                res.render('addresult.ejs', { data: data2 });
            }
        });
    });
});

//장바구니담기
router.route('/basket').post(function (req, res) {
    //var uid = sessionStorage.getItem(uid);
    var pid = req.body.productid;
    
    var user_num = req.body.user_num;
    console.log('장바구니에 담을 상품:' + pid);
    console.log('현재 유저 정보 :' + user_num);
    pool.getConnection(function (err, conn) {
        var cid;
        var data;
        var exec1 = conn.query('select * from basket', function (err, rows) {
            console.log('실행sql :' + exec1.sql);
            console.dir(rows);
            if (rows.length>0) {
                cid = rows.length + 1;
                console.log('cid1:'+cid);
                data = { cartid: cid, user_num: user_num, productid: pid };
            }
            var exec2 = conn.query('insert into basket set ?', data, function (err, row) {

                if(err){
                    console.dir(err);
                }
                console.log('실행sql :' + exec2.sql);
                conn.release();
                if (row) {
                    console.dir(row);
                    console.log('장바구니담기성공!');
                    res.writeHead('200', { 'Content-Type': 'text/html;charset=utf8' });
                    res.write('<h1>장바구니담기성공!</h1>');
                
                    res.write('<form action="/products" method="post">');
                    res.write('<input type="hidden" value=' + user_num + ' name="user_num">');
                    res.write('<input type="submit" value="다시쇼핑하러가기">');
                    res.write('</form>');
                    res.end();
                }
            });
        });
        
    });
});

app.use('/', router);

// var errorHandler = expressErrorHandler({
//     static : {
//         '404':'./public/404.html'
//     }
// });
// app.use(expressErrorHandler.httpError(404));
// app.use(errorHandler);

http.createServer(app).listen(app.get('port'), function () {
    console.log('서버가 시작되었습니다. 포트: ' + app.get('port'));
});
