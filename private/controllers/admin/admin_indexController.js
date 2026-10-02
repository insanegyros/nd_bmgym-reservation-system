const router = require('express').Router();
const path = require('path');
const moment = require('moment');

const settings = require(path.resolve('src/settings'));

//
// https://expressjs.com/en/resources/middleware/session.html
//

const db = require(path.resolve('./private/models', 'Database'));

//$$\                          $$\                       $$\       $$\                                                $$\     
//$$ |                         \__|                     $$  |      $$ |                                               $$ |    
//$$ |      $$$$$$\   $$$$$$\  $$\ $$$$$$$\            $$  /       $$ |      $$$$$$\   $$$$$$\   $$$$$$\  $$\   $$\ $$$$$$\   
//$$ |     $$  __$$\ $$  __$$\ $$ |$$  __$$\          $$  /        $$ |     $$  __$$\ $$  __$$\ $$  __$$\ $$ |  $$ |\_$$  _|  
//$$ |     $$ /  $$ |$$ /  $$ |$$ |$$ |  $$ |        $$  /         $$ |     $$ /  $$ |$$ /  $$ |$$ /  $$ |$$ |  $$ |  $$ |    
//$$ |     $$ |  $$ |$$ |  $$ |$$ |$$ |  $$ |       $$  /          $$ |     $$ |  $$ |$$ |  $$ |$$ |  $$ |$$ |  $$ |  $$ |$$\ 
//$$$$$$$$\\$$$$$$  |\$$$$$$$ |$$ |$$ |  $$ |      $$  /           $$$$$$$$\\$$$$$$  |\$$$$$$$ |\$$$$$$  |\$$$$$$  |  \$$$$  |
//\________|\______/  \____$$ |\__|\__|  \__|      \__/            \________|\______/  \____$$ | \______/  \______/    \____/ 
//                   $$\   $$ |                                                       $$\   $$ |                              
//                   \$$$$$$  |                                                       \$$$$$$  |                              
//                    \______/                                                         \______/                               

router.get('/login', async (req, res) => {
    if (req.session.loggedIn) {
        return res.redirect("/admin")
    }

    let displayAlert = "";
    if (req.query.badlogin == "") {
        displayAlert = `<div class="alert alert-dismissible alert-warning" role="alert">
                            Nesprávné heslo
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                        </div>`
    }
    if (req.query.loggedout == "") {
        displayAlert = `<div class="alert alert-dismissible alert-success" role="alert">
                            Odhlášeno
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                        </div>`
    }

    return res.render("admin/admin_login", {
        pageName: "Přihlášení do administrace",
        content: {
            displayAlert
        }
    });

});

router.post('/login/proceed', async (req, res) => {
    const admin_password = settings.app.admin_password;

    if (req.body.passwordInput === admin_password) {
        req.session.loggedIn = true;
        return res.redirect("/admin")
    }

    return res.redirect("/admin/login?badlogin")

});

router.get('/logout', async (req, res) => {
    req.session.destroy(function (err) {
        return res.redirect("/admin/login?loggedout")
    })

});


// $$$$$$\                       $$\                          $$\     
//$$  __$$\                      $$ |                         $$ |    
//$$ /  \__| $$$$$$\  $$$$$$$\ $$$$$$\    $$$$$$\  $$$$$$$\ $$$$$$\   
//$$ |      $$  __$$\ $$  __$$\\_$$  _|  $$  __$$\ $$  __$$\\_$$  _|  
//$$ |      $$ /  $$ |$$ |  $$ | $$ |    $$$$$$$$ |$$ |  $$ | $$ |    
//$$ |  $$\ $$ |  $$ |$$ |  $$ | $$ |$$\ $$   ____|$$ |  $$ | $$ |$$\ 
//\$$$$$$  |\$$$$$$  |$$ |  $$ | \$$$$  |\$$$$$$$\ $$ |  $$ | \$$$$  |
// \______/  \______/ \__|  \__|  \____/  \_______|\__|  \__|  \____/ 

//  _____          _     _          _ 
// |  __ \        | |   | |        | |
// | |__) | __ ___| |__ | | ___  __| |
// |  ___/ '__/ _ \ '_ \| |/ _ \/ _` |
// | |   | | |  __/ | | | |  __/ (_| |
// |_|   |_|  \___|_| |_|_|\___|\__,_|
//
router.get('/', async (req, res) => {
    if (!req.session.loggedIn) {
        return res.redirect("/admin/login")
    }

    const today = moment();

    // TOTAL = potvrzny i nepotvrzeny db.raw(`COALESCE(SUM(CASE WHEN R_T_ID IS NOT NULL THEN 1 ELSE 0 END), 0) AS RESERVED_TOTAL`),
    const trainingsRaw = await db
        .select([
            "T_ID", "T_NAME", "T_COLOR", "T_BGCOLOR", "T_DATE",
            "T_HOUR", "T_REMARK", "T_MAXMEM", "T_MAXSUB", "T_CANCELLED",
            db.raw(`COALESCE(SUM(CASE WHEN R_CANCELLED = 0 AND R_CONFIRMED = 1 THEN 1 ELSE 0 END),0) AS RESERVED_TOTAL`),
            db.raw(`COALESCE(SUM(CASE WHEN R_CANCELLED = 0 AND R_CONFIRMED = 1 AND R_ISSUB = 1 THEN 1 ELSE 0 END),0) AS RESERVED_SUB`),
            db.raw(`COALESCE(SUM(CASE WHEN R_CANCELLED = 0 AND R_CONFIRMED = 1 AND R_ISSUB = 0 THEN 1 ELSE 0 END),0) AS RESERVED_MEM`)
        ])
        .from("TRAINING")
        .leftJoin("RESERVATION", "R_T_ID", "T_ID")
        .where("T_DATE", ">=", today.format("YYYY-MM-DD"))
        .where("T_CANCELLED", 0)
        .groupBy("T_ID")
        .orderBy("T_DATE", "ASC")
        .orderBy("T_HOUR", "ASC");

    const trainings = trainingsRaw.map((list) => {
        const m = moment(list.T_DATE);
        let regex = new RegExp(/za\s\d{1,2}\shodin?./gm);
        let remaining = "";
        if (today >= m) {
            remaining = "dnes";
        } else if (regex.test(m.fromNow())) {
            remaining = "zítra"
        } else if (m.fromNow() == "za den") {
            remaining = "zítra"
        } else {
            remaining = m.fromNow()
        }

        return {
            id: list.T_ID,
            name: list.T_NAME,
            color: list.T_COLOR,
            bgColor: list.T_BGCOLOR,
            hour: list.T_HOUR,
            ppl: `<b>${list.RESERVED_TOTAL}</b> / ${list.T_MAXMEM + list.T_MAXSUB} <span class="text-secondary">(náhr.: ${list.RESERVED_SUB})<span>`,
            day: m.format("dddd"),
            date: m.format("DD.MM.YYYY"),
            relativeDay: remaining
        }
    })

    return res.render('admin/admin_index', {
        pageName: "Panel správce",
        content: {
            today: today.format('dddd DD.MM.YYYY'),
            trainings: trainings
        }
    });

});


