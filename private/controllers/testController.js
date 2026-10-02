const router = require('express').Router();
const path = require('path');
const { reservationConfirmEmail } = require('../models/Email');

router.get('/', async (req, res) => {

    //const resOw = await reservationConfirmEmail("testing-email", "jandyjejandy@gmail.com")
    
    console.log(req.sessionID)
    
    //req.session.destroy(function(err) {
    //    console.log("session destroyed")
    //})
    
    //console.log(req.session)

    return res.json({
        pageName: "Testing Page",
    });

});

module.exports = router;