const router = require('express').Router();
const path = require('path');
const moment = require('moment');

const settings = require(path.resolve('src/settings'));

//
// https://expressjs.com/en/resources/middleware/session.html
//

const db = require(path.resolve('./private/models', 'Database'));


//  _____      _     _             _ 
// |  __ \    (_)   | |           (_)
// | |__) | __ _  __| | __ _ _ __  _ 
// |  ___/ '__| |/ _` |/ _` | '_ \| |
// | |   | |  | | (_| | (_| | | | | |
// |_|   |_|  |_|\__,_|\__,_|_| |_|_|
//                                   


router.get('/add', async (req, res) => {
    if (!req.session.loggedIn) {
        return res.redirect("/admin/login")
    }

    //const m = moment(req.body.tnDate);

    return res.render('admin/admin_trainingAdd', {
        pageName: "Přidání tréninku",
        content: {
            trainings: []
        }
    });

});

router.post('/add/submit', async (req, res) => {
    if (!req.session.loggedIn) {
        return res.redirect("/admin/login")
    }
    let success = false;

    let trainings = [];
    for (let i = 0; i < req.body.repeat; i++) {
        const m = moment(req.body.date);
        const actualDate = m.add(7 * i, "days")

        trainings.push({
            T_NAME: req.body.name,
            T_DATE: actualDate.format("YYYY-MM-DD"),
            T_HOUR: req.body.hour,
            T_MAXMEM: req.body.maxmem,
            T_MAXSUB: req.body.maxsub,
            T_COLOR: req.body.color,
            T_BGCOLOR: req.body.bgColor,
            T_REMARK: req.body.remark
        });
    }
    const addedTrainings = []
    const result = await db("TRAINING").insert(trainings)
    if (result > 0) {
        success = true;

        trainings.forEach(t => {
            addedTrainings.push(`${t.T_NAME} - ${moment(t.T_DATE).format("DD.MM.YYYY")}`)
        });
    }

    return res.render('admin/admin_trainingAddSubmit', {
        pageName: "Trénink přidán",
        content: {
            success,
            addedTrainings
        }
    });

});


//   _____                                _ 
//  / ____|                              (_)
// | (___  _ __ ___   __ _ ______ _ _ __  _ 
//  \___ \| '_ ` _ \ / _` |_  / _` | '_ \| |
//  ____) | | | | | | (_| |/ / (_| | | | | |
// |_____/|_| |_| |_|\__,_/___\__,_|_| |_|_|
//                                          

router.post('/:id/delete', async (req, res) => {
    if (!req.session.loggedIn) {
        return res.redirect("/admin/login")
    }

    let cancelled = false;

    const resCancellationDb = await db("TRAINING")
        .where("T_ID", req.params.id)
        .update("T_CANCELLED", 1)

    if (resCancellationDb > 0) cancelled = true;

    return res.render('admin/admin_trainingCancel', {
        pageName: "Smazání tréninku",
        content: {
            params: {
                id: req.params.id
            },
            cancelled
        }
    });

});

//  ______    _ _ _                 
// |  ____|  | (_) |                
// | |__   __| |_| |_ __ _  ___ ___ 
// |  __| / _` | | __/ _` |/ __/ _ \
// | |___| (_| | | || (_| | (_|  __/
// |______\__,_|_|\__\__,_|\___\___|
//                                  

router.post('/:id/edit', async (req, res) => {
    if (!req.session.loggedIn) {
        return res.redirect("/admin/login")
    }
    
    let edited = false;
    const resEditDb = await db("TRAINING")
        .where("T_ID", req.params.id)
        .update("T_NAME", req.body.trainingName)
        .update("T_DATE", req.body.trainingDate)
        .update("T_HOUR", req.body.trainingHour)
        .update("T_COLOR", req.body.trainingColor)
        .update("T_BGCOLOR", req.body.trainingBgColor)
        .update("T_REMARK", req.body.trainingRemark)

    if (resEditDb > 0) edited = true;

    return res.render('admin/admin_trainingEdit', {
        pageName: "Editace tréninku",
        content: {
            params :{
                id: req.params.id
            },
            edited
        }
    });
});

router.post('/:id/reservation/edit', async (req, res) => {
    if (!req.session.loggedIn) {
        return res.redirect("/admin/login")
    }

    let edited = false;
    const rId = req.body.rId
    const tId = req.body.tId

    let action = null
    if(req.body.toggleType) action = "toggleType";
    if(req.body.cancelReservation) action = "cancelReservation";

    switch(action){
        case 'toggleType':
            let newType = null;
            const currType = await db.select("R_ISSUB").from("RESERVATION").where("R_ID", rId).where("R_T_ID", tId).first();
            if (currType.R_ISSUB == 1) newType = 0;
            if (currType.R_ISSUB == 0) newType = 1;
            if(newType != null){
                const updated = await db("RESERVATION").where("R_ID", rId).where("R_T_ID", tId).update("R_ISSUB", newType)
                if(updated > 0){
                    edited = true;
                }
            }
            break;
        case 'cancelReservation':
            const cancelled = await db("RESERVATION").where("R_ID", rId).where("R_T_ID", tId).update("R_CANCELLED", 1)
            if(cancelled > 0){
                edited = true;
            }
            break;
        default:
            console.log(action)
            break;
    }

    //return res.json({
    //    hotel: "trivago",
    //    params: req.params,
    //    query: req.query,
    //    body: req.body
    //})

    return res.render('admin/admin_trainingReservationEdit', {
    pageName: "Editace rezervace",
        content: {
            params:{
                id: req.params.id,
                rId
            },
            edited
    }
    });
});


module.exports = router;