//  _____       _        _ _ 
// |  __ \     | |      (_) |
// | |  | | ___| |_ __ _ _| |
// | |  | |/ _ \ __/ _` | | |
// | |__| |  __/ || (_| | | |
// |_____/ \___|\__\__,_|_|_|
//                           

router.get('/training/:id', async (req, res) => {
    if (!req.session.loggedIn) {
        return res.redirect("/admin/login")
    }

    const today = moment();
    let trainingDb = null;
    let reservationDb = null;
    try {

        trainingDb = await db
        .select([
            "T_ID", "T_NAME", "T_COLOR", "T_BGCOLOR", "T_DATE",
            "T_HOUR", "T_REMARK", "T_MAXMEM", "T_MAXSUB", "T_CANCELLED",
            db.raw(`COALESCE(SUM(CASE WHEN R_CANCELLED = 0 AND R_CONFIRMED = 1 THEN 1 ELSE 0 END),0) AS RESERVED_TOTAL`),
            db.raw(`COALESCE(SUM(CASE WHEN R_CANCELLED = 0 AND R_CONFIRMED = 1 AND R_ISSUB = 1 THEN 1 ELSE 0 END),0) AS RESERVED_SUB`),
            db.raw(`COALESCE(SUM(CASE WHEN R_CANCELLED = 0 AND R_CONFIRMED = 1 AND R_ISSUB = 0 THEN 1 ELSE 0 END),0) AS RESERVED_MEM`)
        ])
        .from("TRAINING")
        .leftJoin("RESERVATION", "R_T_ID", "T_ID")
        .where("T_ID", req.params.id)
        .where("T_DATE", ">=", today.format("YYYY-MM-DD"))
        .where("T_CANCELLED", 0)

        .groupBy("T_ID")
        .orderBy("T_DATE", "ASC")
        .orderBy("T_HOUR", "ASC")
        .first()

    reservationDb = await db
        .select(["R_ID", "R_FNAME", "R_LNAME", "R_ISSUB", "R_CANCELLED", "R_CONFIRMED", "R_EMAIL"])
        .from("RESERVATION")
        .where("R_T_ID", req.params.id)
        .orderBy("R_CANCELLED", "ASC")
        .orderBy("R_ISSUB", "ASC")
        .orderBy("R_ID", "ASC")

    } catch (e) {
        console.log(e)
    }
    
    let trainingParsed = null
    let reservationRows = []
    if(trainingDb){
        trainingParsed = {
            name: trainingDb.T_NAME,
            date: moment(trainingDb.T_DATE).format("YYYY-MM-DD"),
            //date: trainingDb.T_DATE,
            time: trainingDb.T_HOUR,
            mem: trainingDb.RESERVED_MEM,
            maxmem: trainingDb.T_MAXMEM,
            sub: trainingDb.RESERVED_SUB,
            maxsub: trainingDb.T_MAXSUB,
            remark: trainingDb.T_REMARK,
            color: trainingDb.T_COLOR,
            bgColor: trainingDb.T_BGCOLOR,
        }
    }
    if(reservationDb){
        reservationDb.forEach(r =>{
            reservationRows.push(`
                <tr class="${(r.R_CANCELLED == 1)?'table-danger':''}">
                    <td>${r.R_FNAME} ${r.R_LNAME}</td>
                    <td>${r.R_EMAIL}</td>
                    <td>${(r.R_ISSUB == 0)?'<span class=text-primary><i class="bi bi-person-fill"></i></span>':'<span class=text-secondary><i class="bi bi-person-plus-fill"></i></span>'}</td>
                    <td>${(r.R_CONFIRMED == 0)?'<span class="text-danger"><i class="bi bi-x-lg"></i></span>':'<span class="text-success"><i class="bi bi-check-lg"></i></span>'}</td>
                    <td>
                        ${(r.R_CANCELLED == 0)?`<button class="btn btn-sm btn-primary" onclick="actionModal.modal('show'); hydrateActionModal(this, ${r.R_ID}, ${req.params.id});"><i class="bi bi-pencil"></i></button>`:''}
                    </td>
                </tr>
                `)
        })

    }

    return res.render('admin/admin_trainingDetail', {
        pageName: "Detail tréninku",
        content: {
            params: {
                id: req.params.id
            },
            training: trainingParsed,
            reservation: reservationRows
        }
    });

});


module.exports = router;