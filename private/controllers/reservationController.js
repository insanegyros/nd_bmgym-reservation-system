const router = require('express').Router();
const path = require('path');
const moment = require('moment');
const { v7: uuidv7 } = require('uuid');

const db = require(path.resolve('./private/models', 'Database'));
const { reservationConfirmEmail } = require('../models/Email');

router.get('/:id', async (req, res) => {
    const uuid = uuidv7();
    const today = moment();

    const trainingDb = await db
        .select([
            "T_ID", "T_NAME", "T_COLOR", "T_BGCOLOR", "T_DATE",
            "T_HOUR", "T_REMARK", "T_MAXMEM", "T_MAXSUB", "T_CANCELLED",
            db.raw(`
                COALESCE(
                  SUM(CASE WHEN R_CANCELLED = 0 AND R_CONFIRMED = 1 THEN 1 ELSE 0 END),
                  0
                ) AS RESERVED_TOTAL
            `),
            db.raw(`
                COALESCE(
                  SUM(CASE WHEN R_CANCELLED = 0 AND R_CONFIRMED = 1 AND R_ISSUB = 1 THEN 1 ELSE 0 END),
                  0
                ) AS RESERVED_SUB
            `),
            db.raw(`
                COALESCE(
                  SUM(CASE WHEN R_CANCELLED = 0 AND R_CONFIRMED = 1 AND R_ISSUB = 0 THEN 1 ELSE 0 END),
                  0
                ) AS RESERVED_MEM
            `)
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

    let training = null;
    let freeSpace = true;
    let mem = undefined;
    let sub = undefined;

    if (trainingDb) {
        const m = moment(trainingDb.T_DATE);
        training = {

            name: trainingDb.T_NAME,
            color: trainingDb.T_COLOR,
            bgColor: trainingDb.T_BGCOLOR,

            date: m.format("DD.MM.YYYY"),
            hour: trainingDb.T_HOUR,
            mem: `${trainingDb.RESERVED_MEM}/${trainingDb.T_MAXMEM}`,
            sub: `${trainingDb.RESERVED_SUB}/${trainingDb.T_MAXSUB}`,
            remark: trainingDb.T_REMARK
        }

        if (trainingDb.T_MAXMEM <= trainingDb.RESERVED_MEM && trainingDb.T_MAXSUB <= trainingDb.RESERVED_SUB) freeSpace = false;

        mem = () => {
            let ia = [];
            for (let i = 1; i <= trainingDb.T_MAXMEM - trainingDb.RESERVED_MEM; i++) {
                ia.push(`<input type="text" name="ucastnik" class="form-control mb-3" placeholder="Účastník ${i}">`)
            }
            return ia;
        }
        sub = () => {
            let ia = [];
            for (let i = 1; i <= trainingDb.T_MAXSUB - trainingDb.RESERVED_SUB; i++) {
                ia.push(`<input type="text" name="nahradnik" class="form-control mb-3" placeholder="Náhradník ${i}">`)
            }
            return ia;
        }
    }

    return res.render('reservationDetail', {
        pageName: "Vytvořit rezervaci",
        content: {
            params: {
                id: req.params.id,
                uuid
            },
            training,
            freeSpace,
            inputs: {
                mem,
                sub
            }
        }
    });

});

router.post('/:id/make', async (req, res) => {
    const today = moment();

    const reservationUuid = req.body.uuid;
    let ucastnici = req.body.ucastnik;
    let nahradnici = req.body.nahradnik;
    const userResEmail = req.body.res_email;

    // Osetreni, kdyz je jenom jeden input, aby to bylo furt pole a ne string a v poli furt neco bylo
    if (typeof ucastnici != "object") ucastnici = [req.body.ucastnik];
    if (typeof nahradnici != "object") nahradnici = [req.body.nahradnik];

    // Najdu si misto na treninku
    let success = false;
    let trainingDb = null
    try {
        trainingDb = await db
            .select([
                "T_ID", "T_MAXMEM", "T_MAXSUB",
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
            .first();
    } catch (e) {
        console.log(e)
    }

    //Je na treninku vubec volny misto pro ucastniky? (^ to nahore je kontrola, jestli nejsem vyjebanej kokot)
    if (trainingDb) {
        if ((trainingDb.T_MAXMEM + trainingDb.T_MAXSUB) - trainingDb.RESERVED_TOTAL >= ucastnici.length + nahradnici.length) {
            let memArray = [];
            let subArray = [];
            //jsou jeste volny mista MEM?
            if ((trainingDb.T_MAXMEM - trainingDb.RESERVED_MEM) >= ucastnici.length) {
                ucastnici.forEach((mem) => {
                    if (mem == "") return;
                    let name = mem.split(" ")
                    memArray.push({
                        R_T_ID: req.params.id,
                        R_UUID: reservationUuid,
                        R_EMAIL: userResEmail,
                        R_FNAME: name[0],
                        R_LNAME: name[1] ? name[1] : " "
                    })
                })
            }
            //jsou jeste volny mista SUB
            if ((trainingDb.T_MAXSUB - trainingDb.RESERVED_SUB) >= nahradnici.length) {
                nahradnici.forEach((sub) => {
                    if (sub == "") return;
                    let name = sub.split(" ")
                    subArray.push({
                        R_T_ID: req.params.id,
                        R_UUID: reservationUuid,
                        R_EMAIL: userResEmail,
                        R_FNAME: name[0],
                        R_LNAME: name[1] ? name[1] : " ",
                        R_ISSUB: 1
                    })
                })
            }

            let memInsertDb = null;
            let subInsertDb = null;

            let mSuccess = false;
            let sSuccess = false;

            if (!subArray.length == 0) {
                subInsertDb = await db("RESERVATION").insert(subArray)
            }

            if (subInsertDb) {
                sSuccess = true;
                if (!memArray.length == 0) {
                    memInsertDb = await db("RESERVATION").insert(memArray)
                }
            } else {
                if (nahradnici[0] == "") {
                    sSuccess = true;
                    if (!memArray.length == 0) {
                        memInsertDb = await db("RESERVATION").insert(memArray)
                    }
                }
            }

            if (memInsertDb) {
                mSuccess = true;
            }

            if (mSuccess && sSuccess) {
                success = true;
            }

        }
    }

    if (success) {
        reservationConfirmEmail(reservationUuid, userResEmail)
    }

    return res.render('reservationResult', {
        pageName: "Dokončení rezervace",
        content: {
            params: {
                id: req.params.id,
            },

            training: {
                id: req.params.id
            },
            reservation: {
                success,
                uuid: reservationUuid,
                userEmail: userResEmail,
                ucastnici,
                nahradnici
            }
        }
    });

});

module.exports = router;