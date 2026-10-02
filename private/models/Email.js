var nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const settings = require(path.resolve('src/settings'));

const placehold = (template, data) => {
	if (typeof template !== 'string') {
		throw new TypeError(`Expected a \`string\` in the first argument, got \`${typeof template}\``);
	}

	if (typeof data !== 'object') {
		throw new TypeError(`Expected an \`object\` or \`Array\` in the second argument, got \`${typeof data}\``);
	}

	const hashRegex = /##(\d+|[a-z$_][a-z\d$_]*?(?:\.[a-z\d$_]*?)*?)##/gi;

	return template.replace(hashRegex, (_, key) => {
		let result = data;

		for (const property of key.split('.')) {
			result = result ? result[property] : '';
		}

		return String(result);
	});
};

var mail = nodemailer.createTransport({
    host: settings.smtp.host,
    port: settings.smtp.port,
    secure: true,
    auth: {
      user: settings.smtp.user,
      pass: settings.smtp.pass
    }
});

exports.reservationConfirmEmail = async (uuid, recipient) => {
    const template = fs.readFileSync(path.resolve('./src/mailtemplates', 'confirmEmail.html'), {encoding: 'utf-8'});


    var message = {
        from: `${settings.app.project_name} <${settings.smtp.user}>`,
        to: recipient,
        subject: 'POTVRZENÍ REZERVACE',
        text: `Vaše rezervace byla vytvořena, avšak je potřeba ji potvrdit. Bez potvrzení nebude rezervace platná. Prosím, zkopírujte následující odkaz: ${settings.app.project_address}/confirm/reservation/${uuid}`,
        html: placehold(template, {
            LINK: `${settings.app.project_address}/confirm/reservation/${uuid}`,
            PROJNAME: settings.app.project_name,
            PROJADDR: settings.app.project_address,
            UUID: uuid
        })
    };

    return mail.sendMail(message);

}

exports.reservationOverviewEmail = async (uuid, recipient) => {
    const template = fs.readFileSync(path.resolve('./src/mailtemplates', 'overviewEmail.html'), {encoding: 'utf-8'});


    var message = {
        from: `${settings.app.project_name} <${settings.smtp.user}>`,
        to: recipient,
        subject: 'REKAPITULACE REZERVACE',
        text: `Rekapitulaci rezervace naleznete zde: ${settings.app.project_address}/recap/reservation/${uuid}`,
        html: placehold(template, {
            LINK: `${settings.app.project_address}/recap/reservation/${uuid}`,
            PROJNAME: settings.app.project_name,
            PROJADDR: settings.app.project_address,
            UUID: uuid
        })
    };

    return mail.sendMail(message);

}