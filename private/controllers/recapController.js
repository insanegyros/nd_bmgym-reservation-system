const router = require('express').Router();
const path = require('path');
const moment = require('moment');

const db = require(path.resolve('./private/models', 'Database'));

router.get('/reservation/:uuid/', async (req, res) => {
    const today = moment();
    let success = true;
    const resAttDb = await db
        .select(["R_FNAME", "R_LNAME", "R_ISSUB", "R_CANCELLED"])
        .from("RESERVATION")
        .where("R_UUID", req.params.uuid)
        .andWhere("R_CONFIRMED", 1)

    const trainingDb = await db
        .select("T_NAME", "T_DATE", "T_COLOR", "T_BGCOLOR")
        .from("TRAINING")
        .leftJoin("RESERVATION", "R_T_ID", "T_ID")
        .where("T_DATE", ">=", today.format("YYYY-MM-DD"))
        .where("R_UUID", req.params.uuid)
        .andWhere("T_CANCELLED", 0)
        .first()

    let mem = []
    let sub = []

    let trainingParsed = {}
    if (trainingDb == undefined) {
        success = false;
        trainingParsed = {}
    } else {

        trainingParsed = {
            date: moment(trainingDb.T_DATE).format("DD.MM.YYYY"),
            name: trainingDb.T_NAME,
            color: trainingDb.T_COLOR,
            bgColor: trainingDb.T_BGCOLOR
        }
    }

    resAttDb.forEach(item => {

        if (item.R_ISSUB == 1) {
            let z = "";
            if (item.R_CANCELLED) z = "text-danger is-invalid";
            sub.push(`<input type="text"  value="${item.R_FNAME} ${item.R_LNAME}" class="form-control mb-3 ${z}" disabled readonly>`)
        } else {
            let z = "";
            if (item.R_CANCELLED) z = "text-danger is-invalid"
            mem.push(`<input type="text" value="${item.R_FNAME} ${item.R_LNAME}" class="form-control mb-3 ${z}" disabled readonly>`)
        }
    });

    return res.render('recapReservation', {
        pageName: "Rekapitulace",
        content: {
            training: trainingParsed,
            success,
            params: {
                uuid: req.params.uuid,
            },
            mem,
            sub
        }
    });
});

router.post('/reservation/:uuid/cancel', async (req, res) => {
    let cancelled = false;

    const resCancellationDb = await db("RESERVATION")
        .where("R_UUID", req.params.uuid)
        .andWhere("R_CANCELLED", 0)
        .andWhere("R_CONFIRMED", 1)
        .update("R_CANCELLED", 1)

    if (resCancellationDb > 0) cancelled = true;

    return res.render('recapReservationCancel', {
        pageName: "Zrušení rezervace",
        content: {
            params: {
                uuid: req.params.uuid
            },
            cancelled
        }
    });

});

module.exports = router;