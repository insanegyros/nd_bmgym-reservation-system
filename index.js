const express = require("express");
const path = require('path');
const app = express();
const fs = require('fs');
const mustacheExpress = require('mustache-express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser')
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

const settings = require(path.resolve('src/settings'));

app.use(express.static('public'));
app.use(cookieParser(settings.networking.cookie_secret));
app.use(bodyParser.urlencoded())
app.set('views', `${__dirname}/private/views`);
app.set('view engine', 'mustache');

app.set('trust proxy', 1);

app.engine('mustache', mustacheExpress());
app.disable('x-powered-by');

const store = new MySQLStore({
    createDatabaseTable: true,
    expiration: 1000 * 60 * 60 * 24 * 14, // 14 dni
    host: settings.database.host,
    port: 3306,
    user: settings.database.user,
    password: settings.database.password,
    database: settings.database.database,
    schema: {
        tableName: 'SESSION',
        columnNames: {
            session_id: 'S_ID',
            expires: 'S_EXPIRE',
            data: 'S_DATA',
        },
    },
});

app.use(
    session({
        name: 'sess_id',
        secret: String(settings.networking.cookie_secret),
        resave: true,
        saveUninitialized: false,
        store,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 14, // 14 dni
            httpOnly: true,
            sameSite: 'lax',
            secure: false,
            path: '/',
        },
    })
);

app.use((req, res, next) => {
    res.locals = {
        projectName: settings.app.project_name,
        projectAddress: settings.app.project_address
    };
    next();
});

//app.all("/*splat", (req, res, next) => {
//    console.log("DEBUG: pseudohandle 500")
//    process.on('uncaughtException', function (err) {
//        console.log(err);
//        return res.status(500).render('404', {
//            pageName: "Ale ne :(",
//            error: {
//                heading: "Chyba 500",
//                text: "Nastala neočekávaná chyba v aplikaci."
//            },
//        });
//    });
//    console.log(req.path);
//});


//TODO: Opravit menu, vsechny akce nad necim presmerovat zpatky na puvodnbi stranku zpusobem jako dela logn

app.use('/', require(path.resolve('./private/controllers/', 'indexController')));
app.use('/reservation/', require(path.resolve('./private/controllers/', 'reservationController')));
app.use('/confirm/', require(path.resolve('./private/controllers/', 'confirmController')));
app.use('/recap/', require(path.resolve('./private/controllers/', 'recapController')));
//app.use('/test/', require(path.resolve('./private/controllers/', 'testController')));

app.use('/admin/training', require(path.resolve('./private/controllers/', 'admin/admin_trainingActions')));
app.use('/admin/', require(path.resolve('./private/controllers/', 'admin/admin_indexController')));

app.use(async (req, res) => {
    return res.status(404).render('404', {
        pageName: "Ale ne :(",
        error: {
            heading: "Chyba 404",
            text: "Požadovaný obsah nebyl nalezen."
        },
    });
});

app.listen(settings.networking.port, () => {
    console.log(`>> Running on http://127.0.0.1:${settings.networking.port}`);
});