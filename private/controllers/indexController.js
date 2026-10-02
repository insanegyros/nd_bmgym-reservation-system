const router = require('express').Router();
const path = require('path');
const moment = require('moment');

const db = require(path.resolve('./private/models', 'Database'));
moment.locale('cs');

router.get('/', async (req, res) => {
    const today = moment();

    // TOTAL = potvrzny i nepotvrzeny db.raw(`COALESCE(SUM(CASE WHEN R_T_ID IS NOT NULL THEN 1 ELSE 0 END), 0) AS RESERVED_TOTAL`),
    const trainingsRaw = await db
        .select([
            "T_ID", "T_NAME", "T_COLOR", "T_BGCOLOR", "T_DATE",
            "T_HOUR", "T_REMARK", "T_MAXMEM", "T_MAXSUB", "T_CANCELLED",
            db.raw(`
                COALESCE(
                  SUM(CASE WHEN R_CANCELLED = 0 AND R_CONFIRMED = 1 THEN 1 ELSE 0 END),
                  0
                ) AS RESERVED_TOTAL
            `)
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
            ppl: `<b>${list.RESERVED_TOTAL}</b> / ${list.T_MAXMEM + list.T_MAXSUB}`,
            day: m.format("dddd"),
            date: m.format("DD.MM.YYYY"),
            relativeDay: remaining
        }
    })

    return res.render('index', {
        pageName: "Hlavní stránka",
        content: {
            today: today.format('dddd DD.MM.YYYY'),
            trainings: trainings
        }
    });

});

module.exports = router;