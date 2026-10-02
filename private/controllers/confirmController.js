const router = require('express').Router();
const path = require('path');

const db = require(path.resolve('./private/models', 'Database'));
const { reservationOverviewEmail } = require('../models/Email');

router.get('/reservation/:uuid', async (req, res) => {
    let confirmed = false;
    let resConfirmationDb = null;

    const resEmail = await db
        .select("R_EMAIL")
        .from("RESERVATION")
        .where("R_UUID", req.params.uuid)
        .first()

    if(resEmail.R_EMAIL){

        resConfirmationDb = await db("RESERVATION")
        .where("R_UUID", req.params.uuid)
        .andWhere("R_CANCELLED", 0)
        .andWhere("R_CONFIRMED", 0)
        .update("R_CONFIRMED", 1)

        if (resConfirmationDb > 0) confirmed = true;

    }

    if(confirmed){
        reservationOverviewEmail(req.params.uuid, resEmail.R_EMAIL)
    }

    return res.render('confirmReservation', {
        pageName: "Potvrzení rezervace",
        content: {
            params: {
                uuid: req.params.uuid
            },
            confirmed
        }
    });

});

module.exports = router;