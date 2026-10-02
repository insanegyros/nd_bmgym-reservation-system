require('dotenv').config({quiet: true})
module.exports = {
    app: {
        //env: process.env.ENV,
        maintenance_mode: false,
        project_name: process.env.PROJECT_NAME,
        project_address: process.env.PROJECT_ADDRESS,
        admin_password: process.env.ADMIN_PASSWORD
    },
    networking: {
        port: process.env.PORT,
        cookie_forever: new Date(253402300000000),
        cookie_secret: process.env.COOKIE_SECRET,
    },
    database: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_DATABASE
    },
    smtp: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
        secure: process.env.SMTP_SECURE
    }
}